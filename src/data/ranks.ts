// 📁 src/data/ranks.ts - Rank definitions
// 🎯 Core function: Limits and progression rules for ranks
// 🔗 Key dependencies: src/types/game.ts

import { Rank } from '../types/game';

export const RANKS: Rank[] = [
  {
    id: 'rank-1',
    order: 1,
    name: 'Rank 1',
    maxEssence: 300,
    maxArtifacts: 1,
    maxSkills: 1,
    breakthroughConditions: ['Start of adventure']
  },
  {
    id: 'rank-2',
    order: 2,
    name: 'Rank 2',
    maxEssence: 600,
    maxArtifacts: 1,
    maxSkills: 2,
    breakthroughConditions: ['1 common event', '1d100 > 50', 'Training', 'con-essence-potion']
  },
  {
    id: 'rank-3',
    order: 3,
    name: 'Rank 3',
    maxEssence: 900,
    maxArtifacts: 2,
    maxSkills: 3,
    breakthroughConditions: ['1 rare event', '1d100 > 60', 'Training', 'con-spirit-potion']
  },
  {
    id: 'rank-4',
    order: 4,
    name: 'Rank 4',
    maxEssence: 1200,
    maxArtifacts: 2,
    maxSkills: 4,
    breakthroughConditions: ['1 epic event', '1d100 > 70', 'Training', 'con-phoenix-potion']
  },
  {
    id: 'rank-5',
    order: 5,
    name: 'Rank 5',
    maxEssence: 1500,
    maxArtifacts: 3,
    maxSkills: 5,
    breakthroughConditions: ['1 mythic event', '1d100 > 80', 'Training', 'con-demonic-potion']
  },
  {
    id: 'rank-c1',
    order: 6,
    name: 'Champion Rank 1',
    maxEssence: 2000,
    minEssenceRoll: 250,
    maxArtifacts: 3,
    maxSkills: 6,
    breakthroughConditions: ['1 legendary event', '1d100 > 85', 'con-element-potion']
  },
  {
    id: 'rank-c2',
    order: 7,
    name: 'Champion Rank 2',
    maxEssence: 2500,
    minEssenceRoll: 500,
    maxArtifacts: 3,
    maxSkills: 6,
    breakthroughConditions: ['1 legendary event', '1d100 > 90', 'con-chaos-potion']
  },
  {
    id: 'rank-c3',
    order: 8,
    name: 'Champion Rank 3',
    maxEssence: 3000,
    minEssenceRoll: 750,
    maxArtifacts: 4,
    maxSkills: 6,
    breakthroughConditions: ['1 divine event', '1d100 > 50', 'con-death-potion']
  }
];

