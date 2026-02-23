// 📁 src/services/prompts/npcPrompts.ts
// 🎯 Core function: NPC prompt templates for LLM
// 🔗 Key dependencies: types/ai, types/game
// 💡 Usage: Used by DeepSeekAIService to build prompts

import { NPCData, ConversationMessage, GameContext } from '../../types/ai';
import { Location } from '../../types/game';

export const NPC_PROMPTS = {
  systemPrompt: (npc: Pick<NPCData, 'name' | 'description' | 'personality'>) => `
Ты — ${npc.name}. ${npc.description}

Твой характер: ${npc.personality}.

Правила поведения:
1. Отвечай от первого лица, сохраняя характер персонажа
2. Не раскрывай игровую механику (HP, опыт, статы)
3. Если игрок агрессивен — реагируй соответственно
4. Можешь предлагать квесты, если это уместно для твоего персонажа
5. Отвечай на русском языке естественно

Формат ответа (JSON):
{
  "text": "твой ответ",
  "emotion": "happy|sad|angry|neutral|surprised|scared|excited",
  "action": "talk|trade|offer_quest|idle",
  "questSuggestion": { ... } // опционально
}
`,

  contextPrompt: (context: GameContext) => {
    let prompt = `Текущая локация: ${context.location.name}\n`;
    prompt += `Описание: ${context.location.description}\n\n`;
    prompt += `Игрок: ${context.character.name}\n`;

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
