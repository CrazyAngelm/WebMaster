// 📁 server/src/controllers/battleController.ts - Battle controller
// 🎯 Core function: Handles battle creation, attacks, and turn management
// 🔗 Key dependencies: prisma, CombatEngine, DiceEngine
// 💡 Usage: Called by battleRoutes

import { Request, Response } from 'express';
import prisma from '../db';
import { CombatEngine } from '../utils/combatEngine';
import { DiceEngine as DICE } from '../utils/diceEngine';
import { BattleStatus, ArmorCategory, PenetrationType, CharacterStats } from '../types/game';

const syncParticipantToCharacter = async (participant: any) => {
  if (!participant.characterId) return;

  const character = await prisma.character.findUnique({
    where: { id: participant.characterId }
  });

  if (!character) return;

  const stats: CharacterStats = JSON.parse(character.stats);
  stats.essence.current = participant.currentHp;
  stats.protection.current = participant.currentProtection;

  await prisma.character.update({
    where: { id: participant.characterId },
    data: {
      stats: JSON.stringify(stats)
    }
  });
};

export const startBattle = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { playerCharacterId, enemyId, isMonster } = req.body;

    // * Check if an active battle already exists for this character
    const existingBattle = await prisma.battle.findFirst({
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
      const hasDeadParticipant = existingBattle.participants.some(p => p.currentHp <= 0);
      if (hasDeadParticipant) {
        await prisma.battle.update({
          where: { id: existingBattle.id },
          data: { status: BattleStatus.FINISHED }
        });
      } else {
        return res.json({
          ...existingBattle,
          log: JSON.parse(existingBattle.log),
          message: 'Active battle resumed'
        });
      }
    }

    const playerChar = await prisma.character.findUnique({
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
      const monsterTemplate = await prisma.monsterTemplate.findUnique({
        where: { id: enemyId }
      });
      if (!monsterTemplate) return res.status(404).json({ error: 'Monster template not found' });
      enemyName = monsterTemplate.name;
      enemyHp = monsterTemplate.baseEssence;
      enemyProtection = monsterTemplate.baseEssence;
      enemyMonsterId = monsterTemplate.id;
    } else {
      const enemyChar = await prisma.character.findUnique({
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

    const battle = await prisma.battle.create({
      data: {
        locationId: JSON.parse(playerChar.location).locationId,
        status: BattleStatus.ACTIVE,
        currentTurnIndex: 0,
        log: JSON.stringify(['Бой начался!']),
        participants: {
          create: participants.map(p => ({
            characterId: p.characterId,
            monsterTemplateId: (p as any).monsterTemplateId,
            name: p.name,
            initiative: p.initiative,
            currentHp: p.currentHp,
            currentProtection: p.currentProtection,
            maxHp: p.maxHp,
            maxProtection: p.maxProtection,
            isPlayer: p.isPlayer,
            distance: p.distance,
            bonuses: p.bonuses
          }))
        }
      },
      include: { participants: true }
    });

    res.status(201).json({
      ...battle,
      log: JSON.parse(battle.log),
      rolls: initialRolls
    });
  } catch (error) {
    console.error('Start battle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const move = async (req: Request, res: Response) => {
  try {
    const { battleId, participantId, direction, targetDistance } = req.body; // direction: 'left' | 'right' | 'towards' | 'away'

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const participant = battle.participants.find(p => p.id === participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

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
      const char = await prisma.character.findUnique({ where: { id: participant.characterId } });
      if (char) {
        const stats = JSON.parse(char.stats);
        speedId = stats.speedId;
      }
    } else if (participant.monsterTemplateId) {
      const monster = await prisma.monsterTemplate.findUnique({ where: { id: participant.monsterTemplateId } });
      if (monster) {
        speedId = monster.speedId;
      }
    }

    const speed = await prisma.speed.findUnique({ where: { id: speedId } });
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
      const enemies = battle.participants.filter(p => p.isPlayer !== participant.isPlayer && p.currentHp > 0);
      const nearestEnemy = enemies.length > 0 
        ? enemies.reduce((prev, curr) => Math.abs(curr.distance - oldDistance) < Math.abs(prev.distance - oldDistance) ? curr : prev)
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
    const allEnemies = battle.participants.filter(p => p.isPlayer !== participant.isPlayer && p.currentHp > 0);
    for (const enemy of allEnemies) {
      const finalDist = Math.abs(newDistance - enemy.distance);
      if (finalDist < MIN_COMBAT_DISTANCE) {
        // Adjust to maintain minimum distance
        if (newDistance > enemy.distance) {
          newDistance = enemy.distance + MIN_COMBAT_DISTANCE;
        } else {
          newDistance = enemy.distance - MIN_COMBAT_DISTANCE;
        }
        break; // Only adjust for first enemy found (should be nearest)
      }
    }

    const log: string[] = [];
    const diceLogs: string[] = [];
    let isDead = false;

    // * Check for Attacks of Opportunity
    for (const enemy of battle.participants.filter(p => p.isPlayer !== participant.isPlayer && p.currentHp > 0)) {
      const distOld = Math.abs(oldDistance - enemy.distance);
      const distNew = Math.abs(newDistance - enemy.distance);

      if (distOld <= 5 && distNew > distOld) {
        log.push(`Внеочередная атака! ${enemy.name} атакует ${participant.name}, пока тот отступает!`);
        const aooResult = CombatEngine.resolveAttack(
          enemy as any,
          5, 
          PenetrationType.NONE,
          { minRange: 0, maxRange: 5 },
          participant as any,
          0, 
          undefined
        );
        
        diceLogs.push(...aooResult.diceLogs);
        log.push(`${enemy.name}: ${aooResult.log}`);
        
        participant.currentHp = Math.max(0, participant.currentHp - aooResult.damageDealt);
        if (participant.currentHp <= 0) {
          log.push(`${participant.name} повержен при попытке отступления!`);
          isDead = true;
          break; 
        }
      }
    }

    // * Update participant in DB
    const updatedParticipant = await prisma.battleParticipant.update({
      where: { id: participant.id },
      data: {
        distance: newDistance,
        currentHp: participant.currentHp,
        mainActions: participant.mainActions - 1 
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

    if (isDead) {
      await prisma.battle.update({
        where: { id: battle.id },
        data: {
          status: BattleStatus.FINISHED,
          log: JSON.stringify(updatedLog)
        }
      });
      
      if (participant.characterId) {
        await prisma.character.update({
          where: { id: participant.characterId },
          data: { isDead: true }
        });
      }
    } else {
      await prisma.battle.update({
        where: { id: battle.id },
        data: { log: JSON.stringify(updatedLog) }
      });
    }

    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    res.json({
      battle: updatedBattle ? { ...updatedBattle, log: JSON.parse(updatedBattle.log) } : undefined,
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

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: { participants: true }
    });

    if (!battle || battle.status === BattleStatus.FINISHED) {
      return res.status(404).json({ error: 'Battle not found or finished' });
    }

    const attacker = battle.participants.find(p => p.id === attackerId);
    const target = battle.participants.find(p => p.id === targetId);

    if (!attacker || !target) {
      return res.status(404).json({ error: 'Participants not found' });
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

    if (attacker.characterId) {
      const char = await prisma.character.findUnique({
        where: { id: attacker.characterId },
        include: { inventory: true }
      });
      if (char && char.inventory) {
        const items = JSON.parse(char.inventory.items);
        equippedWeapon = items.find((i: any) => i.isEquipped && i.id === weaponId);
        if (equippedWeapon) {
          weaponEssence = equippedWeapon.currentEssence;
          weaponTemplate = await prisma.itemTemplate.findUnique({ where: { id: equippedWeapon.templateId } });
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
        }
      }
    }

    let armorIgnore = 0;
    let armorCat: ArmorCategory | undefined;
    let equippedArmor: any = null;
    let armorHitPenalty = 0;
    let armorEvasionPenalty = 0;

    if (target.characterId) {
        const char = await prisma.character.findUnique({
            where: { id: target.characterId },
            include: { inventory: true }
        });
        if (char && char.inventory) {
            const items = JSON.parse(char.inventory.items);
            equippedArmor = items.find((i: any) => i.isEquipped && i.templateId.includes('armor')); // Simple check
            if (equippedArmor) {
                const template = await prisma.itemTemplate.findUnique({ where: { id: equippedArmor.templateId } });
                armorIgnore = template?.ignoreDamage || 0;
                armorCat = template?.category as ArmorCategory;
                armorHitPenalty = template?.hitPenalty || 0;
                armorEvasionPenalty = template?.evasionPenalty || 0;
            }
        }
    }

    // * Create copies to avoid mutating Prisma objects directly
    const attackerCopy = { ...attacker, currentHp: attacker.currentHp, currentProtection: attacker.currentProtection };
    const targetCopy = { ...target, currentHp: target.currentHp, currentProtection: target.currentProtection };

    const result = CombatEngine.resolveAttack(
      attackerCopy as any,
      weaponEssence,
      weaponPen,
      weaponRange,
      targetCopy as any,
      armorIgnore,
      armorCat,
      1, // defender min roll
      1, // attacker min roll
      armorHitPenalty,
      armorEvasionPenalty
    );

    // * Handle Item Progression and Durability
    const itemUpdatesLog: string[] = [];
    
    // * 1. Weapon Mastery Growth (on successful hit)
    if (result.hit && equippedWeapon && weaponTemplate && weaponTemplate.maxEssence) {
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
            const inv = await prisma.inventory.findUnique({ where: { characterId: attacker.characterId } });
            if (inv) {
              const items = JSON.parse(inv.items);
              const weaponInInv = items.find((i: any) => i.id === equippedWeapon.id);
              if (weaponInInv) {
                weaponInInv.currentEssence = equippedWeapon.currentEssence;
                await prisma.inventory.update({
                  where: { characterId: attacker.characterId },
                  data: { items: JSON.stringify(items) }
                });
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
        const inv = await prisma.inventory.findUnique({ where: { characterId: target.characterId } });
        if (inv) {
          const items = JSON.parse(inv.items);
          const armorInInv = items.find((i: any) => i.id === equippedArmor.id);
          if (armorInInv) {
            armorInInv.currentDurability = equippedArmor.currentDurability;
            await prisma.inventory.update({
              where: { characterId: target.characterId },
              data: { items: JSON.stringify(items) }
            });
          }
        }
      }
    }

    // * Update target state with NEW values after damage application
    const updatedTarget = await prisma.battleParticipant.update({
      where: { id: target.id },
      data: {
        currentHp: Math.max(0, targetCopy.currentHp),
        currentProtection: Math.max(0, targetCopy.currentProtection)
      }
    });

    // * Sync target state back to character if applicable
    await syncParticipantToCharacter(updatedTarget);

    // * If attacker is a player, sync their state (just in case)
    if (attacker.isPlayer) {
      await syncParticipantToCharacter(attacker);
    }

    // * Update attacker actions (use current value from database, not from copy)
    const updatedMainActions = Math.max(0, attacker.mainActions - 1);
    await prisma.battleParticipant.update({
      where: { id: attacker.id },
      data: {
        mainActions: updatedMainActions
      }
    });

    // * Final sync for attacker to save reduced actions if needed (though character doesn't track battle actions)
    if (attacker.isPlayer) {
        await syncParticipantToCharacter(attacker);
    }

    // * Update log
    const currentLog = JSON.parse(battle.log);
    const updatedLog = [...currentLog, ...result.diceLogs, ...itemUpdatesLog, `${attacker.name}: ${result.log}`];

    const isTargetDead = targetCopy.currentHp <= 0;
    
    if (isTargetDead) {
      updatedLog.push(`${targetCopy.name} повержен!`);
      
      // * Mark battle as finished
      await prisma.battle.update({
        where: { id: battle.id },
        data: {
          status: BattleStatus.FINISHED,
          log: JSON.stringify(updatedLog)
        }
      });
      
      // * Sync ALL player participants one last time to ensure everything is saved
      for (const participant of battle.participants) {
        if (participant.isPlayer) {
          const p = await prisma.battleParticipant.findUnique({ where: { id: participant.id } });
          if (p) await syncParticipantToCharacter(p);
        }
      }
      
      // * If target was a character, mark as dead in characters table
      if (targetCopy.characterId) {
        await prisma.character.update({
          where: { id: targetCopy.characterId },
          data: { isDead: true }
        });
      }
    } else {
      await prisma.battle.update({
        where: { id: battle.id },
        data: {
          log: JSON.stringify(updatedLog)
        }
      });
    }

    // * Fetch updated battle state to return fresh data
    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    res.json({
      ...result,
      battleStatus: isTargetDead ? BattleStatus.FINISHED : BattleStatus.ACTIVE,
      updatedLog,
      rolls: result.rolls,
      battle: updatedBattle ? {
        ...updatedBattle,
        log: JSON.parse(updatedBattle.log)
      } : undefined
    });
  } catch (error) {
    console.error('Resolve attack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const nextTurn = async (req: Request, res: Response) => {
    try {
        const { battleId } = req.body;
        const battle = await prisma.battle.findUnique({
            where: { id: battleId },
            include: { participants: true }
        });

        if (!battle) return res.status(404).json({ error: 'Battle not found' });

        const nextIndex = (battle.currentTurnIndex + 1) % battle.participants.length;
        const nextParticipant = battle.participants[nextIndex];

        // * Reset actions for the participant whose turn it now is
        await prisma.battleParticipant.update({
            where: { id: nextParticipant.id },
            data: {
                mainActions: 1,
                bonusActions: 1
            }
        });

        const currentLog = JSON.parse(battle.log);
        currentLog.push(`Ход: ${nextParticipant.name}`);

        const updatedBattle = await prisma.battle.update({
            where: { id: battle.id },
            data: {
                currentTurnIndex: nextIndex,
                log: JSON.stringify(currentLog)
            },
            include: { participants: true }
        });

        res.json({
            ...updatedBattle,
            log: JSON.parse(updatedBattle.log)
        });
    } catch (error) {
        console.error('Next turn error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBattle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const battle = await prisma.battle.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (!battle) return res.status(404).json({ error: 'Battle not found' });

        res.json({
            ...battle,
            log: JSON.parse(battle.log)
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
        
        const battle = await prisma.battle.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (!battle) return res.status(404).json({ error: 'Battle not found' });

        // * Verify user owns one of the participants
        const playerParticipant = battle.participants.find(p => p.characterId && p.isPlayer);
        if (playerParticipant && playerParticipant.characterId) {
            const char = await prisma.character.findUnique({ where: { id: playerParticipant.characterId } });
            if (!char || char.userId !== userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }
        }

        // * Mark battle as finished
        await prisma.battle.update({
            where: { id },
            data: { status: BattleStatus.FINISHED }
        });

        // * Sync all player participants back to characters
        for (const participant of battle.participants) {
            if (participant.isPlayer) {
                await syncParticipantToCharacter(participant);
            }
        }

        res.json({ message: 'Battle ended' });
    } catch (error) {
        console.error('End battle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getActiveBattle = async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const battle = await prisma.battle.findFirst({
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
    const hasDeadParticipant = battle.participants.some(p => p.currentHp <= 0);
    if (hasDeadParticipant) {
      // * Mark battle as finished if someone is dead
      await prisma.battle.update({
        where: { id: battle.id },
        data: { status: BattleStatus.FINISHED }
      });
      return res.status(404).json({ error: 'Battle already finished' });
    }

    res.json({
      ...battle,
      log: JSON.parse(battle.log)
    });
  } catch (error) {
    console.error('Get active battle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

