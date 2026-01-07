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
        isPlayer: true
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
        isPlayer: false
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
            monsterTemplateId: p.monsterTemplateId,
            name: p.name,
            initiative: p.initiative,
            currentHp: p.currentHp,
            currentProtection: p.currentProtection,
            maxHp: p.maxHp,
            maxProtection: p.maxProtection,
            isPlayer: p.isPlayer
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

    if (attacker.characterId) {
      const char = await prisma.character.findUnique({
        where: { id: attacker.characterId },
        include: { inventory: true }
      });
      if (char && char.inventory) {
        const items = JSON.parse(char.inventory.items);
        const weapon = items.find((i: any) => i.isEquipped && i.id === weaponId);
        if (weapon) {
          weaponEssence = weapon.currentEssence;
          const template = await prisma.itemTemplate.findUnique({ where: { id: weapon.templateId } });
          weaponPen = (template?.penetration as PenetrationType) || PenetrationType.NONE;
        }
      }
    }

    let armorIgnore = 0;
    let armorCat: ArmorCategory | undefined;

    if (target.characterId) {
        const char = await prisma.character.findUnique({
            where: { id: target.characterId },
            include: { inventory: true }
        });
        if (char && char.inventory) {
            const items = JSON.parse(char.inventory.items);
            const armor = items.find((i: any) => i.isEquipped && i.templateId.includes('armor')); // Simple check
            if (armor) {
                const template = await prisma.itemTemplate.findUnique({ where: { id: armor.templateId } });
                armorIgnore = template?.ignoreDamage || 0;
                armorCat = template?.category as ArmorCategory;
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
      targetCopy as any,
      armorIgnore,
      armorCat
    );

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
    const updatedLog = [...currentLog, ...result.diceLogs, `${attacker.name}: ${result.log}`];

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

