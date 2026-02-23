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
    context: GameContext & { reputation?: number },
    conversationHistory: ConversationMessage[]
  ): Promise<NPCResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const reputation = context.reputation || 0;
    
    // Determine response based on reputation
    let responseText: string;
    let emotion: any = 'neutral';
    let action: any = 'talk';

    if (reputation <= -50) {
      // Hostile responses
      const hostileResponses = [
        'Убирайся прочь, пока я не вызвал стражу!',
        'Ты мне не нравишься. Исчезни.',
        'Следующее слово будет твоим последним.',
        'Хватит меня донимать, негодяй!'
      ];
      responseText = hostileResponses[Math.floor(Math.random() * hostileResponses.length)];
      emotion = 'angry';
      
      // High chance to attack if reputation is very low
      if (Math.random() > 0.6) {
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
      // Neutral responses
      const neutralResponses = [
        'Приветствую, путник. Добро пожаловать в наши земли.',
        'Хм, интересно... Расскажи мне больше о себе.',
        'Осторожнее будь в этих краях. Не все здесь дружелюбны.',
        'А, новый искатель приключений? Удачи тебе, она понадобится.'
      ];
      responseText = neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
    }

    const shouldOfferQuest = Math.random() > 0.7;

    const response: NPCResponse = {
      text: responseText,
      emotion: emotion,
      action: action
    };

    if (shouldOfferQuest && action !== 'attack') {
      response.action = 'offer_quest';
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

  setAuthToken(_token: string): void {
    // no-op for mock
  }
}

export const mockAIService = new MockAIService();
