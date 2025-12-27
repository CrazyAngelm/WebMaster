// 📁 src/data/quests.ts - Quest data
// 🎯 Core function: Static data for available quests
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: QuestService, StaticDataService

import { Quest, QuestStatus } from '../types/game';

export const QUESTS: Quest[] = [
  {
    id: 'quest-tutorial-1',
    title: 'Welcome to Hornygrad',
    description: 'Find your bearings in the outskirts of the city.',
    status: QuestStatus.NOT_STARTED,
    rankRequired: 1,
    objectives: [
      {
        id: 'obj-1',
        description: 'Visit the City Gates',
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
    title: 'Merchant Assistance',
    description: 'The local merchant needs some copper ore for a custom order.',
    status: QuestStatus.NOT_STARTED,
    rankRequired: 1,
    objectives: [
      {
        id: 'obj-2',
        description: 'Collect Copper Ore',
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



