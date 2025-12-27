// 📁 src/engine/CombatEngine.ts - Battle logic
// 🎯 Core function: Manages initiative, turns, and combat resolution (hits/damage)
// 🔗 Key dependencies: src/types/game.ts, src/engine/DiceEngine.ts, src/services/CharacterService.ts
// 💡 Usage: Main entry point for all combat-related operations

import { 
  Battle, 
  Participant, 
  Character, 
  BattleStatus, 
  DiceEngine,
  ItemTemplate,
  ExistingItem,
  ArmorCategory,
  ItemType
} from '../types/game';
import { DiceEngine as DICE } from './DiceEngine';

export class CombatEngine {
  /**
   * * Initializes a new battle, rolling initiative for all participants.
   */
  public static startBattle(participants: Participant[]): Battle {
    // * Roll initiative: 1d100 + bonus
    participants.forEach(p => {
      p.initiative = DICE.d100() + (p.initiative || 0);
    });

    // * Sort by initiative descending
    const sortedOrder = [...participants].sort((a, b) => b.initiative - a.initiative);

    return {
      id: crypto.randomUUID(),
      locationId: 'combat-zone', // Placeholder
      status: BattleStatus.ACTIVE,
      turnOrder: sortedOrder,
      currentTurnIndex: 0,
      log: ['Battle started!']
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
    battle.log.push(`It's now turn for participant ${active.id}`);
  }

  /**
   * * Resolves an attack between two characters.
   */
  public static resolveAttack(
    attacker: Character,
    attackerWeapon: ExistingItem | null,
    defender: Character,
    defenderArmor: ExistingItem | null,
    armorTemplate: ItemTemplate | null
  ): { hit: boolean; damageDealt: number; log: string } {
    
    // * 1. Hit Check
    // * Hit Roll: 1d(Essence + Weapon Essence - Armor Hit Penalty)
    const armorHitPenalty = armorTemplate?.hitPenalty || 0;
    const weaponEssence = attackerWeapon?.currentEssence || 0;
    const hitSides = Math.max(1, attacker.stats.essence.current + weaponEssence - armorHitPenalty);
    const hitRoll = DICE.roll(hitSides);

    // * Evasion Roll: 1d(Essence - Armor Evasion Penalty)
    const armorEvasionPenalty = armorTemplate?.evasionPenalty || 0;
    const evasionSides = Math.max(1, defender.stats.essence.current - armorEvasionPenalty);
    const evasionRoll = DICE.roll(evasionSides);

    if (hitRoll < evasionRoll) {
      return { hit: false, damageDealt: 0, log: 'Attack missed (Evasion)!' };
    }

    // * 2. Damage & Penetration
    const damage = weaponEssence || 5; // Default fist damage if no weapon
    let finalDamage = 0;
    let logMessage = '';

    // * Check Penetration
    const weaponPen = 0; // In a real app, this would come from weapon template
    const armorTypeLevel = this.getArmorLevel(armorTemplate?.armorType);

    if (weaponPen >= armorTypeLevel || !defenderArmor || defenderArmor.currentDurability <= 0) {
      // * Penetrates or no armor: Apply damage to Protection then Essence
      const ignore = armorTemplate?.ignoreDamage || 0;
      finalDamage = Math.max(0, damage - ignore);
      
      this.applyDamage(defender, finalDamage);
      
      if (defenderArmor) {
        defenderArmor.currentDurability = Math.max(0, defenderArmor.currentDurability - 1);
      }
      
      logMessage = `Hit! Dealt ${finalDamage} damage.`;
    } else {
      // * Does not penetrate: Only reduce armor durability
      defenderArmor.currentDurability = Math.max(0, defenderArmor.currentDurability - 1);
      logMessage = 'Hit! But armor absorbed the damage (durability reduced).';
    }

    return { hit: true, damageDealt: finalDamage, log: logMessage };
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
}

