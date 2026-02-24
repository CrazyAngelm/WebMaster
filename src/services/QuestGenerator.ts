// 📁 src/services/QuestGenerator.ts - AI Quest Generation Service
// 🎯 Core function: Generates quests using AI/LLM
// 🔗 Key dependencies: AIService, types/ai, types/game
// 💡 Usage: Used for procedural quest generation

import { AIService } from './AIService';
import { GameContext, QuestSuggestion, GeneratedQuest } from '../types/ai';
import { mockAIService } from './MockAIService';
import { StaticDataService } from './StaticDataService';
import { ItemType } from '../types/game';

export class QuestGenerator {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || mockAIService;
  }

  setAIService(aiService: AIService) {
    this.aiService = aiService;
  }

  async generateQuest(context: GameContext): Promise<GeneratedQuest | null> {
    try {
      const questSuggestion = await this.aiService.generateQuest(context);
      
      if (!questSuggestion) {
        return this.getFallbackQuest(context);
      }

      return this.transformToQuest(questSuggestion, context);
    } catch (error) {
      console.error('Quest generation error:', error);
      return this.getFallbackQuest(context);
    }
  }

  private transformToQuest(suggestion: QuestSuggestion, context: GameContext): GeneratedQuest {
    return {
      id: `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: suggestion.title,
      description: suggestion.description,
      objectives: suggestion.objectives.map((obj, idx) => ({
        id: `obj-${Date.now()}-${idx}`,
        type: obj.type,
        targetId: obj.target,
        description: obj.target,
        requiredAmount: obj.amount,
        currentAmount: 0,
        isCompleted: false
      })),
      rewards: {
        money: suggestion.rewards?.money,
        essence: suggestion.rewards?.essence,
        items: suggestion.rewards?.items
      },
      status: 'NOT_STARTED',
      rankRequired: context.character.rankId ? parseInt(context.character.rankId) : 1
    };
  }

  private getFallbackQuest(context: GameContext): GeneratedQuest {
    const locationName = context.location.name;
    
    const monsters = StaticDataService.getAllMonsterTemplates();
    const connections = StaticDataService.getConnections(context.location.id);
    const items = StaticDataService.getAllItemTemplates();
    
    const connectedLocations = connections
      .map(c => StaticDataService.getLocation(c.toLocationId))
      .filter((loc): loc is NonNullable<typeof loc> => loc !== undefined);
    
    const consumableItems = items.filter(t => t.type === ItemType.CONSUMABLE);
    const craftingItems = items.filter(t => t.type === ItemType.MATERIAL);
    const allCollectibleItems = [...consumableItems, ...craftingItems];
    
    const randomMonster = monsters.length > 0 
      ? monsters[Math.floor(Math.random() * monsters.length)] 
      : null;
    
    const targetLocation = connectedLocations.length > 0 
      ? connectedLocations[Math.floor(Math.random() * connectedLocations.length)]
      : null;
    
    const randomItem = allCollectibleItems.length > 0
      ? allCollectibleItems[Math.floor(Math.random() * allCollectibleItems.length)]
      : null;
    
    const fallbackQuests = [
      {
        title: randomMonster ? `Охота на ${randomMonster.name}` : `Проблемы в ${locationName}`,
        description: randomMonster 
          ? `Местные просят помочь с ${randomMonster.name}. Они терзают окрестности.`
          : 'Местные жители просят помощи с нападением монстров.',
        objectives: [
          { 
            type: 'KILL' as const, 
            targetId: randomMonster?.id || 'monster-goblin-001', 
            description: `Уничтожить ${randomMonster?.name || 'монстров'}`, 
            requiredAmount: 3 
          }
        ],
        rewards: { money: 100, essence: 50 }
      },
      {
        title: randomItem ? `Сбор ${randomItem.name}` : `Исследование ${locationName}`,
        description: randomItem
          ? `Нужно собрать ${randomItem.name}. Очень нужно для дела!`
          : 'Нужно исследовать окрестности и найти ценные ресурсы.',
        objectives: [
          { 
            type: 'COLLECT' as const, 
            targetId: randomItem?.id || 'herb-medicinal-001', 
            description: `Собрать ${randomItem?.name || 'травы'}`, 
            requiredAmount: 5 
          }
        ],
        rewards: { money: 75, essence: 40 }
      },
      {
        title: targetLocation ? `Путешествие в ${targetLocation.name}` : `Тайна ${locationName}`,
        description: targetLocation
          ? `Мне нужно, чтобы ты сходил в ${targetLocation.name} и узнал, что там происходит.`
          : 'Загадочные события происходят в этой местности...',
        objectives: [
          { 
            type: 'VISIT' as const, 
            targetId: targetLocation?.id || context.location.id, 
            description: `Посетить ${targetLocation?.name || 'локацию'}`, 
            requiredAmount: 1 
          }
        ],
        rewards: { money: 150, essence: 75 }
      }
    ];

    const selected = fallbackQuests[Math.floor(Math.random() * fallbackQuests.length)];

    return {
      id: `quest-${Date.now()}-fallback`,
      title: selected.title,
      description: selected.description,
      objectives: selected.objectives.map((obj, idx) => ({
        id: `obj-fallback-${idx}`,
        type: obj.type,
        targetId: obj.targetId,
        description: obj.description,
        requiredAmount: obj.requiredAmount,
        currentAmount: 0,
        isCompleted: false
      })),
      rewards: selected.rewards,
      status: 'NOT_STARTED',
      rankRequired: context.character.rankId ? parseInt(context.character.rankId) : 1
    };
  }

  async generateDailyQuest(context: GameContext): Promise<GeneratedQuest | null> {
    const dailyQuests = [
      {
        title: 'Дневная тренировка',
        description: 'Потренируйся владению оружием',
        objectives: [
          { type: 'KILL' as const, targetId: 'training_dummy', description: 'Уничтожить 5 манекенов', requiredAmount: 5 }
        ],
        rewards: { money: 50, essence: 30 }
      },
      {
        title: 'Сбор урожая',
        description: 'Помоги фермерам собрать урожай',
        objectives: [
          { type: 'COLLECT' as const, targetId: 'crops', description: 'Собрать урожай', requiredAmount: 10 }
        ],
        rewards: { money: 40, essence: 25 }
      },
      {
        title: 'Курьерская служба',
        description: 'Доставь важное послание',
        objectives: [
          { type: 'VISIT' as const, targetId: 'destination', description: 'Доставить послание', requiredAmount: 1 }
        ],
        rewards: { money: 60, essence: 35 }
      }
    ];

    const selected = dailyQuests[Math.floor(Math.random() * dailyQuests.length)];
    
    return {
      id: `daily-${Date.now()}`,
      title: selected.title,
      description: selected.description,
      objectives: selected.objectives.map((obj, idx) => ({
        id: `obj-daily-${idx}`,
        type: obj.type,
        targetId: obj.targetId,
        description: obj.description,
        requiredAmount: obj.requiredAmount,
        currentAmount: 0,
        isCompleted: false
      })),
      rewards: selected.rewards,
      status: 'NOT_STARTED',
      rankRequired: context.character.rankId ? parseInt(context.character.rankId) : 1
    };
  }
}

export const questGenerator = new QuestGenerator();
