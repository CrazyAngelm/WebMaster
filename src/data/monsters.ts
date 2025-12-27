// 📁 src/data/monsters.ts - Static monster templates
// 🎯 Core function: Database of all monsters and NPCs
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Used by CombatEngine to spawn enemies

import { MonsterTemplate, UUID } from '../types/game';

export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: 'mon-wolf',
    name: 'Wolf',
    rankOrder: 1,
    baseEssence: 100,
    skills: [],
    lootTable: [
      { templateId: 'mat-wolf-heart', chance: 0.3, minQuantity: 1, maxQuantity: 1 }
    ]
  },
  {
    id: 'mon-boar',
    name: 'Boar',
    rankOrder: 1,
    baseEssence: 120,
    skills: [],
    lootTable: []
  },
  {
    id: 'mon-orc',
    name: 'Orc',
    rankOrder: 2,
    baseEssence: 450,
    skills: [],
    lootTable: [
      { templateId: 'mat-iron-ore', chance: 0.1, minQuantity: 1, maxQuantity: 2 }
    ]
  },
  {
    id: 'mon-vampire',
    name: 'Vampire',
    rankOrder: 3,
    baseEssence: 800,
    skills: [],
    lootTable: []
  },
  {
    id: 'mon-lich',
    name: 'Lich',
    rankOrder: 4,
    baseEssence: 1100,
    skills: [],
    lootTable: []
  },
  {
    id: 'mon-death-knight',
    name: 'Death Knight',
    rankOrder: 5,
    baseEssence: 1400,
    skills: [],
    lootTable: []
  },
  {
    id: 'mon-elder-dragon',
    name: 'Elder Dragon',
    rankOrder: 6, // Champion Rank 1
    baseEssence: 1800,
    skills: [],
    lootTable: []
  },
  {
    id: 'mon-abyssal-horror',
    name: 'Abyssal Horror',
    rankOrder: 7, // Champion Rank 2
    baseEssence: 2300,
    skills: [],
    lootTable: []
  },
  {
    id: 'mon-world-eater',
    name: 'World Eater',
    rankOrder: 8, // Champion Rank 3
    baseEssence: 2800,
    skills: [],
    lootTable: []
  }
];

