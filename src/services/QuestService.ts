// 📁 src/services/QuestService.ts - Quest management
// 🎯 Core function: Handles quest progression, objective tracking, and rewards
// 🔗 Key dependencies: src/types/game.ts, src/services/StaticDataService.ts
// 💡 Usage: Called by GameStore to update quest states

import { Character, Inventory, Quest, QuestStatus, UUID } from '../types/game';
import { StaticDataService } from './StaticDataService';

export const QuestService = {
  /**
   * * Updates progress for a specific objective type
   */
  updateProgress(
    quests: Quest[], 
    type: 'KILL' | 'COLLECT' | 'VISIT' | 'INTERACT', 
    targetId: UUID, 
    amount: number = 1
  ): { updatedQuests: Quest[]; newlyCompletedCount: number } {
    let newlyCompletedCount = 0;
    
    const updatedQuests = quests.map(quest => {
      if (quest.status !== QuestStatus.IN_PROGRESS) return quest;

      const updatedObjectives = quest.objectives.map(obj => {
        if (obj.type === type && obj.targetId === targetId && !obj.isCompleted) {
          const newAmount = Math.min(obj.requiredAmount, obj.currentAmount + amount);
          const isNowCompleted = newAmount >= obj.requiredAmount;
          if (isNowCompleted && !obj.isCompleted) newlyCompletedCount++;
          
          return {
            ...obj,
            currentAmount: newAmount,
            isCompleted: isNowCompleted
          };
        }
        return obj;
      });

      // Check if all objectives are completed
      const allDone = updatedObjectives.every(obj => obj.isCompleted);
      
      return {
        ...quest,
        objectives: updatedObjectives,
        status: allDone ? QuestStatus.COMPLETED : QuestStatus.IN_PROGRESS
      };
    });

    return { updatedQuests, newlyCompletedCount };
  },

  /**
   * * Claims rewards for a completed quest
   */
  claimRewards(
    character: Character, 
    inventory: Inventory, 
    quest: Quest
  ): { character: Character; inventory: Inventory } {
    const updatedCharacter = { ...character };
    const updatedInventory = { ...inventory };

    if (quest.rewards.money) {
      updatedCharacter.money += quest.rewards.money;
    }

    if (quest.rewards.essence) {
      updatedCharacter.stats.essence.max += quest.rewards.essence;
      updatedCharacter.stats.essence.current += quest.rewards.essence;
    }

    // Reward items logic (simplified)
    if (quest.rewards.items) {
      quest.rewards.items.forEach(reward => {
        // Just add to inventory for now
        // In real app, use TradeService.createNewItem
      });
    }

    return { character: updatedCharacter, inventory: updatedInventory };
  }
};





