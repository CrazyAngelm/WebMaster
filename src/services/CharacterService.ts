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
  CharacterBonuses
} from '../types/game';
import { DiceEngine } from '../engine/DiceEngine';

export class CharacterService {
  /**
   * * Default speed values as per docs/Боевая система.md
   */
  public static readonly SPEED_MAP: Record<SpeedCategory, number> = {
    [SpeedCategory.VERY_SLOW]: 5,
    [SpeedCategory.SLOW]: 10,
    [SpeedCategory.ORDINARY]: 15,
    [SpeedCategory.FAST]: 20,
    [SpeedCategory.VERY_FAST]: 30,
  };

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
   * * Breakthrough conditions are currently stored as strings in Rank.
   */
  public static canBreakthrough(character: Character, nextRank: Rank, completedEvents: string[]): boolean {
    // * In a real implementation, this would parse the Rank's breakthroughConditions
    // * For now, we simulate the 1d100 check mentioned in the docs
    
    // * Example from docs: Rank 2 requires 1 event + 1d100 > 50
    const roll = DiceEngine.d100();
    
    // * Simplified logic for demonstration
    if (nextRank.order === 2) {
      return completedEvents.length >= 1 && roll > 50;
    }
    if (nextRank.order === 3) {
      return completedEvents.length >= 1 && roll > 60;
    }
    
    return false;
  }

  /**
   * * Applies essence training.
   * * Docs: Training increases essence by 1-20 once per day.
   */
  public static trainEssence(character: Character): number {
    const gain = DiceEngine.roll(20);
    character.stats.essence.max += gain;
    character.stats.essence.current += gain;
    return gain;
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

