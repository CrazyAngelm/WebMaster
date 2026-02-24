// 📁 src/services/QuestService.ts - Quest management
// 🎯 Core function: Handles quest progression, objective tracking, and rewards
// 🔗 Key dependencies: src/types/game.ts, src/services/StaticDataService.ts
// 💡 Usage: Called by GameStore to update quest states

import { Character, CompletedQuest, Inventory, Quest, QuestStatus, UUID } from '../types/game';
import { StaticDataService } from './StaticDataService';
import { TradeService } from './TradeService';

export const QuestService = {
  /**
   * * Updates progress for a specific objective type
   * * Returns quests with READY_TO_COMPLETE status when all objectives are done
   */
  updateProgress(
    quests: Quest[], 
    type: 'KILL' | 'COLLECT' | 'VISIT' | 'INTERACT', 
    targetId: UUID, 
    amount: number = 1
  ): { 
    updatedQuests: Quest[]; 
    newlyReadyCount: number;
    completedQuestTitles: string[];
  } {
    let newlyReadyCount = 0;
    const completedQuestTitles: string[] = [];
    
    const updatedQuests = quests.map(quest => {
      if (quest.status !== QuestStatus.IN_PROGRESS) return quest;

      const updatedObjectives = quest.objectives.map(obj => {
        if (obj.type === type && obj.targetId === targetId && !obj.isCompleted) {
          const newAmount = Math.min(obj.requiredAmount, obj.currentAmount + amount);
          const isNowCompleted = newAmount >= obj.requiredAmount;
          
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
      
      if (allDone && quest.status === QuestStatus.IN_PROGRESS) {
        newlyReadyCount++;
        completedQuestTitles.push(quest.title);
      }
      
      return {
        ...quest,
        objectives: updatedObjectives,
        status: allDone ? QuestStatus.READY_TO_COMPLETE : QuestStatus.IN_PROGRESS
      };
    });

    return { updatedQuests, newlyReadyCount, completedQuestTitles };
  },

  /**
   * * Check if a quest can be turned in to a specific NPC
   */
  canTurnInQuest(quest: Quest, npcId: UUID): boolean {
    if (quest.status !== QuestStatus.READY_TO_COMPLETE) return false;
    
    // Can turn in to the giver or the designated completion NPC
    return quest.giverNPCId === npcId || quest.completionNPCId === npcId;
  },

  /**
   * * Get all quests ready to be turned in to a specific NPC
   */
  getTurnInQuests(quests: Quest[], npcId: UUID): Quest[] {
    return quests.filter(q => this.canTurnInQuest(q, npcId));
  },

  /**
   * * Turn in a quest to an NPC and receive rewards
   * * Returns updated character, inventory, and completed quest record
   */
  turnInQuest(
    character: Character,
    inventory: Inventory,
    quest: Quest,
    itemTemplates: Map<string, any>
  ): { 
    success: boolean;
    character?: Character;
    inventory?: Inventory;
    completedQuest?: CompletedQuest;
    error?: string;
  } {
    if (quest.status !== QuestStatus.READY_TO_COMPLETE) {
      return { success: false, error: 'Квест еще не готов к сдаче' };
    }

    const updatedCharacter = { ...character };
    const updatedInventory = { ...inventory, items: [...inventory.items] };

    // Give money reward
    if (quest.rewards.money) {
      updatedCharacter.money += quest.rewards.money;
    }

    // Give essence reward
    if (quest.rewards.essence) {
      updatedCharacter.stats.essence.max += quest.rewards.essence;
      updatedCharacter.stats.essence.current += quest.rewards.essence;
      updatedCharacter.stats.protection.max += quest.rewards.essence;
      updatedCharacter.stats.protection.current += quest.rewards.essence;
    }

    // Give item rewards
    if (quest.rewards.items) {
      for (const reward of quest.rewards.items) {
        const result = TradeService.addItemToInventory(
          updatedInventory,
          reward.templateId,
          reward.quantity,
          itemTemplates
        );
        if (result.success && result.inventory) {
          updatedInventory.items = result.inventory.items;
        }
      }
    }

    // Create completed quest record
    const completedQuest: CompletedQuest = {
      questId: quest.id,
      title: quest.title,
      giverNPCId: quest.giverNPCId,
      completedAt: Date.now(),
      rewardsReceived: true
    };

    // Remove from active quests and add to completed
    updatedCharacter.activeQuests = updatedCharacter.activeQuests.filter(q => q.id !== quest.id);
    updatedCharacter.completedQuests = [...(updatedCharacter.completedQuests || []), completedQuest];

    return { 
      success: true, 
      character: updatedCharacter, 
      inventory: updatedInventory,
      completedQuest
    };
  },

  /**
   * * Claims rewards for a completed quest (legacy method, use turnInQuest instead)
   */
  claimRewards(
    character: Character, 
    inventory: Inventory, 
    quest: Quest
  ): { character: Character; inventory: Inventory } {
    // Legacy implementation - redirects to turnInQuest
    const result = this.turnInQuest(character, inventory, quest, new Map());
    return { 
      character: result.character || character, 
      inventory: result.inventory || inventory 
    };
  },

  /**
   * * Get quest statistics for an NPC
   */
  getNPCQuestStats(completedQuests: CompletedQuest[], npcId: UUID): {
    totalCompleted: number;
    questsGiven: string[];
  } {
    const npcQuests = completedQuests.filter(q => q.giverNPCId === npcId);
    return {
      totalCompleted: npcQuests.length,
      questsGiven: npcQuests.map(q => q.title)
    };
  }
};
