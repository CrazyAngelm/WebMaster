// 📁 src/data/quests.ts - Quest data
// 🎯 Core function: Static data for available quests
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: QuestService, StaticDataService

import { Quest, QuestStatus } from '../types/game';

export const QUESTS: Quest[] = [
  {
    id: 'quest-tutorial-1',
    title: 'Добро пожаловать в Хорниград',
    description: 'Ориентируйтесь на окраинах города.',
    status: QuestStatus.NOT_STARTED,
    rankRequired: 1,
    objectives: [
      {
        id: 'obj-1',
        description: 'Посетите городские ворота',
        type: 'VISIT',
        targetId: 'loc-city-gates',
        requiredAmount: 1,
        currentAmount: 0,
        isCompleted: false
      }
    ],
    rewards: {
      money: 50,
      essence: 10
    }
  },
  {
    id: 'quest-merchant-aid',
    title: 'Помощь торговцу',
    description: 'Местному торговцу нужна медная руда для индивидуального заказа.',
    status: QuestStatus.NOT_STARTED,
    rankRequired: 1,
    objectives: [
      {
        id: 'obj-2',
        description: 'Соберите медную руду',
        type: 'COLLECT',
        targetId: 'mat-copper-ore',
        requiredAmount: 5,
        currentAmount: 0,
        isCompleted: false
      }
    ],
    rewards: {
      money: 150,
      items: [{ templateId: 'con-healing-potion-small', quantity: 2 }]
    }
  }
];



