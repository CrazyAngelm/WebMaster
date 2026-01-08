// 📁 server/src/utils/skillsEngine.ts - Skills and Abilities logic
// 🎯 Core function: Manages skill casting, cooldowns, and application in combat
// 🔗 Key dependencies: server/src/types/game.ts, server/src/utils/effectsEngine.ts, server/src/utils/combatEngine.ts
// 💡 Usage: Used by battleController to handle skill usage in combat

import { 
  BattleParticipant, 
  CharacterSkill, 
  SkillTemplate,
  ActiveEffect,
  EffectType
} from '../types/game';
import { EffectsEngine } from './effectsEngine';
import { DiceEngine as DICE } from './diceEngine';
import * as crypto from 'crypto';

export class SkillsEngine {
  /**
   * * Checks if a skill can be used by the participant.
   */
  public static canUseSkill(
    participant: BattleParticipant,
    skill: CharacterSkill,
    skillTemplate: SkillTemplate,
    characterRankMaxSkills?: number
  ): { canUse: boolean; reason?: string } {
    // * 1. Check cooldown
    if (skill.currentCooldown > 0) {
      return { canUse: false, reason: `Способность на откате (${skill.currentCooldown} ходов)` };
    }

    // * 2. Check if already casting another skill
    if (skill.castTimeRemaining !== null && skill.castTimeRemaining !== undefined && skill.castTimeRemaining > 0) {
      return { canUse: false, reason: 'Уже применяется способность' };
    }

    // * 3. Check if participant has main action
    if (participant.mainActions <= 0) {
      return { canUse: false, reason: 'Нет основного действия' };
    }

    // * 4. Validate skill rarity against character rank (if provided)
    if (characterRankMaxSkills !== undefined) {
      // Simplified: Assume rank 1 = 1 skill, rank 2 = 2 skills, etc.
      // This should be checked more thoroughly when fetching character rank
      // For now, we'll skip this validation in canUseSkill and validate in controller
    }

    return { canUse: true };
  }

  /**
   * * Starts casting a skill (sets cast time).
   */
  public static startCasting(
    participant: BattleParticipant,
    skill: CharacterSkill,
    skillTemplate: SkillTemplate
  ): void {
    skill.castTimeRemaining = skillTemplate.castTime;
    participant.mainActions = Math.max(0, participant.mainActions - 1);
  }

  /**
   * * Processes cast time for all active casts.
   * * Returns skills that completed casting.
   */
  public static processCastTime(
    participant: BattleParticipant,
    skills: CharacterSkill[]
  ): { completedSkills: CharacterSkill[]; logs: string[] } {
    const logs: string[] = [];
    const completedSkills: CharacterSkill[] = [];

    skills.forEach(skill => {
      if (skill.castTimeRemaining !== null && skill.castTimeRemaining !== undefined && skill.castTimeRemaining > 0) {
        skill.castTimeRemaining--;
        
        if (skill.castTimeRemaining === 0) {
          completedSkills.push(skill);
          logs.push(`${participant.name}: Способность "${skill.skillTemplateId}" готова к применению!`);
        } else {
          logs.push(`${participant.name}: Готовит способность (осталось ${skill.castTimeRemaining} ходов).`);
        }
      }
    });

    return { completedSkills, logs };
  }

  /**
   * * Processes cooldowns for all skills.
   * * Decrements currentCooldown by 1.
   */
  public static processCooldowns(skills: CharacterSkill[]): void {
    skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    });
  }

  /**
   * * Applies a skill to target(s).
   * * Rolls hit check if target is hostile, then applies effects.
   */
  public static applySkill(
    participant: BattleParticipant,
    target: BattleParticipant | null,
    skill: CharacterSkill,
    skillTemplate: SkillTemplate,
    weaponEssence: number = 0,
    attackerRankMinRoll: number = 1,
    targetRankMinRoll: number = 1
  ): { success: boolean; hit: boolean; log: string; diceLogs: string[] } {
    const diceLogs: string[] = [];
    let success = false;
    let hit = false;

    // * 1. Validate target for TARGET type skills
    if (skillTemplate.targetType === 'TARGET' && !target) {
      return {
        success: false,
        hit: false,
        log: 'Нужна цель для применения способности',
        diceLogs: []
      };
    }

    // * 2. Validate range for TARGET type skills
    if (skillTemplate.targetType === 'TARGET' && target && skillTemplate.distance) {
      try {
        let skillRange: { minRange: number; maxRange: number };
        
        if (typeof skillTemplate.distance === 'string') {
          try {
            skillRange = JSON.parse(skillTemplate.distance);
          } catch {
            // Legacy string categories
            switch (skillTemplate.distance) {
              case 'CLOSE': skillRange = { minRange: 0, maxRange: 5 }; break;
              case 'MEDIUM': skillRange = { minRange: 5, maxRange: 15 }; break;
              case 'FAR': skillRange = { minRange: 20, maxRange: 50 }; break;
              case 'SNIPER': skillRange = { minRange: 50, maxRange: 200 }; break;
              default: skillRange = { minRange: 0, maxRange: 5 };
            }
          }
        } else {
          skillRange = skillTemplate.distance;
        }

        const distance = Math.abs(participant.distance - target.distance);
        if (distance < skillRange.minRange || distance > skillRange.maxRange) {
          return {
            success: false,
            hit: false,
            log: `Цель вне досягаемости способности! (Дистанция: ${distance.toFixed(1)}м, Требуется: ${skillRange.minRange}-${skillRange.maxRange}м)`,
            diceLogs: []
          };
        }
      } catch (e) {
        // If range parsing fails, allow skill (may be self-target)
      }
    }

    // * 3. Roll hit check for hostile targets
    if (skillTemplate.targetType === 'TARGET' && target && participant.isPlayer !== target.isPlayer) {
      const attackerBonusesParsed = participant.bonuses ? JSON.parse(participant.bonuses) : { accuracy: 0, evasion: 0, initiative: 0, damageResistance: 0 };
      const hitSides = Math.max(1, participant.currentHp + weaponEssence + (attackerBonusesParsed.accuracy || 0));
      const hitRoll = DICE.roll(hitSides, attackerRankMinRoll);

      const targetBonusesParsed = target.bonuses ? JSON.parse(target.bonuses) : { accuracy: 0, evasion: 0, initiative: 0, damageResistance: 0 };
      const evasionSides = Math.max(1, target.currentHp + (targetBonusesParsed.evasion || 0));
      const evasionRoll = DICE.roll(evasionSides, targetRankMinRoll);

      diceLogs.push(`${participant.name}: Точность способности 1d${hitSides} = ${hitRoll}`);
      diceLogs.push(`${target.name}: Уклонение 1d${evasionSides} = ${evasionRoll}`);

      // Tie-breaker: defender wins
      if (hitRoll <= evasionRoll) {
        skill.castTimeRemaining = null;
        skill.currentCooldown = skillTemplate.cooldown;
        return {
          success: true,
          hit: false,
          log: 'Промах! Способность не попала в цель.',
          diceLogs
        };
      }

      hit = true;
    } else {
      // Self-target or friendly - always hits
      hit = true;
    }

    // * 4. Apply effects (will be handled by battleController with effect templates from DB)
    // Effects application is deferred to battleController where we have access to prisma

    // * 5. Set cooldown and clear cast time
    skill.castTimeRemaining = null;
    skill.currentCooldown = skillTemplate.cooldown;

    success = true;

    return {
      success,
      hit,
      log: hit 
        ? `${participant.name}: Применил "${skillTemplate.name}" на ${target ? target.name : 'себя'}!`
        : 'Способность применена.',
      diceLogs
    };
  }
}
