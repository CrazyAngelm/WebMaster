// 📁 src/services/CharacterService.ts - Character management
// 🎯 Core function: Handles stat calculations, rank progression, and speed mapping
// 🔗 Key dependencies: src/types/game.ts, src/engine/DiceEngine.ts
// 💡 Usage: Used by game engine and UI to manage character state

import { 
  Character, 
  Rank, 
  CharacterStats, 
  Speed, 
  SpeedCategory,
  CharacterBonuses,
  Inventory,
  Rarity
} from '../types/game';
import { DiceEngine } from '../engine/DiceEngine';
import { StaticDataService } from './StaticDataService';

export class CharacterService {
  /**
   * * Calculates the current movement distance per action.
   * * Takes armor penalties into account.
   */
  public static calculateMovementDistance(character: Character, speed: Speed, activeArmorPenalty: number = 0): number {
    const baseDistance = speed.distancePerAction;
    return Math.max(0, baseDistance - activeArmorPenalty);
  }

  /**
   * * Checks if a character meets the conditions for a rank breakthrough.
   */
  public static canBreakthrough(
    character: Character, 
    inventory: Inventory,
    nextRank: Rank, 
    completedEventIds: string[]
  ): { success: boolean; reason?: string } {
    // * 1. Potion Check: breakthroughConditions might contain item IDs like 'con-essence-potion'
    const potionId = nextRank.breakthroughConditions.find(c => c.startsWith('con-'));
    if (potionId) {
      const hasPotion = inventory.items.some(i => i.templateId === potionId);
      if (!hasPotion) {
        return { success: false, reason: `Requires ${potionId} in inventory.` };
      }
    }

    // * 2. Event Requirement: Check if character completed enough events of required rarity
    const eventReq = nextRank.breakthroughConditions.find(c => c.toLowerCase().includes('event'));
    if (eventReq) {
      const requiredRarity = this.parseRarity(eventReq);
      const completedEvents = completedEventIds
        .map(id => StaticDataService.getEvent(id))
        .filter(e => e && e.rarity === requiredRarity);
      
      if (completedEvents.length < 1) {
        return { success: false, reason: `Requires at least one ${requiredRarity} event completion.` };
      }
    }

    // * 3. Probability Check: 1d100 > Threshold
    const probReq = nextRank.breakthroughConditions.find(c => c.includes('1d100 >'));
    if (probReq) {
      const threshold = parseInt(probReq.split('>')[1].trim());
      const roll = DiceEngine.d100();
      if (roll <= threshold) {
        return { success: false, reason: `Breakthrough failed! Roll: ${roll} (Needed > ${threshold}).` };
      }
    }

    return { success: true };
  }

  /**
   * * Helper to parse rarity from condition string
   */
  private static parseRarity(str: string): Rarity {
    const s = str.toLowerCase();
    if (s.includes('divine')) return Rarity.DIVINE;
    if (s.includes('legendary')) return Rarity.LEGENDARY;
    if (s.includes('mythic')) return Rarity.MYTHIC;
    if (s.includes('epic')) return Rarity.EPIC;
    if (s.includes('rare')) return Rarity.RARE;
    return Rarity.COMMON;
  }

  /**
   * * Applies essence training.
   * * Docs: Training increases essence by 1-20, costs energy.
   */
  public static trainEssence(character: Character): { gain: number; energyCost: number } | null {
    const config = StaticDataService.getConfig<{ essenceGainRoll: number; energyCost: number }>('TRAINING_CONFIG');
    const ENERGY_COST = config?.energyCost || 20;
    
    if (character.stats.energy.current < ENERGY_COST) {
      return null;
    }

    const gain = DiceEngine.roll(config?.essenceGainRoll || 20);
    character.stats.essence.max += gain;
    character.stats.essence.current += gain;
    character.stats.energy.current -= ENERGY_COST;
    
    return { gain, energyCost: ENERGY_COST };
  }

  /**
   * * Recalculates all character bonuses based on equipment and effects.
   */
  public static refreshBonuses(character: Character, equipmentBonuses: CharacterBonuses): void {
    character.bonuses = {
      evasion: equipmentBonuses.evasion,
      accuracy: equipmentBonuses.accuracy,
      damageResistance: equipmentBonuses.damageResistance,
      initiative: equipmentBonuses.initiative,
    };
  }
}

