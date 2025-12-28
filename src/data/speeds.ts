// 📁 src/data/speeds.ts - Speed definitions
// 🎯 Core function: Movement distances for combat
// 🔗 Key dependencies: src/types/game.ts

import { Speed, SpeedCategory } from '../types/game';

export const SPEEDS: Speed[] = [
  { id: 'speed-very-slow', name: 'Very Slow', category: SpeedCategory.VERY_SLOW, distancePerAction: 5 },
  { id: 'speed-slow', name: 'Slow', category: SpeedCategory.SLOW, distancePerAction: 10 },
  { id: 'speed-ordinary', name: 'Ordinary', category: SpeedCategory.ORDINARY, distancePerAction: 15 },
  { id: 'speed-fast', name: 'Fast', category: SpeedCategory.FAST, distancePerAction: 20 },
  { id: 'speed-very-fast', name: 'Very Fast', category: SpeedCategory.VERY_FAST, distancePerAction: 30 }
];




