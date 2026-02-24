// 📁 src/services/MockAIService.ts - Mock AI Service
// 🎯 Core function: Mock implementation for development/testing
// 🔗 Key dependencies: AIService interface, types/ai
// 💡 Usage: Used as fallback when real AI is unavailable

import { AIService, GameContext } from './AIService';
import { ConversationMessage, NPCResponse, NPCData, QuestSuggestion } from '../types/ai';
import { Location, ItemType } from '../types/game';
import { StaticDataService } from './StaticDataService';

export class MockAIService implements AIService {
  private npcResponses = [
    'Приветствую, путник. Добро пожаловать в наши земли.',
    'Хм, интересно... Расскажи мне больше о себе.',
    'Осторожнее будь в этих краях. Не все здесь дружелюбны.',
    'А, новый искатель приключений? Удачи тебе, она понадобится.',
    'Видел много таких, как ты. Большинство не вернулось.',
    'Могу рассказать о здешних местах, если хочешь.',
    'Золото? Золото всем нужно...',
    'Слышал, в лесу появилось что-то странное.'
  ];

  private questTitles = [
    'Проклятое болото',
    'Пропавший торговец',
    'Очищение святилища',
    'Тайна старой шахты',
    'Драконья пещера'
  ];

  private npcNames = [
    { name: 'Эдвард', desc: 'Стражник в блестящих доспехах', personality: 'Серьёзный, дисциплинированный' },
    { name: 'Мирабелла', desc: 'Хозяйка таверны с добрым лицом', personality: 'Дружелюбная, заботливая' },
    { name: 'Гортен', desc: 'Мрачный торовец с подозрительным взглядом', personality: 'Хитрый, расчётливый' },
    { name: 'Себастьян', desc: 'Старый мудрец с длинной бородой', personality: 'Мудрый, загадочный' },
    { name: 'Агнесса', desc: 'Целительница с мягкими руками', personality: 'Добрая, отзывчивая' }
  ];

  async generateResponse(
    npcName: string,
    npcDescription: string,
    personality: string,
    playerMessage: string,
    context: GameContext & { reputation?: number },
    conversationHistory: ConversationMessage[]
  ): Promise<NPCResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const reputation = context.reputation || 0;
    
    // Remove hardcoded aggression detection - let LLM decide based on context
    // Simple reputation-based response logic
    let responseText: string;
    let emotion: any = 'neutral';
    let action: any = 'talk';

    // Base response on reputation and context
    if (reputation <= -50) {
      // Very hostile responses for very bad reputation
      const hostileResponses = [
        'Убирайся прочь, пока я не вызвал стражу!',
        'Ты мне не нравишься. Исчезни.',
        'Следующее слово будет твоим последним.',
        'Хватит меня донимать, негодяй!'
      ];
      responseText = hostileResponses[Math.floor(Math.random() * hostileResponses.length)];
      emotion = 'angry';
      
      // High chance to attack if reputation is very low
      if (Math.random() > 0.4) {
        action = 'attack';
      }
    } else if (reputation >= 50) {
      // Friendly responses
      const friendlyResponses = [
        'Рад тебя видеть, мой друг! Чем могу помочь?',
        'Ах, это ты! Всегда рад поговорить с тобой.',
        'Добрый день! Надеюсь, у тебя всё хорошо?',
        'Приветствую! Хочешь услышать последние новости?'
      ];
      responseText = friendlyResponses[Math.floor(Math.random() * friendlyResponses.length)];
      emotion = 'happy';
    } else {
      // Neutral responses - let LLM handle context
      const neutralResponses = [
        'Приветствую, путник. Добро пожаловать в наши земли.',
        'Хм, интересно... Расскажи мне больше о себе.',
        'Осторожнее будь в этих краях. Не все здесь дружелюбны.',
        'А, новый искатель приключений? Удачи тебе, она понадобится.',
        'Слушаю тебя внимательно. Что привело тебя ко мне?'
      ];
      responseText = neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
    }

    const shouldOfferQuest = Math.random() > 0.7;
    const roll = Math.random();

    const response: NPCResponse = {
      text: responseText,
      emotion: emotion,
      action: action
    };

    // Don't offer quests or gifts if we're attacking
    // Note: Quest generation is now handled by QuestGenerationService in NPCDialog
    if (action !== 'attack' && shouldOfferQuest) {
      response.action = 'offer_quest';
    } else if (reputation >= 50 && roll > 0.75 && action === 'talk') {
      const consumables = StaticDataService.getAllItemTemplates()
        .filter(t => t.type === ItemType.CONSUMABLE && t.basePrice !== undefined);
      if (consumables.length > 0) {
        const gift = consumables[Math.floor(Math.random() * consumables.length)];
        response.action = 'gift';
        response.itemOffer = { templateId: gift.id, quantity: 1 };
        response.text = `Возьми это, пригодится. Дарю тебе ${gift.name}.`;
      }
    } else if (reputation >= 0 && reputation < 50 && roll > 0.8 && action === 'talk') {
      response.action = 'trade';
      response.text = 'Хочешь что-нибудь купить? Заходи в магазин.';
    } else if (reputation >= 0 && roll > 0.85 && action === 'talk') {
      response.action = 'inspect';
      response.text = 'Вижу твоё снаряжение. Неплохо подобрано, но есть над чем поработать.';
    }

    return response;
  }

  async describeSituation(context: GameContext): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return `Вы находитесь в ${context.location.name}. ${context.location.description}`;
  }

  private generateRealisticQuest(context: GameContext): QuestSuggestion {
    const monsters = StaticDataService.getAllMonsterTemplates();
    const locations = StaticDataService.getAllLocations();
    const connections = StaticDataService.getConnections(context.location.id);
    const items = StaticDataService.getAllItemTemplates();

    const questTypeRoll = Math.random();
    let objectives: { type: 'KILL' | 'COLLECT' | 'VISIT'; target: string; amount: number }[] = [];
    let title = '';
    let description = '';

    if (questTypeRoll < 0.35) {
      const randomMonster = monsters.length > 0 
        ? monsters[Math.floor(Math.random() * monsters.length)] 
        : null;
      
      if (randomMonster) {
        const amount = Math.floor(Math.random() * 3) + 3;
        objectives = [{ type: 'KILL', target: randomMonster.id, amount }];
        title = `Охота на ${randomMonster.name}`;
        description = `Нужно уничтожить ${amount} ${randomMonster.name}. Они терзают окрестности.`;
      }
    } else if (questTypeRoll < 0.65) {
      const connectedLocations = connections
        .map(c => StaticDataService.getLocation(c.toLocationId))
        .filter((loc): loc is NonNullable<typeof loc> => loc !== undefined);
      
      if (connectedLocations.length > 0) {
        const targetLocation = connectedLocations[Math.floor(Math.random() * connectedLocations.length)];
        objectives = [{ type: 'VISIT', target: targetLocation.id, amount: 1 }];
        title = `Путешествие в ${targetLocation.name}`;
        description = `Мне нужно, чтобы ты сходил в ${targetLocation.name} и узнал, что там происходит.`;
      }
    } else {
      const consumableItems = items.filter(t => t.type === ItemType.CONSUMABLE);
      const craftingItems = items.filter(t => t.type === ItemType.MATERIAL);
      const allCollectibleItems = [...consumableItems, ...craftingItems];
      
      if (allCollectibleItems.length > 0) {
        const randomItem = allCollectibleItems[Math.floor(Math.random() * allCollectibleItems.length)];
        const amount = Math.floor(Math.random() * 5) + 3;
        objectives = [{ type: 'COLLECT', target: randomItem.id, amount }];
        title = `Сбор ${randomItem.name}`;
        description = `Принеси мне ${amount} штук ${randomItem.name}. Очень нужно!`;
      }
    }

    if (objectives.length === 0) {
      objectives = [{ type: 'KILL', target: 'monster-goblin-001', amount: 3 }];
      title = 'Простое задание';
      description = 'Уничтожь нескольких гоблинов.';
    }

    const rewards = {
      money: Math.floor(Math.random() * 100) + 50,
      essence: Math.floor(Math.random() * 50) + 25
    };

    return {
      title,
      description,
      objectives,
      rewards
    };
  }

  async generateQuest(context: GameContext): Promise<QuestSuggestion | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.generateRealisticQuest(context);
  }

  async generateNPC(
    location: Location,
    npcType?: NPCData['npcType']
  ): Promise<NPCData> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const npc = this.npcNames[Math.floor(Math.random() * this.npcNames.length)];
    
    return {
      id: `npc-mock-${Date.now()}`,
      name: npc.name,
      description: npc.desc,
      personality: npc.personality,
      dialogueGreeting: `Приветствую в ${location.name}!`,
      locationId: location.id,
      npcType: npcType || 'villager'
    };
  }

  isAvailable(): boolean {
    return false;
  }

  setAuthToken(_token: string): void {
    // no-op for mock
  }
}

export const mockAIService = new MockAIService();
