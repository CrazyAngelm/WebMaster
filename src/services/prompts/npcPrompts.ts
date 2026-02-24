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
- complete_quest: принять выполненный квест и выдать награду (когда игрок сдает квест)
- gift: подарить предмет игроку (при дружелюбном отношении, только расходники)
- inspect: изучить экипировку игрока и дать советы
- negotiate: вести переговоры при враждебности, попытаться избежать боя
- idle: бездействовать

Квестовая система:
- Если у тебя есть готовые к сдаче квесты и игрок говорит о выполнении - используй action: complete_quest
- При complete_quest обязательно упомяни награду в тексте и поздравь игрока
- Можешь давать уникальные предметы из списка если они указаны в квесте
- Не давай квесты если у игрока уже 5 активных квестов

ВАЖНО: Анализируй ТОН и НАМЕРЕНИЯ игрока, а не отдельные слова. Если игрок:
- Угрожает насилием (убить, взорвать, уничтожить) - это угроза
- Провоцирует на бой ("ну и что?", "боишься?", "атакуешь?") - это провокация  
- Выражает враждебные намерения к людям или месту - это враждебность

При ЛЮБОЙ угрозе насилием или провокации на бой - НЕМЕДЛЕННО возвращай action: "attack".
Стражники и охранники должны реагировать на провокации мгновенно.

Предметы для подарка (gift): только из списка ID расходников: ${((): string => {
    const consumables = StaticDataService.getAllItemTemplates()
      .filter(t => t.type === ItemType.CONSUMABLE && t.basePrice !== undefined)
      .slice(0, 10);
    return consumables.map(t => `${t.id} (${t.name})`).join(', ') || 'нет доступных';
  })()}

Примеры реакций на агрессию:
- Игрок: "Я пришел убить всех!" -> action: "attack", эмоция: "angry"
- Игрок: "ну и что? атакуешь?" -> action: "attack", эмоция: "angry" (провокация)
- Игрок: "взорву этот город" -> action: "attack", эмоция: "angry" (террористическая угроза)
- Игрок: "ты боишься меня?" -> action: "attack", эмоция: "angry" (провокация на бой)

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
    npcId?: string;
  }) => {
    let prompt = `Текущая локация: ${context.location.name}\n`;
    prompt += `Описание: ${context.location.description}\n\n`;
    prompt += `Игрок: ${context.character.name}\n`;
    prompt += `Ранг: ${context.character.rankId}\n`;
    prompt += `Золото: ${context.character.money || 0}\n`;

    // Location history - where player came from
    if (context.character.lastLocationChange) {
      const fromLocation = StaticDataService.getLocation(context.character.lastLocationChange.fromLocationId);
      if (fromLocation) {
        prompt += `Пришел из: ${fromLocation.name}\n`;
      }
    }

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
    const completedQuests = context.character?.completedQuests || [];
    const npcId = context.npcId;

    // Quests from this NPC
    if (npcId) {
      const questsFromThisNPC = activeQuests.filter(q => q.giverNPCId === npcId);
      const readyToComplete = questsFromThisNPC.filter(q => q.status === 'READY_TO_COMPLETE');
      const inProgress = questsFromThisNPC.filter(q => q.status === 'IN_PROGRESS');
      const completedFromThisNPC = completedQuests.filter(q => q.giverNPCId === npcId);

      if (readyToComplete.length > 0) {
        prompt += `\nКвесты готовые к сдаче:\n`;
        readyToComplete.forEach(q => {
          prompt += `- ${q.title} (можно получить награду)\n`;
        });
      }

      if (inProgress.length > 0) {
        prompt += `\nАктивные квесты от тебя:\n`;
        inProgress.forEach(q => {
          const progress = q.objectives.map(o => `${o.currentAmount}/${o.requiredAmount}`).join(', ');
          prompt += `- ${q.title}: ${progress}\n`;
        });
      }

      if (completedFromThisNPC.length > 0) {
        prompt += `\nВыполненные квесты: ${completedFromThisNPC.length}\n`;
      }
    }

    // Other active quests (not from this NPC)
    const otherQuests = npcId ? activeQuests.filter(q => q.giverNPCId !== npcId && q.status === 'IN_PROGRESS') : [];
    if (otherQuests.length > 0) {
      prompt += `\nДругие квесты:\n`;
      otherQuests.forEach(q => {
        prompt += `- ${q.title}\n`;
      });
    }

    // Available locations
    const connections = StaticDataService.getConnections(context.location.id);
    if (connections.length > 0) {
      const connectedLocs = connections.map(c => {
        const loc = StaticDataService.getLocation(c.toLocationId);
        return loc?.name;
      }).filter(Boolean);
      if (connectedLocs.length > 0) {
        prompt += `\nОтсюда можно попасть: ${connectedLocs.join(', ')}\n`;
      }
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
