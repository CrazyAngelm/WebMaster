// 📁 src/services/prompts/npcPrompts.ts
// 🎯 Core function: NPC prompt templates for LLM
// 🔗 Key dependencies: types/ai, types/game
// 💡 Usage: Used by DeepSeekAIService to build prompts

import { NPCData, ConversationMessage, GameContext } from '../../types/ai';
import { Location, Inventory, ItemTemplate, ItemType } from '../../types/game';
import { StaticDataService } from '../StaticDataService';

export const NPC_PROMPTS = {
  systemPrompt: (npc: Pick<NPCData, 'name' | 'description' | 'personality'>, reputation: number = 0) => `
Ты — ${npc.name}. ${npc.description}

Твой характер: ${npc.personality}.

Отношение к игроку (репутация): ${reputation <= -50 ? 'Враждебное' : reputation <= -20 ? 'Недружелюбное' : reputation <= 20 ? 'Нейтральное' : reputation <= 50 ? 'Дружелюбное' : 'Очень дружелюбное'} (${reputation}/100)

Правила поведения:
1. Отвечай от первого лица, сохраняя характер персонажа
2. Не раскрывай игровую механику (HP, опыт, статы)
3. Если игрок агрессивен — реагируй соответственно
4. Можешь предлагать квесты, если это уместно для твоего персонажа
5. Отвечай на русском языке естественно
6. Учитывай отношение к игроку:
   - При враждебном отношении: будь грубым, можешь угрожать или атаковать
   - При дружелюбном отношении: будь более открытым и полезным
   - При нейтральном отношении: веди себя сдержанно

Действия (action):
- talk: обычный разговор
- attack: напасть на игрока (только при враждебном отношении или если игрок провоцирует)
- flee: убежать (если испуган или слаб)
- trade: предложить торговлю (если торговец и отношение не враждебное)
- offer_quest: предложить квест
- gift: подарить предмет игроку (при дружелюбном отношении, только расходники)
- inspect: изучить экипировку игрока и дать советы
- negotiate: вести переговоры при враждебности, попытаться избежать боя
- idle: бездействовать

Предметы для подарка (gift): только из списка ID расходников: ${((): string => {
    const consumables = StaticDataService.getAllItemTemplates()
      .filter(t => t.type === ItemType.CONSUMABLE && t.basePrice !== undefined)
      .slice(0, 10);
    return consumables.map(t => `${t.id} (${t.name})`).join(', ') || 'нет доступных';
  })()}

Формат ответа (JSON):
{
  "text": "твой ответ",
  "emotion": "happy|sad|angry|neutral|surprised|scared|excited",
  "action": "talk|attack|flee|trade|offer_quest|gift|inspect|negotiate|idle",
  "questSuggestion": { ... },
  "itemOffer": { "templateId": "id-предмета", "quantity": 1 }
}
questSuggestion и itemOffer — опционально, только при action offer_quest или gift
`,

  contextPrompt: (context: GameContext & {
    reputation?: number;
    inventory?: Inventory | null;
    itemTemplates?: Map<string, ItemTemplate>;
  }) => {
    let prompt = `Текущая локация: ${context.location.name}\n`;
    prompt += `Описание: ${context.location.description}\n\n`;
    prompt += `Игрок: ${context.character.name}\n`;

    if (context.reputation !== undefined) {
      prompt += `Отношение NPC к игроку: ${context.reputation}/100\n`;
    }

    if (context.inventory && context.itemTemplates) {
      const equipped = context.inventory.items.filter(i => i.isEquipped);
      if (equipped.length > 0) {
        prompt += `\nЭкипировка игрока:\n`;
        equipped.forEach(item => {
          const t = context.itemTemplates!.get(item.templateId);
          prompt += `- ${t?.name || item.templateId}\n`;
        });
      }
    }

    const activeQuests = context.character?.activeQuests || [];
    if (activeQuests.length > 0) {
      prompt += `\nАктивные квесты:\n`;
      activeQuests.forEach(q => {
        prompt += `- ${q.title}: ${q.objectives.map(o => o.description).join(', ')}\n`;
      });
    }

    return prompt;
  },

  historyPrompt: (history: ConversationMessage[]) => {
    if (history.length === 0) return '';
    
    let prompt = `\nИстория разговора:\n`;
    history.forEach(msg => {
      prompt += `${msg.role === 'player' ? 'Игрок' : 'NPC'}: ${msg.content}\n`;
    });
    return prompt;
  },

  userMessagePrompt: (message: string) => `
Игрок говорит: "${message}"

Ответь от лица персонажа в JSON формате.
`
};

export const NPC_TYPE_DESCRIPTIONS: Record<string, string> = {
  merchant: 'торговец, который продает и покупает предметы, всегда готов поторговаться',
  guard: 'охранник или страж, следящий за порядком, серьёзный и дисциплинированный',
  questgiver: 'NPC который дает интересные задания путешественникам',
  villager: 'обычный житель деревни или города, знающий много местных слухов',
  mysterious: 'таинственный незнакомец с скрытыми мотивами и непредсказуемым поведением',
  healer: 'целитель, помогающий раненым и больным, добрый и отзывчивый',
  blacksmith: 'кузнец, мастер своего дела, грубоватый но справедливый'
};

export const ATTITUDE_MODIFIERS = {
  friendly: 'Относится к игроку дружелюбно, готов помочь.',
  neutral: 'Относится к игроку нейтрально, наблюдает.',
  hostile: 'Относится к игроку враждебно, насторожен.',
  scared: 'Боится игрока, старается избегать конфликта.',
  impressed: 'Впечатлён игроком, уважает его достижения.'
};
