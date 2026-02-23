// 📁 src/services/prompts/questPrompts.ts
// 🎯 Core function: Quest generation prompt templates
// 🔗 Key dependencies: types/ai, types/game
// 💡 Usage: Used by QuestGenerator

import { GameContext } from '../../types/ai';

export const QUEST_PROMPTS = {
  systemPrompt: `
Ты — генератор квестов для фэнтези RPG.
Создавай интересные, сбалансированные квесты подходящие для указанной локации.

Требования к квесту:
1. Название должно быть интригующим (3-7 слов)
2. Описание 2-4 предложения, раскрывающее суть
3. Цели должны быть реализуемыми в игровом мире
4. Награды должны соответствовать сложности
5. Избегай клише и банальных "убей X монстров"

Верни JSON без markdown форматирования:
{
  "title": "Название квеста",
  "description": "Описание квеста",
  "objectives": [
    { "type": "KILL|COLLECT|VISIT|TALK", "target": "Описание цели", "amount": 1-10 }
  ],
  "rewards": { "money": 50-500, "essence": 25-200 }
}
`,

  userPrompt: (context: GameContext) => {
    let prompt = `Локация: ${context.location.name}\n`;
    prompt += `Описание локации: ${context.location.description}\n`;
    prompt += `Игрок: ${context.character.name}\n`;

    if (context.character.rankId) {
      prompt += `Ранг игрока: ${context.character.rankId}\n`;
    }

    const activeQuests = context.character?.activeQuests || [];
    if (activeQuests.length > 0) {
      prompt += `\nАктивные квесты игрока: ${activeQuests.map(q => q.title).join(', ')}\n`;
    }

    prompt += `\nСоздай новый квест для этой локации.`;

    return prompt;
  },

  questTypes: {
    MAIN: 'Основной сюжетный квест',
    SIDE: 'Побочный квест',
    DAILY: 'Ежедневное задание',
    EVENT: 'Событийный квест',
    RAID: 'Осада/рейд'
  },

  objectiveTypes: {
    KILL: 'Уничтожить определенных врагов',
    COLLECT: 'Собрать предметы или ресурсы',
    VISIT: 'Посетить локацию',
    TALK: 'Поговорить с NPC',
    ESCORT: 'Сопроводить персонажа',
    DEFEND: 'Защитить локацию или NPC',
    EXPLORE: 'Исследовать территорию'
  },

  rewardRanges: {
    easy: { money: [20, 50], essence: [10, 25] },
    medium: { money: [50, 150], essence: [25, 75] },
    hard: { money: [150, 300], essence: [75, 150] },
    elite: { money: [300, 500], essence: [150, 300] }
  }
};

export const generateQuestDifficulty = (playerEssence: number): keyof typeof QUEST_PROMPTS.rewardRanges => {
  if (playerEssence < 100) return 'easy';
  if (playerEssence < 300) return 'medium';
  if (playerEssence < 600) return 'hard';
  return 'elite';
};
