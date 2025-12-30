// 📁 src/store/diceStore.ts - Dice animation management
// 🎯 Core function: Controls the state and sequence of dice roll animations
// 🔗 Key dependencies: zustand
// 💡 Usage: Triggered by DiceEngine, consumed by DiceOverlay

import { create } from 'zustand';

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

interface DiceRollRequest {
  id: string;
  sides: number;
  result: number;
  label?: string;
  onComplete?: () => void;
}

interface DiceState {
  activeRolls: DiceRollRequest[];
  isAnimating: boolean;
  
  // Actions
  triggerRoll: (sides: number, result: number, label?: string) => Promise<void>;
  clearRoll: (id: string) => void;
}

export const useDiceStore = create<DiceState>((set, get) => ({
  activeRolls: [],
  isAnimating: false,

  triggerRoll: async (sides, result, label) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    return new Promise((resolve) => {
      const newRoll: DiceRollRequest = {
        id,
        sides,
        result,
        label,
        onComplete: () => {
          get().clearRoll(id);
          resolve();
        }
      };

      set((state) => ({
        activeRolls: [...state.activeRolls, newRoll],
        isAnimating: true
      }));

      // Auto-resolve after a timeout if something goes wrong with the UI component
      setTimeout(() => {
        const { activeRolls } = get();
        if (activeRolls.some(r => r.id === id)) {
          get().clearRoll(id);
          resolve();
        }
      }, 2500);
    });
  },

  clearRoll: (id) => {
    set((state) => {
      const remainingRolls = state.activeRolls.filter((r) => r.id !== id);
      return {
        activeRolls: remainingRolls,
        isAnimating: remainingRolls.length > 0
      };
    });
  }
}));

