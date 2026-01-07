// 📁 src/engine/CombatEngine.ts - Battle logic
// 🎯 Core function: Manages initiative, turns, and combat resolution (hits/damage)
// 🔗 Key dependencies: src/types/game.ts, src/engine/DiceEngine.ts, src/services/CharacterService.ts
// 💡 Usage: Main entry point for all combat-related operations

import { 
  Battle, 
  Participant, 
  Character, 
  BattleStatus, 
  ItemTemplate,
  ExistingItem,
  ArmorCategory,
  ItemType,
  PenetrationType
} from '../types/game';
import { DiceEngine as DICE } from './DiceEngine';
import { StaticDataService } from '../services/StaticDataService';

export class CombatEngine {
  /**
   * * Initializes a new battle, rolling initiative for all participants.
   */
  public static startBattle(participants: Participant[], characterNames?: Map<string, string>): Battle {
    const log: string[] = ['Бой начался!'];
    
    // * Roll initiative: 1d100 + bonus
    participants.forEach(p => {
      const baseRoll = DICE.roll(100, 'Инициатива');
      const bonus = p.initiative || 0;
      p.initiative = baseRoll + bonus;
      
      const name = characterNames?.get(p.characterId) || `Участник ${p.id}`;
      if (bonus > 0) {
        log.push(`${name}: Инициатива 1d100 + ${bonus} = ${p.initiative} (${baseRoll} + ${bonus})`);
      } else {
        log.push(`${name}: Инициатива 1d100 = ${p.initiative}`);
      }
    });

    // * Sort by initiative descending
    const sortedOrder = [...participants].sort((a, b) => b.initiative - a.initiative);

    const config = StaticDataService.getConfig<{ defaultCombatLocationId: string }>('COMBAT_CONFIG');

    return {
      id: crypto.randomUUID(),
      locationId: config?.defaultCombatLocationId || 'combat-zone',
      status: BattleStatus.ACTIVE,
      turnOrder: sortedOrder,
      currentTurnIndex: 0,
      log
    };
  }

  /**
   * * Moves to the next participant's turn.
   */
  public static nextTurn(battle: Battle): void {
    battle.currentTurnIndex = (battle.currentTurnIndex + 1) % battle.turnOrder.length;
    const active = battle.turnOrder[battle.currentTurnIndex];
    
    // * Reset actions for the new turn
    active.currentActions = { main: 1, bonus: 1 };
    // ! Log message for turn change is handled in combatStore where character names are available
  }

  /**
   * * Resolves an attack between two characters.
   */
  public static async resolveAttack(
    attacker: Character,
    attackerWeapon: ExistingItem | null,
    defender: Character,
    defenderArmor: ExistingItem | null,
    armorTemplate: ItemTemplate | null
  ): Promise<{ hit: boolean; damageDealt: number; log: string; diceLogs: string[] }> {
    
    // * 1. Hit Check
    const armorHitPenalty = armorTemplate?.hitPenalty || 0;
    const weaponEssence = attackerWeapon?.currentEssence || 0;
    const hitSides = Math.max(1, attacker.stats.essence.current + weaponEssence + (attacker.bonuses?.accuracy || 0) - armorHitPenalty);
    
    // * Roll for Hit (Animated)
    const attackerRank = StaticDataService.getRank(attacker.rankId);
    const hitRoll = await DICE.rollAnimated(
      hitSides, 
      `${attacker.name}: Точность`, 
      attackerRank?.minEssenceRoll || 1
    );

    // * Evasion Roll: 1d(Essence + Evasion Bonus - Armor Evasion Penalty)
    const armorEvasionPenalty = armorTemplate?.evasionPenalty || 0;
    const evasionSides = Math.max(1, defender.stats.essence.current + (defender.bonuses?.evasion || 0) - armorEvasionPenalty);
    
    // * Roll for Evasion (Animated)
    const defenderRank = StaticDataService.getRank(defender.rankId);
    const evasionRoll = await DICE.rollAnimated(
      evasionSides, 
      `${defender.name}: Уклонение`,
      defenderRank?.minEssenceRoll || 1
    );

    // * Build dice logs
    const diceLogs: string[] = [
      `${attacker.name}: Точность 1d${hitSides} = ${hitRoll}`,
      `${defender.name}: Уклонение 1d${evasionSides} = ${evasionRoll}`
    ];

    // * Tie-breaker: If results are equal, defender wins (counts as miss)
    if (hitRoll <= evasionRoll) {
      return { hit: false, damageDealt: 0, log: 'Промах (уворот)!', diceLogs };
    }

    // * 2. Damage & Penetration
    const config = StaticDataService.getConfig<{ defaultUnarmedDamage: number }>('COMBAT_CONFIG');
    const damage = weaponEssence || (config?.defaultUnarmedDamage || 5);
    let finalDamage = 0;
    let logMessage = '';

    // * Check Penetration
    const weaponTemplate = attackerWeapon ? StaticDataService.getItemTemplate(attackerWeapon.templateId) : null;
    const weaponPen = this.getPenetrationLevel(weaponTemplate?.penetration);
    const armorTypeLevel = this.getArmorLevel(armorTemplate?.category as ArmorCategory);

    if (weaponPen >= armorTypeLevel || !defenderArmor || defenderArmor.currentDurability <= 0) {
      // * Penetrates or no armor: Apply damage to Protection then Essence
      const ignore = armorTemplate?.ignoreDamage || 0;
      const resBonus = defender.bonuses?.damageResistance || 0;
      finalDamage = Math.max(0, damage - ignore - resBonus);
      
      this.applyDamage(defender, finalDamage);
      
      if (defenderArmor) {
        defenderArmor.currentDurability = Math.max(0, defenderArmor.currentDurability - 1);
      }
      
      logMessage = `Попадание! Нанесено ${finalDamage} урона.`;
    } else {
      // * Does not penetrate: Only reduce armor durability
      defenderArmor.currentDurability = Math.max(0, defenderArmor.currentDurability - 1);
      logMessage = 'Попадание! Броня поглотила урон (прочность снижена).';
    }

    return { hit: true, damageDealt: finalDamage, log: logMessage, diceLogs };
  }

  /**
   * * Helper to apply damage to Protection first, then Essence.
   */
  private static applyDamage(character: Character, amount: number): void {
    if (character.stats.protection.current >= amount) {
      character.stats.protection.current -= amount;
    } else {
      const remaining = amount - character.stats.protection.current;
      character.stats.protection.current = 0;
      character.stats.essence.current = Math.max(0, character.stats.essence.current - remaining);
    }

    if (character.stats.essence.current <= 0) {
      character.isDead = true;
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

