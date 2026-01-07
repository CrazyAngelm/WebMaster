import { create } from 'zustand';
import { 
  Battle, 
  BattleParticipant, 
  Character, 
  BattleStatus,
  ExistingItem,
  ItemTemplate
} from '../types/game';
import { useGameStore } from './gameStore';
import { useDiceStore } from './diceStore';

const API_BASE = 'http://localhost:5000/api';

interface CombatState {
  battle: Battle | null;
  player: Character | null;
  enemy: Character | null;
  
  // Actions
  initiateBattle: (enemyId: string, isMonster: boolean) => Promise<void>;
  nextTurn: () => Promise<void>;
  executeAttack: (
    attackerId: string,
    targetId: string,
    weaponId: string | null
  ) => Promise<void>;
  endBattle: (battleId?: string) => Promise<void>;
  syncBattle: (battleId: string) => Promise<void>;
  checkActiveBattle: (characterId: string) => Promise<boolean>;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  battle: null,
  player: null,
  enemy: null,

  checkActiveBattle: async (characterId) => {
    const { token } = useGameStore.getState();
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/battle/active/${characterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const battle = await res.json();
      if (res.ok) {
        set({ battle, player: useGameStore.getState().character });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to check active battle:', error);
      return false;
    }
  },

  initiateBattle: async (enemyId, isMonster) => {
    const { token, character } = useGameStore.getState();
    if (!token || !character) return;

    try {
      const res = await fetch(`${API_BASE}/battle/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          playerCharacterId: character.id, 
          enemyId, 
          isMonster 
        })
      });
      
      const battle = await res.json();
      if (!res.ok) throw new Error(battle.error);
      
      // * Trigger initiative rolls
      if (battle.rolls && Array.isArray(battle.rolls)) {
        const { triggerRoll } = useDiceStore.getState();
        await Promise.all(battle.rolls.map((r: any) => triggerRoll(r.sides, r.result, r.label)));
      }

      set({ battle, player: character });
    } catch (error) {
      console.error('Failed to initiate battle:', error);
      throw error;
    }
  },

  nextTurn: async () => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    if (!battle || !token) return;

    try {
      const res = await fetch(`${API_BASE}/battle/next-turn`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ battleId: battle.id })
      });
      
      const updatedBattle = await res.json();
      if (!res.ok) throw new Error(updatedBattle.error);
      
      set({ battle: updatedBattle });
      
      // * Sync local character stats even on turn change (passive effects might apply)
      const playerPart = updatedBattle.participants.find((p: any) => p.characterId === useGameStore.getState().character?.id);
      if (playerPart) {
        const char = useGameStore.getState().character;
        if (char) {
          useGameStore.getState().setCharacter({
            ...char,
            stats: {
              ...char.stats,
              essence: { ...char.stats.essence, current: playerPart.currentHp },
              protection: { ...char.stats.protection, current: playerPart.currentProtection }
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to advance turn:', error);
    }
  },

  executeAttack: async (attackerId, targetId, weaponId) => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    if (!battle || !token) return;

    try {
      const res = await fetch(`${API_BASE}/battle/attack`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          battleId: battle.id,
          attackerId,
          targetId,
          weaponId
        })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      // * Update local character stats immediately after attack to prevent race with saveGame
      if (result.battle) {
        const playerPart = result.battle.participants.find((p: any) => p.characterId === useGameStore.getState().character?.id);
        if (playerPart) {
          const char = useGameStore.getState().character;
          if (char) {
            useGameStore.getState().setCharacter({
              ...char,
              stats: {
                ...char.stats,
                essence: { ...char.stats.essence, current: playerPart.currentHp },
                protection: { ...char.stats.protection, current: playerPart.currentProtection }
              }
            });
          }
        }
      }

      // * Trigger visual dice rolls if any
      if (result.rolls && Array.isArray(result.rolls)) {
        const { triggerRoll } = useDiceStore.getState();
        // Trigger all rolls in parallel and wait for them to finish
        await Promise.all(result.rolls.map((r: any) => triggerRoll(r.sides, r.result, r.label)));
      }

      // * Update battle state from response if available, otherwise sync
      if (result.battle) {
        set({ battle: result.battle });
      } else {
        // Fallback: sync battle state after attack
        await get().syncBattle(battle.id);
      }
    } catch (error) {
      console.error('Attack failed:', error);
    }
  },

  syncBattle: async (battleId) => {
    const { token } = useGameStore.getState();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/battle/${battleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const battle = await res.json();
      if (res.ok) {
        set({ battle });
      }
    } catch (error) {
      console.error('Failed to sync battle:', error);
    }
  },

  endBattle: async (battleId?: string) => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    const battleIdToEnd = battleId || battle?.id;
    
    // * Mark battle as finished on server if ID provided
    if (battleIdToEnd && token) {
      try {
        await fetch(`${API_BASE}/battle/end/${battleIdToEnd}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Failed to end battle on server:', error);
      }
    }
    
    set({ battle: null, player: null, enemy: null });
    
    // * Refresh character stats after battle
    await useGameStore.getState().refreshCharacter();
  }
}));



