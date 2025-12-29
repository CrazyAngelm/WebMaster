// 📁 src/services/ProfessionService.ts - Profession and XP management
// 🎯 Core function: Handles profession rank calculation and XP progression
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Used by CraftingService to grant XP and check requirements

import { Character, ProfessionType, CharacterProfession } from '../types/game';

export class ProfessionService {
  /**
   * * Experience thresholds for profession ranks
   * * Docs: 1 rank: 0-20, 2 rank: 20-50, etc.
   */
  public static readonly RANK_THRESHOLDS = [
    { rank: 1, minExp: 0, maxExp: 20, name: 'Ученик' },
    { rank: 2, minExp: 20, maxExp: 50, name: 'Подмастерье' },
    { rank: 3, minExp: 50, maxExp: 100, name: 'Умелец' },
    { rank: 4, minExp: 100, maxExp: 200, name: 'Мастер' },
    { rank: 5, minExp: 200, maxExp: 400, name: 'Великий мастер' },
    { rank: 6, minExp: 400, maxExp: Infinity, name: 'Прославленный мастер' },
  ];

  /**
   * * Gets the current rank based on experience
   */
  public static calculateRank(exp: number): number {
    const threshold = this.RANK_THRESHOLDS.find(t => exp >= t.minExp && exp < t.maxExp);
    return threshold ? threshold.rank : 1;
  }

  /**
   * * Gets the name of the rank
   */
  public static getRankName(rank: number): string {
    const threshold = this.RANK_THRESHOLDS.find(t => t.rank === rank);
    return threshold ? threshold.name : 'Ученик';
  }

  /**
   * * Adds experience to a profession and returns the updated character
   */
  public static addExp(character: Character, professionType: ProfessionType, amount: number): Character {
    const professions = [...(character.professions || [])];
    let profIndex = professions.findIndex(p => p.type === professionType);

    if (profIndex === -1) {
      // Initialize new profession if not found
      professions.push({
        type: professionType,
        exp: amount,
        rank: this.calculateRank(amount)
      });
    } else {
      const prof = professions[profIndex];
      const newExp = prof.exp + amount;
      professions[profIndex] = {
        ...prof,
        exp: newExp,
        rank: this.calculateRank(newExp)
      };
    }

    return {
      ...character,
      professions
    };
  }

  /**
   * * Checks if a character has the required profession rank
   */
  public static hasRank(character: Character, professionType: ProfessionType, requiredRank: number): boolean {
    const prof = character.professions.find(p => p.type === professionType);
    return prof ? prof.rank >= requiredRank : requiredRank <= 1;
  }
}

