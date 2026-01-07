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
    defender: BattleParticipant,
    defenderArmorIgnore: number,
    defenderArmorPenetration: ArmorCategory | undefined,
    defenderRankMinRoll: number = 1,
    attackerRankMinRoll: number = 1
  ): { hit: boolean; damageDealt: number; log: string; diceLogs: string[]; rolls: RollResult[] } {
    
    // * 1. Hit Check
    const armorHitPenalty = 0; // * Simplified for now
    const hitSides = Math.max(1, attacker.currentHp + attackerWeaponEssence - armorHitPenalty);
    
    const hitRoll = DICE.roll(hitSides, attackerRankMinRoll);

    // * Evasion Roll: 1d(Essence - Armor Evasion Penalty)
    const armorEvasionPenalty = 0; // * Simplified
    const evasionSides = Math.max(1, defender.currentHp - armorEvasionPenalty);
    
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

    // * 2. Damage & Penetration
    const damage = attackerWeaponEssence || 5; // * Default unarmed damage
    let finalDamage = 0;
    let logMessage = '';

    // * Check Penetration
    const weaponPenLevel = this.getPenetrationLevel(attackerWeaponPen);
    const armorLevel = this.getArmorLevel(defenderArmorPenetration);

    if (weaponPenLevel >= armorLevel || defender.currentHp <= 0) {
      // * Penetrates or no armor: Apply damage to Protection then Essence
      finalDamage = Math.max(0, damage - defenderArmorIgnore);
      
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
}

