// 📁 src/data/races.ts - Race definitions
// 🎯 Core function: Base stats and racial features
// 🔗 Key dependencies: src/types/game.ts

import { Race } from '../types/game';

export const RACES: Race[] = [
  {
    id: 'race-human',
    name: 'Human',
    description: 'Versatile and ambitious.',
    baseSpeedId: 'speed-ordinary',
    innateSkills: [],
    passiveEffects: []
  },
  {
    id: 'race-elf',
    name: 'Elf',
    description: 'Graceful and long-lived.',
    baseSpeedId: 'speed-fast',
    innateSkills: [],
    passiveEffects: []
  }
];



