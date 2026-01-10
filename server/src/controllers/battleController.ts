// 📁 server/src/controllers/battleController.ts - Battle controller
// 🎯 Core function: Handles battle creation, attacks, and turn management
// 🔗 Key dependencies: prisma, CombatEngine, DiceEngine
// 💡 Usage: Called by battleRoutes

import { Request, Response } from 'express';
import * as crypto from 'crypto';
import prisma from '../db';
import { CombatEngine } from '../utils/combatEngine';
import { EffectsEngine } from '../utils/effectsEngine';
import { SkillsEngine } from '../utils/skillsEngine';
import { DiceEngine as DICE } from '../utils/diceEngine';
import { 
  BattleStatus, 
  ArmorCategory, 
  PenetrationType, 
  CharacterStats, 
  ActiveEffect, 
  EffectType, 
  BattleParticipant, 
  CharacterBonuses,
  ParticipantStatus,
  SkillTemplate,
  CharacterSkill
} from '../types/game';

import type { 
  BattleParticipant as PrismaBattleParticipant, 
  Character as PrismaCharacter,
  // @ts-ignore
  CharacterSkill as PrismaCharacterSkill,
  // @ts-ignore
  SkillTemplate as PrismaSkillTemplate 
} from '@prisma/client';

// * Local extended types to handle Prisma client inconsistency
interface ExtendedParticipant extends PrismaBattleParticipant {
  activeEffects: string;
  bonuses: string | null;
}

const syncParticipantToCharacter = async (participant: BattleParticipant | ExtendedParticipant) => {
  if (!participant.characterId) return;

  const character = await (prisma as any).character.findUnique({
    where: { id: participant.characterId }
  });

  if (!character) return;

  const stats: CharacterStats = JSON.parse(character.stats);
  stats.essence.current = participant.currentHp;
  stats.protection.current = participant.currentProtection;

  await (prisma as any).character.update({
    where: { id: participant.characterId },
    data: {
      stats: JSON.stringify(stats)
    }
  });
};

const formatBattle = (battle: any) => {
  if (!battle) return null;
  return {
    ...battle,
    log: typeof battle.log === 'string' ? JSON.parse(battle.log) : battle.log,
    participants: battle.participants.map((p: any) => ({
      ...p,
      bonuses: p.bonuses ? JSON.parse(p.bonuses) : { evasion: 0, accuracy: 0, damageResistance: 0, initiative: 0 },
      activeEffects: p.activeEffects ? JSON.parse(p.activeEffects) : [],
      isBlocking: p.isBlocking || false,
      status: p.status || ParticipantStatus.ALIVE,
      downedRoundsRemaining: p.downedRoundsRemaining ?? 0
    }))
  };
};

const DOWNED_ROUNDS = 3;

const getParticipantStatus = (participant: any): ParticipantStatus => {
  return (participant?.status as ParticipantStatus) || ParticipantStatus.ALIVE;
};

const ensureDownedStatus = (participant: any, logs?: string[]): void => {
  if (getParticipantStatus(participant) === ParticipantStatus.ALIVE && participant.currentHp <= 0) {
    participant.status = ParticipantStatus.DOWNED;
    participant.downedRoundsRemaining = DOWNED_ROUNDS;
    if (logs) {
      logs.push(`${participant.name} падает без сознания.`);
    }
  }
};

export const startBattle = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { playerCharacterId, enemyId, isMonster } = req.body;

    // * Check if an active battle already exists for this character
    const existingBattle = await (prisma as any).battle.findFirst({
      where: {
        status: BattleStatus.ACTIVE,
        participants: {
          some: { characterId: playerCharacterId }
        }
      },
      include: { participants: true }
    });

    if (existingBattle) {
      // * Check if this battle should actually be finished
      const hasDeadParticipant = existingBattle.participants.some((p: any) => getParticipantStatus(p) === ParticipantStatus.DEAD);
      if (hasDeadParticipant) {
        await (prisma as any).battle.update({
          where: { id: existingBattle.id },
          data: { status: BattleStatus.FINISHED }
        });
      } else {
        return res.json({
          battle: formatBattle(existingBattle),
          message: 'Active battle resumed'
        });
      }
    }

    const playerChar = await (prisma as any).character.findUnique({
      where: { id: playerCharacterId, userId },
      include: { inventory: true }
    });

    if (!playerChar) {
      return res.status(404).json({ error: 'Player character not found' });
    }

    let enemyName = 'Unknown';
    let enemyHp = 100;
    let enemyProtection = 100;
    let enemyMonsterId: string | null = null;
    let enemyCharacterId: string | null = null;

    if (isMonster) {
      const monsterTemplate = await (prisma as any).monsterTemplate.findUnique({
        where: { id: enemyId }
      });
      if (!monsterTemplate) return res.status(404).json({ error: 'Monster template not found' });
      enemyName = monsterTemplate.name;
      enemyHp = monsterTemplate.baseEssence;
      enemyProtection = monsterTemplate.baseEssence;
      enemyMonsterId = monsterTemplate.id;
    } else {
      const enemyChar = await (prisma as any).character.findUnique({
        where: { id: enemyId }
      });
      if (!enemyChar) return res.status(404).json({ error: 'Enemy character not found' });
      const stats = JSON.parse(enemyChar.stats);
      enemyName = enemyChar.name;
      enemyHp = stats.essence.current;
      enemyProtection = stats.protection.current;
      enemyCharacterId = enemyChar.id;
    }

    const playerStats = JSON.parse(playerChar.stats);
    const playerBonuses = JSON.parse(playerChar.bonuses);

    // * Roll Initiative
    const playerInitRoll = DICE.roll(100);
    const playerInit = playerInitRoll + (playerBonuses.initiative || 0);
    const enemyInit = DICE.roll(100);

    const initialRolls = [
      { sides: 100, result: playerInitRoll, label: `${playerChar.name}: Инициатива` },
      { sides: 100, result: enemyInit, label: `${enemyName}: Инициатива` }
    ];

    const participants = [
      {
        characterId: playerChar.id,
        name: playerChar.name,
        initiative: playerInit,
        currentHp: playerStats.essence.current,
        currentProtection: playerStats.protection.current,
        maxHp: playerStats.essence.max,
        maxProtection: playerStats.protection.max,
        isPlayer: true,
        distance: -25, // Updated spawn distance
        bonuses: playerChar.bonuses // Store bonuses at start of combat
      },
      {
        characterId: enemyCharacterId,
        monsterTemplateId: enemyMonsterId,
        name: enemyName,
        initiative: enemyInit,
        currentHp: enemyHp,
        currentProtection: enemyProtection,
        maxHp: enemyHp,
        maxProtection: enemyProtection,
        isPlayer: false,
        distance: 25, // Updated spawn distance, total 50m
        bonuses: JSON.stringify({ accuracy: 0, evasion: 0, initiative: 0, damageResistance: 0 }) // Monsters currently have no bonuses
      }
    ].sort((a, b) => b.initiative - a.initiative);

    const battle = await (prisma as any).battle.create({
      data: {
        locationId: JSON.parse(playerChar.location).locationId,
        status: BattleStatus.ACTIVE,
        currentTurnIndex: 0,
        log: JSON.stringify(['Бой начался!']),
        participants: {
          create: participants.map(p => ({
            characterId: p.characterId,
            monsterTemplateId: p.monsterTemplateId,
            name: p.name,
            initiative: p.initiative,
            currentHp: p.currentHp,
            currentProtection: p.currentProtection,
            maxHp: p.maxHp,
            maxProtection: p.maxProtection,
            isPlayer: p.isPlayer,
            distance: p.distance,
            bonuses: p.bonuses,
            isBlocking: false, // * Initialize blocking flag
            status: ParticipantStatus.ALIVE,
            downedRoundsRemaining: 0
          }))
        }
      },
      include: { participants: true }
    });

    res.status(201).json({
      battle: formatBattle(battle),
      rolls: initialRolls
    });
  } catch (error) {
    console.error('Start battle error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: errorMessage || 'Internal server error' });
  }
};

export const move = async (req: Request, res: Response) => {
  try {
    const { battleId, participantId, direction, targetDistance } = req.body; // direction: 'left' | 'right' | 'towards' | 'away'

    const battle = await (prisma as any).battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const participant = battle.participants.find((p: any) => p.id === participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    if (getParticipantStatus(participant) !== ParticipantStatus.ALIVE) {
      return res.status(400).json({ error: 'Cannot move while downed or dead' });
    }

    // * Check turn
    if (battle.participants[battle.currentTurnIndex].id !== participant.id) {
      return res.status(400).json({ error: "It's not your turn" });
    }

    // * Check actions
    if (participant.mainActions <= 0) {
      return res.status(400).json({ error: 'No main actions left for movement' });
    }

    // * Get movement distance based on speed
    let maxMoveDistance = 5; 
    let speedId = 'speed-ordinary';

    if (participant.characterId) {
      const char = await (prisma as any).character.findUnique({ where: { id: participant.characterId } });
      if (char) {
        const stats = JSON.parse(char.stats);
        speedId = stats.speedId;
      }
    } else if (participant.monsterTemplateId) {
      const monster = await (prisma as any).monsterTemplate.findUnique({ where: { id: participant.monsterTemplateId } });
      if (monster) {
        speedId = monster.speedId;
      }
    }

    const speed = await (prisma as any).speed.findUnique({ where: { id: speedId } });
    if (speed) maxMoveDistance = speed.distancePerAction;

    const oldDistance = participant.distance;
    let delta = 0;
    let newDistance = oldDistance;
    const MIN_COMBAT_DISTANCE = 1.5; // Minimum distance between combatants (meters)

    if (typeof targetDistance === 'number') {
      // * Partial movement / Click-to-move
      const requestedDelta = targetDistance - oldDistance;
      delta = Math.sign(requestedDelta) * Math.min(Math.abs(requestedDelta), maxMoveDistance);
      newDistance = oldDistance + delta;
    } else {
      // * Legacy direction-based movement
      const enemies = battle.participants.filter((p: any) => p.isPlayer !== participant.isPlayer && getParticipantStatus(p) === ParticipantStatus.ALIVE);
      const nearestEnemy = enemies.length > 0 
        ? enemies.reduce((prev: any, curr: any) => Math.abs(curr.distance - oldDistance) < Math.abs(prev.distance - oldDistance) ? curr : prev)
        : null;

      if (direction === 'left') delta = -maxMoveDistance;
      else if (direction === 'right') delta = maxMoveDistance;
      else if (direction === 'towards' && nearestEnemy) {
        const dist = nearestEnemy.distance - oldDistance;
        const rawDelta = Math.sign(dist) * Math.min(Math.abs(dist), maxMoveDistance);
        // * Prevent moving too close (maintain minimum combat distance)
        const finalDist = Math.abs(oldDistance + rawDelta - nearestEnemy.distance);
        if (finalDist < MIN_COMBAT_DISTANCE) {
          // Move to exactly MIN_COMBAT_DISTANCE away
          delta = Math.sign(dist) * Math.max(0, Math.abs(dist) - MIN_COMBAT_DISTANCE);
        } else {
          delta = rawDelta;
        }
      } else if (direction === 'away' && nearestEnemy) {
        const dist = nearestEnemy.distance - oldDistance;
        delta = -Math.sign(dist) * maxMoveDistance;
      }

      newDistance = oldDistance + delta;
    }

    // * Final check: ensure we don't violate minimum distance with any enemy
    const allEnemies = battle.participants.filter((p: any) => p.isPlayer !== participant.isPlayer && getParticipantStatus(p) === ParticipantStatus.ALIVE);
    for (const enemy of allEnemies) {
      const finalDist = Math.abs(newDistance - (enemy as any).distance);
      if (finalDist < MIN_COMBAT_DISTANCE) {
        // Adjust to maintain minimum distance
        if (newDistance > (enemy as any).distance) {
          newDistance = (enemy as any).distance + MIN_COMBAT_DISTANCE;
        } else {
          newDistance = (enemy as any).distance - MIN_COMBAT_DISTANCE;
        }
        break; // Only adjust for first enemy found (should be nearest)
      }
    }

    const log: string[] = [];
    const diceLogs: string[] = [];

    // * Check for Attacks of Opportunity
    for (const enemy of battle.participants.filter((p: any) => p.isPlayer !== participant.isPlayer && getParticipantStatus(p) === ParticipantStatus.ALIVE)) {
      const distOld = Math.abs(oldDistance - (enemy as any).distance);
      const distNew = Math.abs(newDistance - (enemy as any).distance);

      if (distOld <= 5 && distNew > distOld) {
        log.push(`Внеочередная атака! ${enemy.name} атакует ${participant.name}, пока тот отступает!`);
        const aooResult = CombatEngine.resolveAttack(
          enemy as unknown as BattleParticipant,
          5, 
          PenetrationType.NONE,
          { minRange: 0, maxRange: 5 },
          participant as unknown as BattleParticipant,
          0, 
          undefined
        );
        
        diceLogs.push(...aooResult.diceLogs);
        log.push(`${enemy.name}: ${aooResult.log}`);
        
        participant.currentHp = Math.max(0, participant.currentHp - aooResult.damageDealt);
        ensureDownedStatus(participant, log);
        if (participant.status === ParticipantStatus.DOWNED) {
          break;
        }
      }
    }

    // * Update participant in DB
    const updatedParticipant = await (prisma as any).battleParticipant.update({
      where: { id: participant.id },
      data: {
        distance: newDistance,
        currentHp: participant.currentHp,
        mainActions: participant.mainActions - 1,
        status: participant.status || ParticipantStatus.ALIVE,
        downedRoundsRemaining: participant.downedRoundsRemaining ?? 0
      }
    });

    await syncParticipantToCharacter(updatedParticipant);

    // * Update log
    const currentLog = JSON.parse(battle.log);
    let movementMessage = `${participant.name} переместился на ${Math.abs(delta)}м`;
    if (direction === 'left') movementMessage += ' влево';
    else if (direction === 'right') movementMessage += ' вправо';
    else if (direction === 'towards') movementMessage += ' к противнику';
    else if (direction === 'away') movementMessage += ' от противника';
    else if (delta > 0) movementMessage += ' вправо';
    else if (delta < 0) movementMessage += ' влево';
    movementMessage += '.';
    const updatedLog = [...currentLog, ...diceLogs, ...log, movementMessage];

    await (prisma as any).battle.update({
      where: { id: battle.id },
      data: { log: JSON.stringify(updatedLog) }
    });

    const updatedBattle = await (prisma as any).battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    res.json({
      battle: formatBattle(updatedBattle),
      message: 'Movement complete'
    });

  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resolveAttack = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { battleId, attackerId, targetId, weaponId } = req.body;

    const battle = await (prisma as any).battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const attacker = battle.participants.find((p: any) => p.id === attackerId);
    const target = battle.participants.find((p: any) => p.id === targetId);

    if (!attacker || !target) {
      return res.status(404).json({ error: 'Participants not found' });
    }

    if (getParticipantStatus(attacker) !== ParticipantStatus.ALIVE) {
      return res.status(400).json({ error: 'Cannot attack while downed or dead' });
    }

    if (getParticipantStatus(target) !== ParticipantStatus.ALIVE) {
      return res.status(400).json({ error: 'Target is downed or dead' });
    }

    // * Check if it's the attacker's turn
    if (battle.participants[battle.currentTurnIndex].id !== attacker.id) {
      return res.status(400).json({ error: "It's not your turn" });
    }

    if (attacker.mainActions <= 0) {
      return res.status(400).json({ error: 'No main actions left' });
    }

    // * Fetch weapon/armor info
    let weaponEssence = 5;
    let weaponPen: PenetrationType = PenetrationType.NONE;
    let weaponRange = { minRange: 0, maxRange: 5 }; // Default unarmed/melee
    let weaponTemplate: any = null;
    let equippedWeapon: any = null;
    let dualWieldWeapons: any[] = [];

    if (attacker.characterId) {
      const char = await (prisma as any).character.findUnique({
        where: { id: attacker.characterId },
        include: { inventory: true }
      });
      if (char && char.inventory) {
        const items = JSON.parse(char.inventory.items);
        
        // * Check for dual-wielding: find all equipped one-handed weapons (excluding shields)
        const equippedOneHanded = items.filter((i: any) => {
          if (!i.isEquipped) return false;
          // * Get template to check category
          return i.templateId && !i.templateId.includes('shield');
        });
        
        // * Fetch templates for equipped weapons to check if they're one-handed
        for (const item of equippedOneHanded) {
          const template = await (prisma as any).itemTemplate.findUnique({ where: { id: item.templateId } });
          if (template && (template.type === 'WEAPON' || template.type === 'SHIELD')) {
            // * Check if it's one-handed (not two-handed, not shield, not magic stabilizer)
            if (template.category !== 'TWO_HANDED' && template.type !== 'SHIELD' && template.category !== 'MAGIC_STABILIZER') {
              dualWieldWeapons.push({ item, template });
            }
          }
        }
        
        // * If dual-wielding (2 one-handed weapons), use both
        if (dualWieldWeapons.length >= 2) {
          // * Use first two weapons for dual-wield
          dualWieldWeapons = dualWieldWeapons.slice(0, 2);
        } else {
          // * Single weapon or unarmed
          equippedWeapon = items.find((i: any) => i.isEquipped && i.id === weaponId);
          if (equippedWeapon) {
            weaponTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: equippedWeapon.templateId } });
            
            // * Magic stabilizer in melee: use unarmed damage (essence = 0 or minimal)
            if (weaponTemplate && weaponTemplate.category === 'MAGIC_STABILIZER') {
              weaponEssence = 0; // * No weapon essence in melee for magic stabilizers
            } else {
              weaponEssence = equippedWeapon.currentEssence;
            }
            
            weaponPen = (weaponTemplate?.penetration as PenetrationType) || PenetrationType.NONE;
            
            // * Parse range
            if (weaponTemplate?.distance) {
              try {
                const rangeData = JSON.parse(weaponTemplate.distance);
                weaponRange = { minRange: rangeData.minRange, maxRange: rangeData.maxRange };
              } catch (e) {
                // Handle legacy string categories
                switch (weaponTemplate.distance) {
                  case 'MEDIUM': weaponRange = { minRange: 5, maxRange: 20 }; break;
                  case 'FAR': weaponRange = { minRange: 20, maxRange: 50 }; break;
                  case 'SNIPER': weaponRange = { minRange: 50, maxRange: 200 }; break;
                  default: weaponRange = { minRange: 0, maxRange: 5 }; // CLOSE/MELEE
                }
              }
            }
            
            // * Parse AoE metadata from description
            let isAoE = false;
            let aoeRadius = 0;
            if (weaponTemplate?.description) {
              try {
                const meta = JSON.parse(weaponTemplate.description);
                isAoE = meta.isAoE === true;
                aoeRadius = meta.aoeRadius || 0;
              } catch {
                // Description is plain text, not JSON
              }
            }
            
            // * Store AoE info for later use
            (weaponTemplate as any).isAoE = isAoE;
            (weaponTemplate as any).aoeRadius = aoeRadius;
          }
        }
      }
    }

    let armorIgnore = 0;
    let armorCat: ArmorCategory | undefined;
    let equippedArmor: any = null;
    let armorHitPenalty = 0;
    let armorEvasionPenalty = 0;
    let equippedShield: any = null;
    let shieldEvasionPenalty = 0;

    if (target.characterId) {
        const char = await (prisma as any).character.findUnique({
            where: { id: target.characterId },
            include: { inventory: true }
        });
        if (char && char.inventory) {
            const items = JSON.parse(char.inventory.items);
            equippedArmor = items.find((i: any) => i.isEquipped && i.templateId.includes('armor')); // Simple check
            if (equippedArmor) {
                const template = await (prisma as any).itemTemplate.findUnique({ where: { id: equippedArmor.templateId } });
                armorIgnore = template?.ignoreDamage || 0;
                armorCat = template?.category as ArmorCategory;
                armorHitPenalty = template?.hitPenalty || 0;
                armorEvasionPenalty = template?.evasionPenalty || 0;
            }
            
            // * Check for equipped shield
            equippedShield = items.find((i: any) => i.isEquipped && i.templateId.includes('shield'));
            if (equippedShield) {
                const shieldTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: equippedShield.templateId } });
                shieldEvasionPenalty = shieldTemplate?.shieldEvasionPenalty || 0;
            }
        }
    }

    // * Create copies to avoid mutating Prisma objects directly
    const attackerCopy = { ...attacker, currentHp: attacker.currentHp, currentProtection: attacker.currentProtection };
    const targetCopy = { ...target, currentHp: target.currentHp, currentProtection: target.currentProtection };

    // * Add shield evasion penalty to total evasion penalty
    const totalEvasionPenalty = armorEvasionPenalty + shieldEvasionPenalty;
    
    // * Set isBlocking from target (if it exists)
    if (target.isBlocking !== undefined) {
      targetCopy.isBlocking = target.isBlocking;
    }

    // * Check for dual-wielding
    let result: any;
    if (dualWieldWeapons.length >= 2) {
      // * Dual-wield attack
      const weapon1 = dualWieldWeapons[0];
      const weapon2 = dualWieldWeapons[1];
      
      // * Parse ranges for both weapons
      let weapon1Range = { minRange: 0, maxRange: 5 };
      let weapon2Range = { minRange: 0, maxRange: 5 };
      
      if (weapon1.template?.distance) {
        try {
          const rangeData = JSON.parse(weapon1.template.distance);
          weapon1Range = { minRange: rangeData.minRange, maxRange: rangeData.maxRange };
        } catch (e) {
          switch (weapon1.template.distance) {
            case 'MEDIUM': weapon1Range = { minRange: 5, maxRange: 20 }; break;
            case 'FAR': weapon1Range = { minRange: 20, maxRange: 50 }; break;
            case 'SNIPER': weapon1Range = { minRange: 50, maxRange: 200 }; break;
            default: weapon1Range = { minRange: 0, maxRange: 5 };
          }
        }
      }
      
      if (weapon2.template?.distance) {
        try {
          const rangeData = JSON.parse(weapon2.template.distance);
          weapon2Range = { minRange: rangeData.minRange, maxRange: rangeData.maxRange };
        } catch (e) {
          switch (weapon2.template.distance) {
            case 'MEDIUM': weapon2Range = { minRange: 5, maxRange: 20 }; break;
            case 'FAR': weapon2Range = { minRange: 20, maxRange: 50 }; break;
            case 'SNIPER': weapon2Range = { minRange: 50, maxRange: 200 }; break;
            default: weapon2Range = { minRange: 0, maxRange: 5 };
          }
        }
      }
      
      const dualResult = CombatEngine.resolveDualWieldAttack(
        attackerCopy as unknown as BattleParticipant,
        weapon1.item.currentEssence || 5,
        (weapon1.template?.penetration as PenetrationType) || PenetrationType.NONE,
        weapon1Range,
        weapon2.item.currentEssence || 5,
        (weapon2.template?.penetration as PenetrationType) || PenetrationType.NONE,
        weapon2Range,
        targetCopy as unknown as BattleParticipant,
        armorIgnore,
        armorCat,
        1, // defender min roll
        1, // attacker min roll
        armorHitPenalty,
        totalEvasionPenalty
      );
      
      // * Convert dual-wield result to standard format
      result = {
        hit: dualResult.totalDamage > 0,
        damageDealt: dualResult.totalDamage,
        log: dualResult.logs.join(' '),
        diceLogs: dualResult.diceLogs,
        rolls: dualResult.rolls,
        isDualWield: true,
        dualWieldHits: dualResult.hits
      };
    } else {
      // * Check for AoE attack
      const isAoE = (weaponTemplate as any)?.isAoE === true;
      const aoeRadius = (weaponTemplate as any)?.aoeRadius || 0;
      
      if (isAoE && aoeRadius > 0) {
        // * Find all targets in AoE radius from primary target
        const primaryTargetDistance = target.distance;
        const aoeTargets = battle.participants.filter((p: any) => {
          if (p.id === attacker.id || p.id === target.id || getParticipantStatus(p) !== ParticipantStatus.ALIVE) return false; // Exclude attacker, primary target, and downed/dead participants
          if (p.isPlayer === attacker.isPlayer) return false; // Exclude allies
          const distance = Math.abs(primaryTargetDistance - p.distance);
          return distance <= aoeRadius;
        });
        
        if (aoeTargets.length === 0) {
          return res.status(400).json({ error: 'Нет целей в радиусе AoE атаки' });
        }
        
        // * Prepare armor data for all targets
        const targetArmorIgnores: number[] = [];
        const targetArmorCats: (ArmorCategory | undefined)[] = [];
        const targetEvasionPenalties: number[] = [];
        
        for (const aoeTarget of aoeTargets) {
          let targetArmorIgnore = 0;
          let targetArmorCat: ArmorCategory | undefined;
          let targetEvasionPenalty = 0;
          
          if (aoeTarget.characterId) {
            const targetChar = await (prisma as any).character.findUnique({
              where: { id: aoeTarget.characterId },
              include: { inventory: true }
            });
            if (targetChar && targetChar.inventory) {
              const targetItems = JSON.parse(targetChar.inventory.items);
              const targetArmor = targetItems.find((i: any) => i.isEquipped && i.templateId.includes('armor'));
              if (targetArmor) {
                const targetArmorTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: targetArmor.templateId } });
                targetArmorIgnore = targetArmorTemplate?.ignoreDamage || 0;
                targetArmorCat = targetArmorTemplate?.category as ArmorCategory;
                targetEvasionPenalty = targetArmorTemplate?.evasionPenalty || 0;
              }
              
              // * Check for shield
              const targetShield = targetItems.find((i: any) => i.isEquipped && i.templateId.includes('shield'));
              if (targetShield) {
                const targetShieldTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: targetShield.templateId } });
                targetEvasionPenalty += targetShieldTemplate?.shieldEvasionPenalty || 0;
              }
            }
          }
          
          targetArmorIgnores.push(targetArmorIgnore);
          targetArmorCats.push(targetArmorCat);
          targetEvasionPenalties.push(targetEvasionPenalty);
        }
        
        // * Execute AoE attack
        const aoeResult = CombatEngine.resolveAoEAttack(
          attackerCopy as unknown as BattleParticipant,
          weaponEssence,
          weaponPen,
          weaponRange,
          aoeTargets.map((p: any) => ({ ...p, currentHp: p.currentHp, currentProtection: p.currentProtection })) as unknown as BattleParticipant[],
          targetArmorIgnores,
          targetArmorCats,
          1, // defender min roll
          1, // attacker min roll
          armorHitPenalty,
          targetEvasionPenalties
        );
        
        // * Apply damage to all hit targets
        for (let i = 0; i < aoeResult.results.length; i++) {
          const aoeTargetResult = aoeResult.results[i];
          if (aoeTargetResult.hit) {
            const aoeTarget = aoeTargets[i];
            aoeTarget.currentHp = Math.max(0, aoeTarget.currentHp - aoeTargetResult.damageDealt);
            ensureDownedStatus(aoeTarget, aoeResult.logs);
            // * Update target in DB
            await (prisma as any).battleParticipant.update({
              where: { id: aoeTarget.id },
              data: {
                currentHp: aoeTarget.currentHp,
                currentProtection: aoeTarget.currentProtection,
                status: aoeTarget.status || ParticipantStatus.ALIVE,
                downedRoundsRemaining: aoeTarget.downedRoundsRemaining ?? 0
              }
            });
            
            if (aoeTarget.characterId) {
              await syncParticipantToCharacter(aoeTarget as unknown as BattleParticipant);
            }
          }
        }
        
        // * Convert AoE result to standard format
        result = {
          hit: aoeResult.totalDamage > 0,
          damageDealt: aoeResult.totalDamage,
          log: aoeResult.logs.join(' '),
          diceLogs: aoeResult.diceLogs,
          rolls: aoeResult.rolls,
          isAoE: true,
          aoeResults: aoeResult.results
        };
      } else {
        // * Single weapon attack (non-AoE)
        result = CombatEngine.resolveAttack(
          attackerCopy as unknown as BattleParticipant,
          weaponEssence,
          weaponPen,
          weaponRange,
          targetCopy as unknown as BattleParticipant,
          armorIgnore,
          armorCat,
          1, // defender min roll
          1, // attacker min roll
          armorHitPenalty,
          totalEvasionPenalty
        );
      }
    }
    
    // * Handle shield block: reduce shield durability and reset isBlocking
    if (result.hit && targetCopy.isBlocking && equippedShield) {
      equippedShield.currentDurability = Math.max(0, (equippedShield.currentDurability || 0) - 1);
      
      // * Persist shield durability change
      if (target.characterId) {
        const inv = await (prisma as any).inventory.findUnique({ where: { characterId: target.characterId } });
        if (inv) {
          const items = JSON.parse(inv.items);
          const shieldInInv = items.find((i: any) => i.id === equippedShield.id);
          if (shieldInInv) {
            shieldInInv.currentDurability = equippedShield.currentDurability;
            await (prisma as any).inventory.update({
              where: { characterId: target.characterId },
              data: { items: JSON.stringify(items) }
            });
          }
        }
      }
      
      // * Reset blocking flag after use
      targetCopy.isBlocking = false;
    }

    // * Handle Item Progression and Durability
    const itemUpdatesLog: string[] = [];
    
    // * 1. Weapon Mastery Growth (on successful hit)
    if (result.hit) {
      // * Handle dual-wield mastery
      if (result.isDualWield && dualWieldWeapons.length >= 2) {
        for (const weaponData of dualWieldWeapons) {
          const weapon = weaponData.item;
          const template = weaponData.template;
          if (template && template.maxEssence) {
            const currentMastery = weapon.currentEssence || 0;
            const maxMastery = template.maxEssence;
            
            if (currentMastery < maxMastery) {
              // 20% chance to gain 1-3 essence per weapon
              if (Math.random() < 0.2) {
                const gain = DICE.roll(3);
                weapon.currentEssence = Math.min(maxMastery, currentMastery + gain);
                itemUpdatesLog.push(`${attacker.name}: Мастерство владения ${template.name} повышено! (+${gain})`);
                
                // Persist weapon change
                if (attacker.characterId) {
                  const inv = await (prisma as any).inventory.findUnique({ where: { characterId: attacker.characterId } });
                  if (inv) {
                    const items = JSON.parse(inv.items);
                    const weaponInInv = items.find((i: any) => i.id === weapon.id);
                    if (weaponInInv) {
                      weaponInInv.currentEssence = weapon.currentEssence;
                      await (prisma as any).inventory.update({
                        where: { characterId: attacker.characterId },
                        data: { items: JSON.stringify(items) }
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } else if (equippedWeapon && weaponTemplate && weaponTemplate.maxEssence) {
        // * Single weapon mastery
        const currentMastery = equippedWeapon.currentEssence || 0;
        const maxMastery = weaponTemplate.maxEssence;
        
        if (currentMastery < maxMastery) {
          // 20% chance to gain 1-3 essence
          if (Math.random() < 0.2) {
            const gain = DICE.roll(3);
            equippedWeapon.currentEssence = Math.min(maxMastery, currentMastery + gain);
            itemUpdatesLog.push(`${attacker.name}: Мастерство владения ${weaponTemplate.name} повышено! (+${gain})`);
            
            // Persist weapon change
            if (attacker.characterId) {
              const inv = await (prisma as any).inventory.findUnique({ where: { characterId: attacker.characterId } });
              if (inv) {
                const items = JSON.parse(inv.items);
                const weaponInInv = items.find((i: any) => i.id === equippedWeapon.id);
                if (weaponInInv) {
                  weaponInInv.currentEssence = equippedWeapon.currentEssence;
                  await (prisma as any).inventory.update({
                    where: { characterId: attacker.characterId },
                    data: { items: JSON.stringify(items) }
                  });
                }
              }
            }
          }
        }
      }
    }

    // * 2. Armor Durability Loss (on any hit)
    if (result.hit && equippedArmor) {
      equippedArmor.currentDurability = Math.max(0, (equippedArmor.currentDurability || 0) - 1);
      itemUpdatesLog.push(`${target.name}: Броня получила повреждения! (Прочность: ${equippedArmor.currentDurability})`);
      
      // Persist armor change
      if (target.characterId) {
        const inv = await (prisma as any).inventory.findUnique({ where: { characterId: target.characterId } });
        if (inv) {
          const items = JSON.parse(inv.items);
          const armorInInv = items.find((i: any) => i.id === equippedArmor.id);
          if (armorInInv) {
            armorInInv.currentDurability = equippedArmor.currentDurability;
            await (prisma as any).inventory.update({
              where: { characterId: target.characterId },
              data: { items: JSON.stringify(items) }
            });
          }
        }
      }
    }

    // * NEW: Apply effects from weapon if any
    let activeEffectsOnTarget = target.activeEffects || "[]";
    let bonusesOnTarget = target.bonuses;

    if (result.hit && weaponTemplate && weaponTemplate.effects) {
      try {
        const effectIds: string[] = JSON.parse(weaponTemplate.effects);
        const targetForEffects = { ...target, activeEffects: target.activeEffects, bonuses: target.bonuses };
        
        for (const effectId of effectIds) {
          const template = await (prisma as any).effectTemplate.findUnique({ where: { id: effectId } });
          if (template) {
            const activeEffect: ActiveEffect = {
              id: crypto.randomUUID(),
              templateId: template.id,
              name: template.name,
              type: template.type as EffectType,
              level: 'ORDINARY',
              value: template.value,
              remainingTurns: template.duration,
              parameter: template.parameter || undefined,
              isNegative: template.isNegative
            };
            
            EffectsEngine.applyEffect(targetForEffects as unknown as BattleParticipant, activeEffect);
            itemUpdatesLog.push(`${attacker.name}: На цель наложен эффект "${template.name}"!`);
          }
        }
        activeEffectsOnTarget = targetForEffects.activeEffects || "[]";
        bonusesOnTarget = targetForEffects.bonuses;
      } catch (e) {
        console.error('Error applying effects:', e);
      }
    }

    // * Update target state with NEW values after damage and effects application
    ensureDownedStatus(targetCopy, itemUpdatesLog);
    const updatedTarget = await (prisma as any).battleParticipant.update({
      where: { id: target.id },
      data: {
        currentHp: Math.max(0, targetCopy.currentHp),
        currentProtection: Math.max(0, targetCopy.currentProtection),
        activeEffects: activeEffectsOnTarget,
        bonuses: bonusesOnTarget,
        isBlocking: targetCopy.isBlocking || false, // Reset blocking after use
        status: targetCopy.status || ParticipantStatus.ALIVE,
        downedRoundsRemaining: targetCopy.downedRoundsRemaining ?? 0
      }
    });

    // * Sync target state back to character if applicable
    await syncParticipantToCharacter(updatedTarget as unknown as BattleParticipant);

    // * If attacker is a player, sync their state (just in case)
    if (attacker.isPlayer) {
      await syncParticipantToCharacter(attacker as unknown as BattleParticipant);
    }

    // * Update attacker actions (use current value from database, not from copy)
    const updatedMainActions = Math.max(0, attacker.mainActions - 1);
    await (prisma as any).battleParticipant.update({
      where: { id: attacker.id },
      data: {
        mainActions: updatedMainActions
      }
    });

    // * Final sync for attacker to save reduced actions if needed (though character doesn't track battle actions)
    if (attacker.isPlayer) {
        await syncParticipantToCharacter(attacker as unknown as BattleParticipant);
    }

    // * Update log
    const currentLog = JSON.parse(battle.log);
    const updatedLog = [...currentLog, ...result.diceLogs, ...itemUpdatesLog, `${attacker.name}: ${result.log}`];

    const aliveTeams = new Set(
      battle.participants
        .map((p: any) => {
          const status =
            p.id === targetCopy.id ? getParticipantStatus(targetCopy) : getParticipantStatus(p);
          if (status !== ParticipantStatus.ALIVE) return null;
          return p.isPlayer ? 'players' : 'monsters';
        })
        .filter((t: string | null) => t !== null)
    );

    const finalStatus = aliveTeams.size <= 1 ? BattleStatus.FINISHED : BattleStatus.ACTIVE;

    await (prisma as any).battle.update({
      where: { id: battle.id },
      data: {
        status: finalStatus,
        log: JSON.stringify(updatedLog)
      }
    });

    // * Fetch updated battle state to return fresh data
    const updatedBattle = await (prisma as any).battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    res.json({
      ...result,
      battleStatus: finalStatus,
      updatedLog,
      rolls: result.rolls,
      battle: formatBattle(updatedBattle)
    });
  } catch (error) {
    console.error('Resolve attack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const nextTurn = async (req: Request, res: Response) => {
    try {
        const { battleId } = req.body;
        const battle = await (prisma as any).battle.findUnique({
            where: { id: battleId },
            include: { participants: true }
        });

        if (!battle) return res.status(404).json({ error: 'Battle not found' });

        const totalParticipants = battle.participants.length;
        let nextIndex = battle.currentTurnIndex;
        let nextParticipant: any = null;
        let wrappedRound = false;

        for (let i = 0; i < totalParticipants; i++) {
          nextIndex = (nextIndex + 1) % totalParticipants;
          if (nextIndex === 0) wrappedRound = true;
          const candidate = battle.participants[nextIndex];
          if (getParticipantStatus(candidate) === ParticipantStatus.ALIVE) {
            nextParticipant = candidate;
            break;
          }
        }

        const currentLog = JSON.parse(battle.log);

        if (!nextParticipant) {
          for (const p of battle.participants) {
            if (getParticipantStatus(p) === ParticipantStatus.DOWNED) {
              await (prisma as any).battleParticipant.update({
                where: { id: p.id },
                data: { status: ParticipantStatus.DEAD, downedRoundsRemaining: 0 }
              });
              if (p.characterId) {
                await (prisma as any).character.update({
                  where: { id: p.characterId },
                  data: { isDead: true }
                });
              }
              currentLog.push(`${p.name} окончательно погиб.`);
            }
          }

          const updatedBattle = await (prisma as any).battle.update({
            where: { id: battle.id },
            data: { status: BattleStatus.FINISHED, log: JSON.stringify(currentLog) },
            include: { participants: true }
          });

          return res.json({ battle: formatBattle(updatedBattle) });
        }

        if (wrappedRound) {
          for (const p of battle.participants) {
            if (getParticipantStatus(p) !== ParticipantStatus.DOWNED) continue;
            const remaining = Math.max(0, (p.downedRoundsRemaining ?? DOWNED_ROUNDS) - 1);
            const status = remaining === 0 ? ParticipantStatus.DEAD : ParticipantStatus.DOWNED;

            await (prisma as any).battleParticipant.update({
              where: { id: p.id },
              data: { downedRoundsRemaining: remaining, status }
            });

            if (status === ParticipantStatus.DEAD) {
              if (p.characterId) {
                await (prisma as any).character.update({
                  where: { id: p.characterId },
                  data: { isDead: true }
                });
              }
              currentLog.push(`${p.name} окончательно погиб.`);
            }
          }
        }

        // * 1. Process Effects Ticks
        const { updatedParticipant, logs } = EffectsEngine.processTicks(nextParticipant as unknown as BattleParticipant);
        ensureDownedStatus(updatedParticipant, logs);
        
        // * 2. Process Skill Cooldowns and Cast Time (if player has skills)
        let skillLogs: string[] = [];
        if (nextParticipant.characterId) {
          const character = await (prisma as any).character.findUnique({
            where: { id: nextParticipant.characterId },
            include: { characterSkills: { include: { skillTemplate: true } } }
          });
          
          if (character && character.characterSkills && character.characterSkills.length > 0) {
            // * Process cooldowns
            SkillsEngine.processCooldowns(character.characterSkills as unknown as CharacterSkill[]);
            
            // * Process cast time
            const { completedSkills, logs: castLogs } = SkillsEngine.processCastTime(
              updatedParticipant as unknown as BattleParticipant,
              character.characterSkills as unknown as CharacterSkill[]
            );
            skillLogs.push(...castLogs);
            
            // * Apply completed skills automatically (if self-target, else wait for player action)
            for (const completedSkill of completedSkills) {
              const skillTemplate = await (prisma as any).skillTemplate.findUnique({
                where: { id: completedSkill.skillTemplateId }
              });
              
              if (skillTemplate) {
                // * Auto-apply self-target skills, others wait for player confirmation
                if (skillTemplate.targetType === 'SELF') {
                  // Apply to self
                  const effectIds: string[] = skillTemplate.effects ? JSON.parse(skillTemplate.effects) : [];
                  const targetForEffects = { ...updatedParticipant };
                  
                  for (const effectId of effectIds) {
                    const effectTemplate = await (prisma as any).effectTemplate.findUnique({ where: { id: effectId } });
                    if (effectTemplate) {
                      const activeEffect: ActiveEffect = {
                        id: crypto.randomUUID(),
                        templateId: effectTemplate.id,
                        name: effectTemplate.name,
                        type: effectTemplate.type as EffectType,
                        level: 'ORDINARY',
                        value: effectTemplate.value,
                        remainingTurns: effectTemplate.duration,
                        parameter: effectTemplate.parameter || undefined,
                        isNegative: effectTemplate.isNegative
                      };
                      EffectsEngine.applyEffect(targetForEffects as unknown as BattleParticipant, activeEffect);
                    }
                  }
                  
                  updatedParticipant.activeEffects = targetForEffects.activeEffects ?? "[]";
                  updatedParticipant.bonuses = targetForEffects.bonuses ?? null;
                  skillLogs.push(`${updatedParticipant.name}: Применил "${skillTemplate.name}" на себя!`);
                  
                  // * Update skill cooldown only for auto-applied skills
                  completedSkill.currentCooldown = skillTemplate.cooldown;
                  completedSkill.castTimeRemaining = null;
                } else {
                  // * For TARGET/AREA skills, skill remains "ready" (castTimeRemaining: 0) until player selects target
                  // * This is handled in the useSkill endpoint
                  skillLogs.push(`${updatedParticipant.name}: "${skillTemplate.name}" готова к применению!`);
                  // DO NOT set cooldown or clear castTimeRemaining here!
                  // It must be cleared only when the skill is actually released in useSkill
                }
              }
            }
            
            // * Save updated skills
            for (const skill of character.characterSkills) {
              await (prisma as any).characterSkill.update({
                where: { id: skill.id },
                data: {
                  currentCooldown: skill.currentCooldown,
                  castTimeRemaining: skill.castTimeRemaining
                }
              });
            }
          }
        }
        
        // * 3. Check for stun
        const isDowned = getParticipantStatus(updatedParticipant) === ParticipantStatus.DOWNED;
        const isStunned = !isDowned && EffectsEngine.isStunned(updatedParticipant as unknown as BattleParticipant);
        const finalMainActions = isDowned || isStunned ? 0 : 1;
        const finalBonusActions = isDowned || isStunned ? 0 : 1;

        // * 3. Reset blocking flags for all participants at start of turn (except nextParticipant, which will be updated below)
        for (const p of battle.participants) {
          if (p.id !== nextParticipant.id && (p as any).isBlocking) {
            await (prisma as any).battleParticipant.update({
              where: { id: p.id },
              data: { isBlocking: false }
            });
          }
        }
        
        // * 3. Update participant in DB (reset blocking flag here to avoid duplicate update)
        const updatedInDb = await (prisma as any).battleParticipant.update({
            where: { id: nextParticipant.id },
            data: {
                currentHp: updatedParticipant.currentHp,
                currentProtection: updatedParticipant.currentProtection,
                activeEffects: updatedParticipant.activeEffects,
                bonuses: updatedParticipant.bonuses,
                mainActions: finalMainActions,
                bonusActions: finalBonusActions,
                isBlocking: false, // Reset blocking at start of turn
                status: updatedParticipant.status || ParticipantStatus.ALIVE,
                downedRoundsRemaining: updatedParticipant.downedRoundsRemaining ?? 0
            }
        });

        // * 4. Sync to character if player
        if (updatedInDb.isPlayer) {
            await syncParticipantToCharacter(updatedInDb as unknown as BattleParticipant);
        }

        currentLog.push(...logs);
        currentLog.push(...skillLogs);
        currentLog.push(`Ход: ${nextParticipant.name}${isDowned ? ' (Нокаут)' : isStunned ? ' (ОГЛУШЕН)' : ''}`);

        const aliveTeams = new Set(
          battle.participants
            .map((p: any) => {
              const status =
                p.id === updatedInDb.id
                  ? getParticipantStatus(updatedInDb)
                  : getParticipantStatus(p);
              if (status !== ParticipantStatus.ALIVE) return null;
              return p.isPlayer ? 'players' : 'monsters';
            })
            .filter((t: string | null) => t !== null)
        );

        let finalStatus = BattleStatus.ACTIVE;
        if (aliveTeams.size <= 1) {
          finalStatus = BattleStatus.FINISHED;
        }

        const updatedBattle = await (prisma as any).battle.update({
            where: { id: battle.id },
            data: {
                currentTurnIndex: nextIndex,
                status: finalStatus,
                log: JSON.stringify(currentLog)
            },
            include: { participants: true }
        });

        res.json({
            battle: formatBattle(updatedBattle)
        });
    } catch (error) {
        console.error('Next turn error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const useSkill = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { battleId, participantId, skillId, targetId } = req.body;

    const battle = await (prisma as any).battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const participant = battle.participants.find((p: any) => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (getParticipantStatus(participant) !== ParticipantStatus.ALIVE) {
      return res.status(400).json({ error: 'Cannot use skills while downed or dead' });
    }

    // * Check if it's the participant's turn
    if (battle.participants[battle.currentTurnIndex].id !== participant.id) {
      return res.status(400).json({ error: "It's not your turn" });
    }

    if (!participant.characterId) {
      return res.status(400).json({ error: 'Only player characters can use skills' });
    }

    // * Fetch character and skill
    const character = await (prisma as any).character.findUnique({
      where: { id: participant.characterId },
      include: { characterSkills: { include: { skillTemplate: true } } }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const characterSkill = (character as any).characterSkills.find((s: any) => s.id === skillId);
    if (!characterSkill) {
      return res.status(404).json({ error: 'Skill not found on character' });
    }

    const skillTemplate = (characterSkill as any).skillTemplate;
    if (!skillTemplate) {
      return res.status(404).json({ error: 'Skill template not found' });
    }

    // * Validate skill can be used
    const rank = await (prisma as any).rank.findUnique({ where: { id: character.rankId } });
    const validation = SkillsEngine.canUseSkill(
      participant as unknown as BattleParticipant,
      characterSkill as unknown as CharacterSkill,
      skillTemplate as unknown as SkillTemplate,
      rank?.maxSkills
    );

    if (!validation.canUse) {
      return res.status(400).json({ error: validation.reason || 'Cannot use skill' });
    }

    // * Validate target if needed
    let target: BattleParticipant | null = null;
    if (skillTemplate.targetType === 'TARGET') {
      if (!targetId) {
        return res.status(400).json({ error: 'Target required for this skill' });
      }
      
      target = (battle.participants.find((p: any) => p.id === targetId) as unknown as BattleParticipant) || null;
      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }
    } else if (skillTemplate.targetType === 'SELF') {
      target = (participant as unknown as BattleParticipant);
    } else if (skillTemplate.targetType === 'AREA') {
      // * AREA skills require a target as center point
      if (!targetId) {
        return res.status(400).json({ error: 'Target required as center point for AREA skill' });
      }
      
      target = (battle.participants.find((p: any) => p.id === targetId) as unknown as BattleParticipant) || null;
      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }
    }

    if (target && skillTemplate.targetType !== 'SELF' && getParticipantStatus(target) !== ParticipantStatus.ALIVE) {
      return res.status(400).json({ error: 'Target is downed or dead' });
    }

    // * Get weapon essence for hit check
    let weaponEssence = 0;
    if (participant.characterId) {
      const char = await (prisma as any).character.findUnique({
        where: { id: participant.characterId },
        include: { inventory: true }
      });
      if (char && char.inventory) {
        const items = JSON.parse(char.inventory.items);
        const equippedWeapon = items.find((i: any) => i.isEquipped && i.templateId.toLowerCase().includes('weapon'));
        if (equippedWeapon) {
          weaponEssence = equippedWeapon.currentEssence || 0;
        }
      }
    }

    // * Get rank min rolls
    const attackerRank = await (prisma as any).rank.findUnique({ where: { id: character.rankId } });
    const attackerRankMinRoll = attackerRank?.minEssenceRoll || 1;
    const targetRank = target?.characterId 
      ? await (prisma as any).character.findUnique({ where: { id: target.characterId } })
          .then((c: any) => c ? (prisma as any).rank.findUnique({ where: { id: c.rankId } }) : null)
      : null;
    const targetRankMinRoll = targetRank?.minEssenceRoll || 1;

    let skillLogs: string[] = [];
    const updatedParticipant: BattleParticipant = { ...participant } as unknown as BattleParticipant;
    const updatedTarget: BattleParticipant | null = target ? ({ ...target } as unknown as BattleParticipant) : null;

    // * If castTime === 0 or cast is finished (castTimeRemaining === 0), apply immediately
    if (skillTemplate.castTime === 0 || characterSkill.castTimeRemaining === 0) {
      // * Handle AREA skills with AoE logic
      if (skillTemplate.targetType === 'AREA' && target) {
        // * Parse skill range for AoE radius
        let skillRange: { minRange: number; maxRange: number } | undefined;
        let aoeRadius = 10; // Default AoE radius
        
        if (skillTemplate.distance) {
          try {
            const rangeData = JSON.parse(skillTemplate.distance);
            skillRange = { minRange: rangeData.minRange || 0, maxRange: rangeData.maxRange || 999 };
            // * Use maxRange as AoE radius (or half of it)
            aoeRadius = Math.max(5, rangeData.maxRange / 2);
          } catch {
            // Legacy string format
            switch (skillTemplate.distance) {
              case 'CLOSE': aoeRadius = 5; break;
              case 'MEDIUM': aoeRadius = 10; break;
              case 'FAR': aoeRadius = 15; break;
              case 'SNIPER': aoeRadius = 20; break;
              default: aoeRadius = 10;
            }
          }
        }
        
        // * Find all targets in AoE radius
        const primaryTargetDistance = target.distance;
        const aoeTargets = battle.participants.filter((p: any) => {
          if (p.id === participant.id || p.id === target.id || getParticipantStatus(p) !== ParticipantStatus.ALIVE) return false;
          if (p.isPlayer === participant.isPlayer) return false; // Exclude allies
          const distance = Math.abs(primaryTargetDistance - p.distance);
          return distance <= aoeRadius;
        });
        
        if (aoeTargets.length === 0) {
          return res.status(400).json({ error: 'Нет целей в радиусе AoE способности' });
        }
        
        // * Prepare armor data for all targets
        const targetArmorIgnores: number[] = [];
        const targetArmorCats: (ArmorCategory | undefined)[] = [];
        const targetEvasionPenalties: number[] = [];
        
        for (const aoeTarget of aoeTargets) {
          let targetArmorIgnore = 0;
          let targetArmorCat: ArmorCategory | undefined;
          let targetEvasionPenalty = 0;
          
          if (aoeTarget.characterId) {
            const targetChar = await (prisma as any).character.findUnique({
              where: { id: aoeTarget.characterId },
              include: { inventory: true }
            });
            if (targetChar && targetChar.inventory) {
              const targetItems = JSON.parse(targetChar.inventory.items);
              const targetArmor = targetItems.find((i: any) => i.isEquipped && i.templateId.includes('armor'));
              if (targetArmor) {
                const targetArmorTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: targetArmor.templateId } });
                targetArmorIgnore = targetArmorTemplate?.ignoreDamage || 0;
                targetArmorCat = targetArmorTemplate?.category as ArmorCategory;
                targetEvasionPenalty = targetArmorTemplate?.evasionPenalty || 0;
              }
              
              const targetShield = targetItems.find((i: any) => i.isEquipped && i.templateId.includes('shield'));
              if (targetShield) {
                const targetShieldTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: targetShield.templateId } });
                targetEvasionPenalty += targetShieldTemplate?.shieldEvasionPenalty || 0;
              }
            }
          }
          
          targetArmorIgnores.push(targetArmorIgnore);
          targetArmorCats.push(targetArmorCat);
          targetEvasionPenalties.push(targetEvasionPenalty);
        }
        
        // * Execute AoE attack for skill
        const skillDamage = 10 + (weaponEssence > 0 ? weaponEssence : 0);
        const aoeResult = CombatEngine.resolveAoEAttack(
          updatedParticipant,
          skillDamage,
          skillTemplate.penetration as PenetrationType || PenetrationType.NONE,
          skillRange,
          aoeTargets.map((p: any) => ({ ...p, currentHp: p.currentHp, currentProtection: p.currentProtection })) as unknown as BattleParticipant[],
          targetArmorIgnores,
          targetArmorCats,
          targetRankMinRoll,
          attackerRankMinRoll,
          0, // hit penalty
          targetEvasionPenalties
        );
        
        skillLogs.push(...aoeResult.diceLogs);
        skillLogs.push(...aoeResult.logs);
        
        // * Apply damage to all hit targets
        for (let i = 0; i < aoeResult.results.length; i++) {
          const aoeTargetResult = aoeResult.results[i];
          if (aoeTargetResult.hit) {
            const aoeTarget = aoeTargets[i];
            aoeTarget.currentHp = Math.max(0, aoeTarget.currentHp - aoeTargetResult.damageDealt);
            ensureDownedStatus(aoeTarget, skillLogs);
            
            // * Update target in DB
            await (prisma as any).battleParticipant.update({
              where: { id: aoeTarget.id },
              data: {
                currentHp: aoeTarget.currentHp,
                currentProtection: aoeTarget.currentProtection,
                status: aoeTarget.status || ParticipantStatus.ALIVE,
                downedRoundsRemaining: aoeTarget.downedRoundsRemaining ?? 0
              }
            });
            
            if (aoeTarget.characterId) {
              await syncParticipantToCharacter(aoeTarget as unknown as BattleParticipant);
            }
          }
        }
        
        // * Apply effects from skill to all hit targets
        if (skillTemplate.effects) {
          const effectIds: string[] = JSON.parse(skillTemplate.effects);
          for (let i = 0; i < aoeResult.results.length; i++) {
            if (aoeResult.results[i].hit) {
              const aoeTarget = aoeTargets[i];
              const targetForEffects: BattleParticipant = aoeTarget as unknown as BattleParticipant;
              
              for (const effectId of effectIds) {
                const effectTemplate = await (prisma as any).effectTemplate.findUnique({ where: { id: effectId } });
                if (effectTemplate) {
                  const activeEffect: ActiveEffect = {
                    id: crypto.randomUUID(),
                    templateId: effectTemplate.id,
                    name: effectTemplate.name,
                    type: effectTemplate.type as EffectType,
                    level: 'ORDINARY',
                    value: effectTemplate.value,
                    remainingTurns: effectTemplate.duration,
                    parameter: effectTemplate.parameter || undefined,
                    isNegative: effectTemplate.isNegative
                  };
                  
                  EffectsEngine.applyEffect(targetForEffects, activeEffect);
                  skillLogs.push(`${participant.name}: На ${aoeTarget.name} наложен эффект "${effectTemplate.name}"!`);
                }
              }
              
              // * Update target effects
              await (prisma as any).battleParticipant.update({
                where: { id: aoeTarget.id },
                data: {
                  activeEffects: targetForEffects.activeEffects ?? "[]",
                  bonuses: targetForEffects.bonuses ?? null
                }
              });
            }
          }
        }
        
        // * Set cooldown
        characterSkill.currentCooldown = skillTemplate.cooldown;
        characterSkill.castTimeRemaining = null;
        
        // * Consume action
        if (skillTemplate.castTime === 0) {
          updatedParticipant.mainActions = Math.max(0, updatedParticipant.mainActions - 1);
        }
      } else {
        // * Apply immediately (non-AoE skills)
        const result = SkillsEngine.applySkill(
          updatedParticipant,
          updatedTarget as BattleParticipant,
          characterSkill as unknown as CharacterSkill,
          skillTemplate as unknown as SkillTemplate,
          weaponEssence,
          attackerRankMinRoll,
          targetRankMinRoll
        );

        skillLogs.push(...result.diceLogs);
        skillLogs.push(result.log);

        // * Only consume action if skill was successfully applied (not failed due to range/target issues)
        if (!result.success) {
          // * Skill failed to apply - don't consume action, don't set cooldown, don't update participant
          // * Note: applySkill does NOT set cooldown on failure, so we don't need to clear it
          return res.status(400).json({ 
            error: result.log || 'Не удалось применить способность',
            battle: formatBattle(battle)
          });
        }

        // * BUG 1 FIX (refined):
        // * - Instant skills (castTime === 0) должны тратить основное действие при каждом применении.
        // * - Многоходовые скиллы (castTime > 0) тратят действие ТОЛЬКО один раз — при старте каста
        // *   в SkillsEngine.startCasting(), а при выпуске (когда castTimeRemaining === 0) действие
        // *   повторно не тратится.
        if (skillTemplate.castTime === 0) {
          updatedParticipant.mainActions = Math.max(0, updatedParticipant.mainActions - 1);
        }

        // * Apply Damage for combat skills if hit (only if target is an enemy)
        if (result.hit && skillTemplate.isCombat && updatedTarget && updatedTarget.isPlayer !== participant.isPlayer) {
          // Simple damage formula: weaponEssence + 10 (as base)
          const baseDamage = 10 + (weaponEssence > 0 ? weaponEssence : 0);
          
          // Check penetration (simplified)
          const attackerPen = skillTemplate.penetration as PenetrationType || PenetrationType.NONE;
          
          // Get target armor info
          let armorIgnore = 0;
          let armorCat: ArmorCategory | undefined;
          if (updatedTarget.characterId) {
              const char = await (prisma as any).character.findUnique({
                  where: { id: updatedTarget.characterId },
                  include: { inventory: true }
              });
              if (char && char.inventory) {
                  const items = JSON.parse(char.inventory.items);
                  const equippedArmor = items.find((i: any) => i.isEquipped && i.templateId.toLowerCase().includes('armor'));
                  if (equippedArmor) {
                      const template = await (prisma as any).itemTemplate.findUnique({ where: { id: equippedArmor.templateId } });
                      armorIgnore = template?.ignoreDamage || 0;
                      armorCat = template?.category as ArmorCategory;
                  }
              }
          }

          // Apply damage logic similar to CombatEngine
          const damage = baseDamage;
          const targetBonuses: CharacterBonuses = updatedTarget.bonuses ? JSON.parse(updatedTarget.bonuses) : { evasion: 0, accuracy: 0, damageResistance: 0, initiative: 0 };
          const finalDamage = Math.max(0, damage - armorIgnore - (targetBonuses.damageResistance || 0));
          
          // Apply damage to target
          if (updatedTarget.currentProtection >= finalDamage) {
            updatedTarget.currentProtection -= finalDamage;
          } else {
            const remaining = finalDamage - updatedTarget.currentProtection;
            updatedTarget.currentProtection = 0;
            updatedTarget.currentHp = Math.max(0, updatedTarget.currentHp - remaining);
          }
          
          skillLogs.push(`Нанесено ${finalDamage} урона!`);
        }

        if (updatedTarget) {
          ensureDownedStatus(updatedTarget, skillLogs);
        }

        // * Apply effects from skill (non-AoE only)
        if (skillTemplate.effects && result.hit) {
          const effectIds: string[] = JSON.parse(skillTemplate.effects);
          const targetForEffects: BattleParticipant = (updatedTarget || updatedParticipant);
          
          for (const effectId of effectIds) {
            const effectTemplate = await (prisma as any).effectTemplate.findUnique({ where: { id: effectId } });
            if (effectTemplate) {
              const activeEffect: ActiveEffect = {
                id: crypto.randomUUID(),
                templateId: effectTemplate.id,
                name: effectTemplate.name,
                type: effectTemplate.type as EffectType,
                level: 'ORDINARY',
                value: effectTemplate.value,
                remainingTurns: effectTemplate.duration,
                parameter: effectTemplate.parameter || undefined,
                isNegative: effectTemplate.isNegative
              };
              
              EffectsEngine.applyEffect(targetForEffects, activeEffect);
              skillLogs.push(`${participant.name}: На цель наложен эффект "${effectTemplate.name}"!`);
            }
          }
          
          if (updatedTarget) {
            updatedTarget.activeEffects = targetForEffects.activeEffects ?? "[]";
            updatedTarget.bonuses = (targetForEffects.bonuses as string | null | undefined) ?? null;
          } else {
            updatedParticipant.activeEffects = (targetForEffects.activeEffects as string) ?? "[]";
            updatedParticipant.bonuses = (targetForEffects.bonuses as string | null | undefined) ?? null;
          }
        }

        // * Set cooldown (applySkill already sets it on hit/miss, but we ensure it's set correctly)
        // * Note: applySkill sets cooldown on both hit and miss (line 182 and 202), so it should already be set
        // * We only set it here if it wasn't set (shouldn't happen, but safety check)
        if (characterSkill.currentCooldown === 0) {
          characterSkill.currentCooldown = skillTemplate.cooldown;
        }
        characterSkill.castTimeRemaining = null;
      }
    } else {
      // * Start casting
      SkillsEngine.startCasting(updatedParticipant as unknown as BattleParticipant, characterSkill as unknown as CharacterSkill, skillTemplate as unknown as SkillTemplate);
      characterSkill.castTimeRemaining = skillTemplate.castTime;
      skillLogs.push(`${participant.name} начинает применять "${skillTemplate.name}" (${skillTemplate.castTime} хода)...`);
    }

    // * Update character skill in DB
    await (prisma as any).characterSkill.update({
      where: { id: characterSkill.id },
      data: {
        currentCooldown: characterSkill.currentCooldown,
        castTimeRemaining: characterSkill.castTimeRemaining
      }
    });

    // * Update participants in DB
    await (prisma as any).battleParticipant.update({
      where: { id: participant.id },
      data: {
        currentHp: updatedParticipant.currentHp,
        currentProtection: updatedParticipant.currentProtection,
        mainActions: updatedParticipant.mainActions,
        bonuses: updatedParticipant.bonuses,
        activeEffects: updatedParticipant.activeEffects,
        status: updatedParticipant.status || ParticipantStatus.ALIVE,
        downedRoundsRemaining: updatedParticipant.downedRoundsRemaining ?? 0
      }
    });

    if (updatedTarget) {
      await (prisma as any).battleParticipant.update({
        where: { id: updatedTarget.id },
        data: {
          currentHp: updatedTarget.currentHp,
          currentProtection: updatedTarget.currentProtection,
          bonuses: updatedTarget.bonuses,
          activeEffects: updatedTarget.activeEffects,
          status: updatedTarget.status || ParticipantStatus.ALIVE,
          downedRoundsRemaining: updatedTarget.downedRoundsRemaining ?? 0
        }
      });
      
      await syncParticipantToCharacter(updatedTarget);
    }

    await syncParticipantToCharacter(updatedParticipant);

    // * Update battle log
    const currentLog = JSON.parse(battle.log);
    currentLog.push(...skillLogs);

    const aliveTeams = new Set(
      battle.participants
        .map((p: any) => {
          const status =
            updatedTarget && p.id === updatedTarget.id
              ? getParticipantStatus(updatedTarget)
              : getParticipantStatus(p);
          if (status !== ParticipantStatus.ALIVE) return null;
          return p.isPlayer ? 'players' : 'monsters';
        })
        .filter((t: string | null) => t !== null)
    );

    let finalStatus = BattleStatus.ACTIVE;
    if (aliveTeams.size <= 1) {
      finalStatus = BattleStatus.FINISHED;
    }

    const updatedBattle = await (prisma as any).battle.update({
      where: { id: battle.id },
      data: {
        status: finalStatus,
        log: JSON.stringify(currentLog)
      },
      include: { participants: true }
    });

    res.json({
      battle: formatBattle(updatedBattle),
      message: 'Skill used'
    });
  } catch (error) {
    console.error('Use skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * * Uses a consumable item in battle (potions, scrolls, food).
 * * Follows the same validation pattern as useSkill.
 */
export const useConsumable = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { battleId, participantId, itemId, targetId } = req.body;

    const battle = await (prisma as any).battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const participant = battle.participants.find((p: any) => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // * Check if it's the participant's turn
    if (battle.participants[battle.currentTurnIndex].id !== participant.id) {
      return res.status(400).json({ error: "It's not your turn" });
    }

    if (!participant.characterId) {
      return res.status(400).json({ error: 'Only player characters can use items in battle' });
    }

    // * Fetch character with inventory
    const character = await (prisma as any).character.findUnique({
      where: { id: participant.characterId, userId },
      include: { inventory: true }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (!character.inventory) {
      return res.status(400).json({ error: 'Character has no inventory' });
    }

    const inventory = character.inventory;
    const items = JSON.parse(inventory.items || '[]');

    const inventoryItem = items.find((i: any) => i.id === itemId);
    if (!inventoryItem || inventoryItem.quantity <= 0) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }

    const itemTemplate = await (prisma as any).itemTemplate.findUnique({
      where: { id: inventoryItem.templateId }
    });

    if (!itemTemplate) {
      return res.status(404).json({ error: 'Item template not found' });
    }

    if (itemTemplate.type !== 'CONSUMABLE') {
      return res.status(400).json({ error: 'Only consumables can be used in battle' });
    }

    // * Parse metadata from description (optional JSON) for targetType/actionType/isAoE
    let meta: { targetType?: 'SELF' | 'TARGET'; actionType?: 'MAIN' | 'BONUS'; isAoE?: boolean; aoeRadius?: number } = {};
    if (itemTemplate.description) {
      try {
        const parsed = JSON.parse(itemTemplate.description);
        meta = {
          targetType: parsed.targetType,
          actionType: parsed.actionType,
          isAoE: parsed.isAoE,
          aoeRadius: parsed.aoeRadius
        };
      } catch {
        // * Description is plain text, ignore
      }
    }

    const targetType = meta.targetType || 'SELF';
    const actionType = meta.actionType || 'BONUS';

    // * Validate available actions
    if (actionType === 'MAIN') {
      if (participant.mainActions <= 0) {
        return res.status(400).json({ error: 'Нет основного действия для использования предмета' });
      }
    } else {
      // BONUS: allow spending main action if no bonus actions left
      if (participant.bonusActions <= 0 && participant.mainActions <= 0) {
        return res.status(400).json({ error: 'Нет действий для использования предмета' });
      }
    }

    // * Resolve target
    let target: BattleParticipant | null = null;
    const isSelfTarget = targetType === 'SELF' || targetId === participantId;

    if (!isSelfTarget) {
      if (targetType === 'TARGET' && !targetId) {
        return res.status(400).json({ error: 'Target required for this item' });
      }
      const foundTarget = battle.participants.find((p: any) => p.id === targetId);
      if (!foundTarget) {
        return res.status(404).json({ error: 'Target not found' });
      }
      target = { ...foundTarget } as unknown as BattleParticipant;
    }

    const allowDownedTarget =
      itemTemplate.category === 'POTION' ||
      itemTemplate.category === 'FOOD' ||
      itemTemplate.category === 'TREATMENT';

    if (target && getParticipantStatus(target) !== ParticipantStatus.ALIVE && !allowDownedTarget) {
      return res.status(400).json({ error: 'Target is downed or dead' });
    }

    const updatedParticipant: BattleParticipant = { ...participant } as unknown as BattleParticipant;
    let updatedTarget: BattleParticipant | null = target;

    const logs: string[] = [];
    const diceLogs: string[] = [];

    // * Helper to consume action according to actionType
    const applyActionCost = () => {
      if (actionType === 'MAIN') {
        updatedParticipant.mainActions = Math.max(0, updatedParticipant.mainActions - 1);
      } else {
        if (updatedParticipant.bonusActions > 0) {
          updatedParticipant.bonusActions = Math.max(0, updatedParticipant.bonusActions - 1);
        } else {
          updatedParticipant.mainActions = Math.max(0, updatedParticipant.mainActions - 1);
        }
      }
    };

    // * Target for effect application
    const targetForUse = isSelfTarget ? updatedParticipant : updatedTarget!;

    // * POTIONS / FOOD: simple instant effects (heal / buff)
    if (itemTemplate.category === 'POTION' || itemTemplate.category === 'FOOD') {
      const maxHp = targetForUse.maxHp;
      const currentHp = targetForUse.currentHp;
      const healBase = itemTemplate.baseEssence || 0;
      const healAmount = Math.max(0, Math.min(healBase, maxHp - currentHp));

      targetForUse.currentHp = Math.min(maxHp, currentHp + healAmount);
      if (targetForUse.currentHp > 0) {
        targetForUse.status = ParticipantStatus.ALIVE;
        targetForUse.downedRoundsRemaining = 0;
      }

      applyActionCost();

      if (healAmount > 0) {
        logs.push(`${updatedParticipant.name} использует ${itemTemplate.name} и восстанавливает ${healAmount} HP.`);
      } else {
        logs.push(`${updatedParticipant.name} использует ${itemTemplate.name}.`);
      }

      // * Apply effects from item if any (e.g. buffs from potion)
      if (itemTemplate.effects) {
        try {
          const effectIds: string[] = JSON.parse(itemTemplate.effects);
          for (const effectId of effectIds) {
            const template = await (prisma as any).effectTemplate.findUnique({ where: { id: effectId } });
            if (template) {
              const activeEffect: ActiveEffect = {
                id: crypto.randomUUID(),
                templateId: template.id,
                name: template.name,
                type: template.type as EffectType,
                level: 'ORDINARY',
                value: template.value,
                remainingTurns: template.duration,
                parameter: template.parameter || undefined,
                isNegative: template.isNegative
              };
              EffectsEngine.applyEffect(targetForUse, activeEffect);
              logs.push(`${updatedParticipant.name}: На ${isSelfTarget ? 'себя' : targetForUse.name} наложен эффект "${template.name}"!`);
            }
          }
        } catch (e) {
          console.error('Error applying consumable effects:', e);
        }
      }
    } else if (itemTemplate.category === 'SCROLL') {
      // * SCROLLS: offensive or utility spells, use CombatEngine for attacks
      if (!updatedTarget || updatedTarget.id === updatedParticipant.id) {
        return res.status(400).json({ error: 'Scroll requires a separate target' });
      }

      // * Check for equipped magic stabilizer (staff/wand)
      let equippedStabilizer: any = null;
      let stabilizerEssence = 0;
      
      const equippedItems = items.filter((i: any) => i.isEquipped);
      for (const item of equippedItems) {
        const template = await (prisma as any).itemTemplate.findUnique({ where: { id: item.templateId } });
        if (template && template.category === 'MAGIC_STABILIZER') {
          equippedStabilizer = item;
          stabilizerEssence = item.currentEssence || 0;
          
          // * Check spell slots
          if (!equippedStabilizer.spellSlots) {
            // * Initialize spell slots if not present
            const maxSlots = template.slotCount || 0;
            equippedStabilizer.spellSlots = { used: 0, max: maxSlots };
          }
          
          // * Check if there are free spell slots
          if (equippedStabilizer.spellSlots.used >= equippedStabilizer.spellSlots.max) {
            return res.status(400).json({ error: 'Нет свободных ячеек заклинаний в магическом стабилизаторе' });
          }
          
          // * Use a spell slot
          equippedStabilizer.spellSlots.used += 1;
          
          // * Persist spell slot usage
          const itemInInv = items.find((i: any) => i.id === equippedStabilizer.id);
          if (itemInInv) {
            itemInInv.spellSlots = equippedStabilizer.spellSlots;
            await (prisma as any).inventory.update({
              where: { id: inventory.id },
              data: { items: JSON.stringify(items) }
            });
          }
          
          break;
        }
      }
      
      if (!equippedStabilizer) {
        return res.status(400).json({ error: 'Для использования свитка требуется экипированный магический стабилизатор (посох/жезл)' });
      }

      // * Parse range from itemTemplate.distance
      let scrollRange: { minRange: number; maxRange: number } | undefined;
      if (itemTemplate.distance) {
        try {
          const parsed = JSON.parse(itemTemplate.distance);
          scrollRange = { minRange: parsed.minRange || 0, maxRange: parsed.maxRange || 999 };
        } catch {
          switch (itemTemplate.distance) {
            case 'CLOSE':
              scrollRange = { minRange: 0, maxRange: 5 };
              break;
            case 'MEDIUM':
              scrollRange = { minRange: 5, maxRange: 20 };
              break;
            case 'FAR':
              scrollRange = { minRange: 20, maxRange: 50 };
              break;
            case 'SNIPER':
              scrollRange = { minRange: 50, maxRange: 200 };
              break;
            default:
              scrollRange = { minRange: 0, maxRange: 999 };
          }
        }
      }

      const attackerCopy = { ...updatedParticipant } as unknown as BattleParticipant;
      const defenderCopy = { ...updatedTarget } as unknown as BattleParticipant;

      // * Scroll damage formula: (scroll essence + stabilizer essence)
      const scrollEssence = (itemTemplate.baseEssence || 10) + stabilizerEssence;
      const scrollPen = (itemTemplate.penetration as PenetrationType) || PenetrationType.NONE;

      // * Check for AoE scroll
      const isAoE = meta.isAoE === true;
      const aoeRadius = meta.aoeRadius || 0;
      
      let result: any;
      if (isAoE && aoeRadius > 0) {
        // * Find all targets in AoE radius
        const primaryTargetDistance = updatedTarget.distance;
        const aoeTargets = battle.participants.filter((p: any) => {
          if (p.id === updatedParticipant.id || getParticipantStatus(p) !== ParticipantStatus.ALIVE) return false;
          if (p.isPlayer === updatedParticipant.isPlayer) return false; // Exclude allies
          const distance = Math.abs(primaryTargetDistance - p.distance);
          return distance <= aoeRadius;
        });
        
        if (aoeTargets.length === 0) {
          return res.status(400).json({ error: 'Нет целей в радиусе AoE свитка' });
        }
        
        // * Prepare armor data for all targets
        const targetArmorIgnores: number[] = [];
        const targetArmorCats: (ArmorCategory | undefined)[] = [];
        const targetEvasionPenalties: number[] = [];
        
        for (const aoeTarget of aoeTargets) {
          let targetArmorIgnore = 0;
          let targetArmorCat: ArmorCategory | undefined;
          let targetEvasionPenalty = 0;
          
          if (aoeTarget.characterId) {
            const targetChar = await (prisma as any).character.findUnique({
              where: { id: aoeTarget.characterId },
              include: { inventory: true }
            });
            if (targetChar && targetChar.inventory) {
              const targetItems = JSON.parse(targetChar.inventory.items);
              const targetArmor = targetItems.find((i: any) => i.isEquipped && i.templateId.includes('armor'));
              if (targetArmor) {
                const targetArmorTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: targetArmor.templateId } });
                targetArmorIgnore = targetArmorTemplate?.ignoreDamage || 0;
                targetArmorCat = targetArmorTemplate?.category as ArmorCategory;
                targetEvasionPenalty = targetArmorTemplate?.evasionPenalty || 0;
              }
              
              const targetShield = targetItems.find((i: any) => i.isEquipped && i.templateId.includes('shield'));
              if (targetShield) {
                const targetShieldTemplate = await (prisma as any).itemTemplate.findUnique({ where: { id: targetShield.templateId } });
                targetEvasionPenalty += targetShieldTemplate?.shieldEvasionPenalty || 0;
              }
            }
          }
          
          targetArmorIgnores.push(targetArmorIgnore);
          targetArmorCats.push(targetArmorCat);
          targetEvasionPenalties.push(targetEvasionPenalty);
        }
        
        // * Execute AoE attack for scroll
        const aoeResult = CombatEngine.resolveAoEAttack(
          attackerCopy,
          scrollEssence,
          scrollPen,
          scrollRange,
          aoeTargets.map((p: any) => ({ ...p, currentHp: p.currentHp, currentProtection: p.currentProtection })) as unknown as BattleParticipant[],
          targetArmorIgnores,
          targetArmorCats,
          1, // defender min roll
          1, // attacker min roll
          0, // hit penalty
          targetEvasionPenalties
        );
        
        diceLogs.push(...aoeResult.diceLogs);
        logs.push(...aoeResult.logs);
        logs.push(`${updatedParticipant.name} использует AoE свиток ${itemTemplate.name}`);
        
        // * Apply damage to all hit targets
        for (let i = 0; i < aoeResult.results.length; i++) {
          const aoeTargetResult = aoeResult.results[i];
          if (aoeTargetResult.hit) {
            const aoeTarget = aoeTargets[i];
            aoeTarget.currentHp = Math.max(0, aoeTarget.currentHp - aoeTargetResult.damageDealt);
            
            // * Update target in DB
            await (prisma as any).battleParticipant.update({
              where: { id: aoeTarget.id },
              data: {
                currentHp: aoeTarget.currentHp,
                currentProtection: aoeTarget.currentProtection,
                status: aoeTarget.status || ParticipantStatus.ALIVE,
                downedRoundsRemaining: aoeTarget.downedRoundsRemaining ?? 0
              }
            });
            
            if (aoeTarget.characterId) {
              await syncParticipantToCharacter(aoeTarget as unknown as BattleParticipant);
            }
          }
        }
        
        // * Convert to standard result format
        result = {
          hit: aoeResult.totalDamage > 0,
          damageDealt: aoeResult.totalDamage,
          log: aoeResult.logs.join(' '),
          diceLogs: aoeResult.diceLogs,
          rolls: aoeResult.rolls
        };
        
        updatedParticipant.currentHp = attackerCopy.currentHp;
        updatedParticipant.currentProtection = attackerCopy.currentProtection;
      } else {
        // * Single target scroll
        result = CombatEngine.resolveAttack(
          attackerCopy,
          scrollEssence,
          scrollPen,
          scrollRange,
          defenderCopy,
          0,
          undefined,
          1,
          1,
          0,
          0
        );

        // * If target is out of range, do not consume action or item
        if (!result.hit && result.damageDealt === 0 && result.log && result.log.includes('вне досягаемости')) {
          return res.status(400).json({
            error: result.log,
            battle: formatBattle(battle)
          });
        }

        applyActionCost();

        updatedParticipant.currentHp = attackerCopy.currentHp;
        updatedParticipant.currentProtection = attackerCopy.currentProtection;

        updatedTarget.currentHp = defenderCopy.currentHp;
        updatedTarget.currentProtection = defenderCopy.currentProtection;
        ensureDownedStatus(updatedTarget, logs);

        diceLogs.push(...result.diceLogs);
        logs.push(`${updatedParticipant.name} использует свиток ${itemTemplate.name}: ${result.log}`);
      }
    } else {
      // * Fallback for other consumables: just consume action with a log
      applyActionCost();
      logs.push(`${updatedParticipant.name} использует ${itemTemplate.name}.`);
    }

    // * Consume one item from stack
    inventoryItem.quantity -= 1;
    if (inventoryItem.quantity <= 0) {
      const idx = items.findIndex((i: any) => i.id === inventoryItem.id);
      if (idx !== -1) {
        items.splice(idx, 1);
      }
    }

    await (prisma as any).inventory.update({
      where: { id: inventory.id },
      data: { items: JSON.stringify(items) }
    });

    // * Persist participant and target changes
    await (prisma as any).battleParticipant.update({
      where: { id: updatedParticipant.id },
      data: {
        currentHp: updatedParticipant.currentHp,
        currentProtection: updatedParticipant.currentProtection,
        mainActions: updatedParticipant.mainActions,
        bonusActions: updatedParticipant.bonusActions,
        activeEffects: updatedParticipant.activeEffects,
        bonuses: updatedParticipant.bonuses,
        status: updatedParticipant.status || ParticipantStatus.ALIVE,
        downedRoundsRemaining: updatedParticipant.downedRoundsRemaining ?? 0
      }
    });

    if (updatedTarget && updatedTarget.id !== updatedParticipant.id) {
      await (prisma as any).battleParticipant.update({
        where: { id: updatedTarget.id },
        data: {
          currentHp: updatedTarget.currentHp,
          currentProtection: updatedTarget.currentProtection,
          activeEffects: updatedTarget.activeEffects,
          bonuses: updatedTarget.bonuses,
          status: updatedTarget.status || ParticipantStatus.ALIVE,
          downedRoundsRemaining: updatedTarget.downedRoundsRemaining ?? 0
        }
      });
    }

    // * Sync participants back to characters where applicable
    await syncParticipantToCharacter(updatedParticipant);
    if (updatedTarget && updatedTarget.characterId) {
      await syncParticipantToCharacter(updatedTarget);
    }

    // * Update battle log and status
    const currentLog = JSON.parse(battle.log);
    currentLog.push(...diceLogs, ...logs);

    const aliveTeams = new Set(
      battle.participants
        .map((p: any) => {
          const status =
            updatedTarget && p.id === updatedTarget.id
              ? getParticipantStatus(updatedTarget)
              : p.id === updatedParticipant.id
              ? getParticipantStatus(updatedParticipant)
              : getParticipantStatus(p);
          if (status !== ParticipantStatus.ALIVE) return null;
          return p.isPlayer ? 'players' : 'monsters';
        })
        .filter((t: string | null) => t !== null)
    );

    let finalStatus = BattleStatus.ACTIVE;
    if (aliveTeams.size <= 1) {
      finalStatus = BattleStatus.FINISHED;
    }

    // * Update battle log and status
    await (prisma as any).battle.update({
      where: { id: battle.id },
      data: {
        status: finalStatus,
        log: JSON.stringify(currentLog)
      }
    });

    // * Reload battle with fresh participant data
    const updatedBattle = await (prisma as any).battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    res.json({
      battle: formatBattle(updatedBattle),
      rolls: diceLogs.length > 0 ? [] : undefined // * Can add dice rolls here if needed
    });
  } catch (error) {
    console.error('Use consumable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBattle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const battle = await (prisma as any).battle.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (!battle) return res.status(404).json({ error: 'Battle not found' });

        res.json({
            battle: formatBattle(battle)
        });
    } catch (error) {
        console.error('Get battle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const endBattle = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.userId;
        const { id } = req.params;
        
        const battle = await (prisma as any).battle.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (!battle) return res.status(404).json({ error: 'Battle not found' });

        // * Verify user owns one of the participants
        const playerParticipant = battle.participants.find((p: any) => p.characterId && p.isPlayer);
        if (playerParticipant && playerParticipant.characterId) {
            const char = await (prisma as any).character.findUnique({ where: { id: playerParticipant.characterId } });
            if (!char || char.userId !== userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }
        }

        // * Mark battle as finished
        await (prisma as any).battle.update({
            where: { id },
            data: { status: BattleStatus.FINISHED }
        });

        // * Sync all player participants back to characters
        for (const participant of battle.participants) {
            if ((participant as any).isPlayer) {
                await syncParticipantToCharacter(participant as unknown as BattleParticipant);
            }
        }

        res.json({ message: 'Battle ended' });
    } catch (error) {
        console.error('End battle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const reviveParticipant = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { battleId, reviverId, targetId } = req.body;

    const battle = await (prisma as any).battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const reviver = battle.participants.find((p: any) => p.id === reviverId);
    const target = battle.participants.find((p: any) => p.id === targetId);

    if (!reviver || !target) {
      return res.status(404).json({ error: 'Participants not found' });
    }

    if (battle.participants[battle.currentTurnIndex].id !== reviver.id) {
      return res.status(400).json({ error: "It's not your turn" });
    }

    if (getParticipantStatus(reviver) !== ParticipantStatus.ALIVE) {
      return res.status(400).json({ error: 'Reviver must be alive' });
    }

    if (getParticipantStatus(target) !== ParticipantStatus.DOWNED) {
      return res.status(400).json({ error: 'Target is not downed' });
    }

    if (reviver.mainActions <= 0) {
      return res.status(400).json({ error: 'No main actions left' });
    }

    const distance = Math.abs((reviver as any).distance - (target as any).distance);
    if (distance > 5) {
      return res.status(400).json({ error: 'Target is too far to revive' });
    }

    const updatedReviver = await (prisma as any).battleParticipant.update({
      where: { id: reviver.id },
      data: { mainActions: Math.max(0, reviver.mainActions - 1) }
    });

    const updatedTarget = await (prisma as any).battleParticipant.update({
      where: { id: target.id },
      data: {
        currentHp: Math.max(1, target.currentHp),
        status: ParticipantStatus.ALIVE,
        downedRoundsRemaining: 0
      }
    });

    if (updatedTarget.characterId) {
      await syncParticipantToCharacter(updatedTarget as unknown as BattleParticipant);
    }

    const currentLog = JSON.parse(battle.log);
    currentLog.push(`${reviver.name} поднимает ${target.name} на ноги!`);

    const updatedBattle = await (prisma as any).battle.update({
      where: { id: battle.id },
      data: { log: JSON.stringify(currentLog) },
      include: { participants: true }
    });

    res.json({
      battle: formatBattle(updatedBattle),
      message: 'Revive successful'
    });
  } catch (error) {
    console.error('Revive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const blockWithShield = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { battleId, participantId, actionType } = req.body; // actionType: 'MAIN' | 'BONUS'

    const battle = await (prisma as any).battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const participant = battle.participants.find((p: any) => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // * Check if it's the participant's turn
    if (battle.participants[battle.currentTurnIndex].id !== participant.id) {
      return res.status(400).json({ error: "It's not your turn" });
    }

    if (!participant.characterId) {
      return res.status(400).json({ error: 'Only player characters can block with shield' });
    }

    // * Check for equipped shield
    const char = await (prisma as any).character.findUnique({
      where: { id: participant.characterId, userId },
      include: { inventory: true }
    });

    if (!char || !char.inventory) {
      return res.status(404).json({ error: 'Character or inventory not found' });
    }

    const items = JSON.parse(char.inventory.items);
    const equippedShield = items.find((i: any) => i.isEquipped && i.templateId.includes('shield'));
    
    if (!equippedShield) {
      return res.status(400).json({ error: 'No shield equipped' });
    }

    // * Check shield durability
    if ((equippedShield.currentDurability || 0) <= 0) {
      return res.status(400).json({ error: 'Shield has no durability left' });
    }

    // * Check available actions
    if (actionType === 'MAIN') {
      if (participant.mainActions <= 0) {
        return res.status(400).json({ error: 'No main actions left' });
      }
    } else {
      if (participant.bonusActions <= 0) {
        return res.status(400).json({ error: 'No bonus actions left' });
      }
    }

    // * Set blocking flag and consume action
    const updatedMainActions = actionType === 'MAIN' ? Math.max(0, participant.mainActions - 1) : participant.mainActions;
    const updatedBonusActions = actionType === 'BONUS' ? Math.max(0, participant.bonusActions - 1) : participant.bonusActions;

    const updatedParticipant = await (prisma as any).battleParticipant.update({
      where: { id: participant.id },
      data: {
        isBlocking: true,
        mainActions: updatedMainActions,
        bonusActions: updatedBonusActions
      }
    });

    // * Update battle log
    const currentLog = JSON.parse(battle.log);
    currentLog.push(`${participant.name} готовится блокировать щитом!`);

    await (prisma as any).battle.update({
      where: { id: battle.id },
      data: { log: JSON.stringify(currentLog) }
    });

    // * Fetch updated battle
    const updatedBattle = await (prisma as any).battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    res.json({
      battle: formatBattle(updatedBattle),
      message: 'Shield block activated'
    });
  } catch (error) {
    console.error('Block with shield error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getActiveBattle = async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const battle = await (prisma as any).battle.findFirst({
      where: {
        status: BattleStatus.ACTIVE,
        participants: {
          some: { characterId }
        }
      },
      include: { participants: true }
    });

    if (!battle) return res.status(404).json({ error: 'No active battle' });

    // * Additional check: ensure no participant is dead (battle should be finished)
    const hasDeadParticipant = battle.participants.some((p: any) => getParticipantStatus(p) === ParticipantStatus.DEAD);
    if (hasDeadParticipant) {
      // * Mark battle as finished if someone is dead
      await (prisma as any).battle.update({
        where: { id: battle.id },
        data: { status: BattleStatus.FINISHED }
      });
      return res.status(404).json({ error: 'Battle already finished' });
    }

    res.json({
      battle: formatBattle(battle)
    });
  } catch (error) {
    console.error('Get active battle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
