// 📁 server/src/utils/combatEngine.ts - Battle logic (Server-side)
// 🎯 Core function: Manages initiative, turns, and combat resolution (hits/damage)
// 🔗 Key dependencies: server/src/types/game.ts, server/src/utils/diceEngine.ts
// 💡 Usage: Main entry point for all combat-related operations on server

import { 
  Battle, 
  BattleParticipant, 
  BattleStatus, 
  ArmorCategory, 
  PenetrationType,
  CharacterBonuses,
  UUID
} from '../types/game';
import { DiceEngine as DICE } from './diceEngine';

export interface RollResult {
  sides: number;
  result: number;
  label: string;
}

export class CombatEngine {
  /**
   * * Resolves an attack between two participants.
   */
  public static resolveAttack(
    attacker: BattleParticipant,
    attackerWeaponEssence: number,
    attackerWeaponPen: PenetrationType | undefined,
    attackerWeaponRange: { minRange: number; maxRange: number } | undefined,
    defender: BattleParticipant,
    defenderArmorIgnore: number,
    defenderArmorPenetration: ArmorCategory | undefined,
    defenderRankMinRoll: number = 1,
    attackerRankMinRoll: number = 1,
    attackerHitPenalty: number = 0,
    defenderEvasionPenalty: number = 0
  ): { hit: boolean; damageDealt: number; log: string; diceLogs: string[]; rolls: RollResult[] } {
    
    // * 0. Distance Check
    if (attackerWeaponRange) {
      const distance = Math.abs(attacker.distance - defender.distance);
      if (distance < attackerWeaponRange.minRange || distance > attackerWeaponRange.maxRange) {
        return { 
          hit: false, 
          damageDealt: 0, 
          log: `Цель вне досягаемости! (Дистанция: ${distance.toFixed(1)}м, Требуется: ${attackerWeaponRange.minRange}-${attackerWeaponRange.maxRange}м)`, 
          diceLogs: [], 
          rolls: [] 
        };
      }
    }

    // * 1. Hit Check
    const attackerBonusesParsed: CharacterBonuses = attacker.bonuses ? JSON.parse(attacker.bonuses) : { accuracy: 0, evasion: 0, initiative: 0, damageResistance: 0 };
    
    const hitSides = Math.max(1, attacker.currentHp + attackerWeaponEssence + (attackerBonusesParsed.accuracy || 0) - attackerHitPenalty);
    
    const hitRoll = DICE.roll(hitSides, attackerRankMinRoll);

    // * Evasion Roll: 1d(Essence + Evasion Bonus - Armor Evasion Penalty)
    const defenderBonusesParsed: CharacterBonuses = defender.bonuses ? JSON.parse(defender.bonuses) : { accuracy: 0, evasion: 0, initiative: 0, damageResistance: 0 };
    const evasionSides = Math.max(1, defender.currentHp + (defenderBonusesParsed.evasion || 0) - defenderEvasionPenalty);
    
    const evasionRoll = DICE.roll(evasionSides, defenderRankMinRoll);

    const rolls: RollResult[] = [
      { sides: hitSides, result: hitRoll, label: `${attacker.name}: Точность` },
      { sides: evasionSides, result: evasionRoll, label: `${defender.name}: Уклонение` }
    ];

    // * Build dice logs
    const diceLogs: string[] = [
      `${attacker.name}: Точность 1d${hitSides} = ${hitRoll}`,
      `${defender.name}: Уклонение 1d${evasionSides} = ${evasionRoll}`
    ];

    // * Tie-breaker: If results are equal, defender wins (counts as miss)
    if (hitRoll <= evasionRoll) {
      return { hit: false, damageDealt: 0, log: 'Промах (уворот)!', diceLogs, rolls };
    }

    // * 1.5. Shield Block Check (before damage calculation)
    if (defender.isBlocking) {
      // * Shield blocks the attack completely, but shield durability is reduced in controller
      return { 
        hit: true, 
        damageDealt: 0, 
        log: 'Атака заблокирована щитом!', 
        diceLogs, 
        rolls 
      };
    }

    // * 2. Damage & Penetration
    const damage = attackerWeaponEssence || 5; // * Default unarmed damage
    let finalDamage = 0;
    let logMessage = '';

    // * Check Penetration
    const weaponPenLevel = this.getPenetrationLevel(attackerWeaponPen);
    const armorLevel = this.getArmorLevel(defenderArmorPenetration);

    if (weaponPenLevel >= armorLevel || defender.currentHp <= 0) {
      // * Penetrates or no armor: Apply damage to Protection then Essence
      // * Apply Damage Resistance bonus from defender
      finalDamage = Math.max(0, damage - defenderArmorIgnore - (defenderBonusesParsed.damageResistance || 0));
      
      this.applyDamage(defender, finalDamage);
      
      logMessage = `Попадание! Нанесено ${finalDamage} урона.`;
    } else {
      // * Does not penetrate: Only reduce armor durability (handled in controller)
      logMessage = 'Попадание! Броня поглотила урон (прочность снижена).';
    }

    return { hit: true, damageDealt: finalDamage, log: logMessage, diceLogs, rolls };
  }

  /**
   * * Helper to apply damage to Protection first, then HP (Essence).
   */
  private static applyDamage(participant: BattleParticipant, amount: number): void {
    if (participant.currentProtection >= amount) {
      participant.currentProtection -= amount;
    } else {
      const remaining = amount - participant.currentProtection;
      participant.currentProtection = 0;
      participant.currentHp = Math.max(0, participant.currentHp - remaining);
    }
  }

  /**
   * * Maps ArmorCategory to a numerical level for penetration checks.
   */
  private static getArmorLevel(category?: ArmorCategory): number {
    switch (category) {
      case ArmorCategory.LIGHT: return 1;
      case ArmorCategory.MEDIUM: return 2;
      case ArmorCategory.HEAVY: return 3;
      case ArmorCategory.SUPER_HEAVY: return 4;
      default: return 0;
    }
  }

  /**
   * * Maps PenetrationType to a numerical level for penetration checks.
   */
  private static getPenetrationLevel(type?: PenetrationType): number {
    switch (type) {
      case PenetrationType.LIGHT: return 1;
      case PenetrationType.MEDIUM: return 2;
      case PenetrationType.HEAVY: return 3;
      case PenetrationType.VERY_HEAVY: return 4;
      default: return 0;
    }
  }

  /**
   * * Resolves a dual-wield attack with two one-handed weapons.
   * * Performs two independent attack rolls, one for each weapon.
   */
  public static resolveDualWieldAttack(
    attacker: BattleParticipant,
    weapon1Essence: number,
    weapon1Pen: PenetrationType | undefined,
    weapon1Range: { minRange: number; maxRange: number } | undefined,
    weapon2Essence: number,
    weapon2Pen: PenetrationType | undefined,
    weapon2Range: { minRange: number; maxRange: number } | undefined,
    defender: BattleParticipant,
    defenderArmorIgnore: number,
    defenderArmorPenetration: ArmorCategory | undefined,
    defenderRankMinRoll: number = 1,
    attackerRankMinRoll: number = 1,
    attackerHitPenalty: number = 0,
    defenderEvasionPenalty: number = 0
  ): { 
    hits: Array<{ hit: boolean; damageDealt: number; log: string; diceLogs: string[]; rolls: RollResult[] }>;
    totalDamage: number;
    logs: string[];
    diceLogs: string[];
    rolls: RollResult[];
  } {
    // * First weapon attack
    const result1 = this.resolveAttack(
      attacker,
      weapon1Essence,
      weapon1Pen,
      weapon1Range,
      defender,
      defenderArmorIgnore,
      defenderArmorPenetration,
      defenderRankMinRoll,
      attackerRankMinRoll,
      attackerHitPenalty,
      defenderEvasionPenalty
    );

    // * Second weapon attack (on same target)
    const result2 = this.resolveAttack(
      attacker,
      weapon2Essence,
      weapon2Pen,
      weapon2Range,
      defender,
      defenderArmorIgnore,
      defenderArmorPenetration,
      defenderRankMinRoll,
      attackerRankMinRoll,
      attackerHitPenalty,
      defenderEvasionPenalty
    );

    const totalDamage = result1.damageDealt + result2.damageDealt;
    const allLogs: string[] = [];
    const allDiceLogs: string[] = [];
    const allRolls: RollResult[] = [];

    // * Combine logs
    allDiceLogs.push(...result1.diceLogs);
    allDiceLogs.push(...result2.diceLogs);
    allRolls.push(...result1.rolls);
    allRolls.push(...result2.rolls);

    if (result1.hit && result2.hit) {
      allLogs.push(`Оба удара попали! Нанесено ${totalDamage} урона.`);
    } else if (result1.hit) {
      allLogs.push(`Первый удар попал (${result1.damageDealt} урона), второй промахнулся.`);
    } else if (result2.hit) {
      allLogs.push(`Первый удар промахнулся, второй попал (${result2.damageDealt} урона).`);
    } else {
      allLogs.push('Оба удара промахнулись!');
    }

    return {
      hits: [result1, result2],
      totalDamage,
      logs: allLogs,
      diceLogs: allDiceLogs,
      rolls: allRolls
    };
  }

  /**
   * * Resolves an Area of Effect (AoE) attack.
   * * One hit roll against multiple evasion rolls (one per target).
   */
  public static resolveAoEAttack(
    attacker: BattleParticipant,
    attackerWeaponEssence: number,
    attackerWeaponPen: PenetrationType | undefined,
    attackerWeaponRange: { minRange: number; maxRange: number } | undefined,
    targets: BattleParticipant[],
    defenderArmorIgnore: number[],
    defenderArmorPenetration: (ArmorCategory | undefined)[],
    defenderRankMinRoll: number = 1,
    attackerRankMinRoll: number = 1,
    attackerHitPenalty: number = 0,
    defenderEvasionPenalty: number[] = []
  ): {
    results: Array<{ target: BattleParticipant; hit: boolean; damageDealt: number; log: string; diceLogs: string[]; rolls: RollResult[] }>;
    totalDamage: number;
    logs: string[];
    diceLogs: string[];
    rolls: RollResult[];
  } {
    // * Single hit roll for attacker
    const attackerBonusesParsed: CharacterBonuses = attacker.bonuses ? JSON.parse(attacker.bonuses) : { accuracy: 0, evasion: 0, initiative: 0, damageResistance: 0 };
    const hitSides = Math.max(1, attacker.currentHp + attackerWeaponEssence + (attackerBonusesParsed.accuracy || 0) - attackerHitPenalty);
    const hitRoll = DICE.roll(hitSides, attackerRankMinRoll);

    const allLogs: string[] = [];
    const allDiceLogs: string[] = [`${attacker.name}: Точность (AoE) 1d${hitSides} = ${hitRoll}`];
    const allRolls: RollResult[] = [{ sides: hitSides, result: hitRoll, label: `${attacker.name}: Точность (AoE)` }];

    const damage = attackerWeaponEssence || 5;
    let totalDamage = 0;
    const results: Array<{ target: BattleParticipant; hit: boolean; damageDealt: number; log: string; diceLogs: string[]; rolls: RollResult[] }> = [];

    // * Check each target
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const armorIgnore = defenderArmorIgnore[i] || 0;
      const armorPen = defenderArmorPenetration[i];
      const evasionPenalty = defenderEvasionPenalty[i] || 0;

      // * Distance check
      if (attackerWeaponRange) {
        const distance = Math.abs(attacker.distance - target.distance);
        if (distance < attackerWeaponRange.minRange || distance > attackerWeaponRange.maxRange) {
          results.push({
            target,
            hit: false,
            damageDealt: 0,
            log: `${target.name} вне досягаемости AoE атаки`,
            diceLogs: [],
            rolls: []
          });
          continue;
        }
      }

      // * Evasion roll for this target
      const defenderBonusesParsed: CharacterBonuses = target.bonuses ? JSON.parse(target.bonuses) : { accuracy: 0, evasion: 0, initiative: 0, damageResistance: 0 };
      const evasionSides = Math.max(1, target.currentHp + (defenderBonusesParsed.evasion || 0) - evasionPenalty);
      const evasionRoll = DICE.roll(evasionSides, defenderRankMinRoll);

      allDiceLogs.push(`${target.name}: Уклонение 1d${evasionSides} = ${evasionRoll}`);
      allRolls.push({ sides: evasionSides, result: evasionRoll, label: `${target.name}: Уклонение` });

      // * Check if hit (hitRoll > evasionRoll)
      if (hitRoll > evasionRoll) {
        // * Calculate damage
        const weaponPenLevel = this.getPenetrationLevel(attackerWeaponPen);
        const armorLevel = this.getArmorLevel(armorPen);

        let finalDamage = 0;
        if (weaponPenLevel >= armorLevel || target.currentHp <= 0) {
          finalDamage = Math.max(0, damage - armorIgnore - (defenderBonusesParsed.damageResistance || 0));
          this.applyDamage(target, finalDamage);
          totalDamage += finalDamage;
        }

        results.push({
          target,
          hit: true,
          damageDealt: finalDamage,
          log: `Попадание по ${target.name}! Нанесено ${finalDamage} урона.`,
          diceLogs: [],
          rolls: []
        });
      } else {
        results.push({
          target,
          hit: false,
          damageDealt: 0,
          log: `${target.name} уклонился от AoE атаки!`,
          diceLogs: [],
          rolls: []
        });
      }
    }

    // * Build summary log
    const hitCount = results.filter(r => r.hit).length;
    allLogs.push(`AoE атака: попадание по ${hitCount} из ${targets.length} целей. Общий урон: ${totalDamage}`);

    return {
      results,
      totalDamage,
      logs: allLogs,
      diceLogs: allDiceLogs,
      rolls: allRolls
    };
  }
}

