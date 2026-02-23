// 📁 src/services/MockAIService.ts - Mock AI Service
// 🎯 Core function: Mock implementation for development/testing
// 🔗 Key dependencies: AIService interface, types/ai
// 💡 Usage: Used as fallback when real AI is unavailable

import { AIService, GameContext } from './AIService';
import { ConversationMessage, NPCResponse, NPCData, QuestSuggestion } from '../types/ai';
import { Location } from '../types/game';

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
    context: GameContext,
    conversationHistory: ConversationMessage[]
  ): Promise<NPCResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const responseText = this.npcResponses[Math.floor(Math.random() * this.npcResponses.length)];
    const shouldOfferQuest = Math.random() > 0.7;

    const response: NPCResponse = {
      text: responseText,
      emotion: 'neutral',
      action: shouldOfferQuest ? 'offer_quest' : 'talk'
    };

    if (shouldOfferQuest) {
      response.questSuggestion = {
        title: this.questTitles[Math.floor(Math.random() * this.questTitles.length)],
        description: 'Нужна помощь с одним делом. Отправишься?',
        objectives: [
          { type: 'KILL', target: 'монстр', amount: 3 },
          { type: 'VISIT', target: 'локация', amount: 1 }
        ],
        rewards: { money: 100, essence: 50 }
      };
    }

    return response;
  }

  async describeSituation(context: GameContext): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return `Вы находитесь в ${context.location.name}. ${context.location.description}`;
  }

  async generateQuest(context: GameContext): Promise<QuestSuggestion | null> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      title: this.questTitles[Math.floor(Math.random() * this.questTitles.length)],
      description: 'Пришло время нового приключения. Справишься?',
      objectives: [
        { type: 'KILL', target: 'враг', amount: 5 },
        { type: 'COLLECT', target: 'ресурс', amount: 10 }
      ],
      rewards: { money: 200, essence: 100 }
    };
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
}

export const mockAIService = new MockAIService();
