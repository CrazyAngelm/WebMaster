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

const API_BASE = '/api';

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
  ) => Promise<any>;
  useSkill: (participantId: string, skillId: string, targetId?: string) => Promise<any>;
  useConsumable: (participantId: string, itemId: string, targetId?: string) => Promise<any>;
  blockWithShield: (participantId: string, actionType: 'MAIN' | 'BONUS') => Promise<any>;
  revive: (reviverId: string, targetId: string) => Promise<any>;
  move: (participantId: string, direction?: 'left' | 'right' | 'towards' | 'away', targetDistance?: number) => Promise<void>;
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
      const result = await res.json();
      if (res.ok && result.battle) {
        set({ battle: result.battle, player: useGameStore.getState().character });
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
    if (!token || !character) {
      return;
    }

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
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      // * Trigger initiative rolls
      if (result.rolls && Array.isArray(result.rolls)) {
        const { triggerRoll } = useDiceStore.getState();
        await Promise.all(result.rolls.map((r: any) => triggerRoll(r.sides, r.result, r.label)));
      }

      set({ battle: result.battle, player: character });
      
      // * Refresh character to get latest cooldowns before battle
      await useGameStore.getState().refreshCharacter();
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
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      if (result.battle) {
        set({ battle: result.battle });
        
        // * Refresh character to get updated cooldowns and stats
        await useGameStore.getState().refreshCharacter();
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
      return result;
    } catch (error) {
      console.error('Attack failed:', error);
    }
  },

  blockWithShield: async (participantId, actionType) => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    if (!battle || !token) throw new Error('No battle or token');

    try {
      const res = await fetch(`${API_BASE}/battle/block`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          battleId: battle.id,
          participantId,
          actionType
        })
      });
      
      const result = await res.json();
      if (!res.ok) {
        if (result.battle) {
          set({ battle: result.battle });
        }
        throw new Error(result.error || 'Не удалось блокировать щитом');
      }

      if (result.rolls && Array.isArray(result.rolls)) {
        const { triggerRoll } = useDiceStore.getState();
        await Promise.all(result.rolls.map((r: any) => triggerRoll(r.sides, r.result, r.label)));
      }

      if (result.battle) {
        set({ battle: result.battle });
      } else {
        await get().syncBattle(battle.id);
      }

      return result;
    } catch (error) {
      console.error('Block failed:', error);
      throw error;
    }
  },

  revive: async (reviverId, targetId) => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    if (!battle || !token) throw new Error('No battle or token');

    try {
      const res = await fetch(`${API_BASE}/battle/revive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          battleId: battle.id,
          reviverId,
          targetId
        })
      });

      const result = await res.json();
      if (!res.ok) {
        if (result.battle) {
          set({ battle: result.battle });
        }
        throw new Error(result.error || 'Не удалось поднять союзника');
      }

      if (result.battle) {
        set({ battle: result.battle });
        await useGameStore.getState().refreshCharacter();
      }

      return result;
    } catch (error) {
      console.error('Revive failed:', error);
      throw error;
    }
  },

  useSkill: async (participantId, skillId, targetId) => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    if (!battle || !token) throw new Error('No battle or token');

    try {
      const res = await fetch(`${API_BASE}/battle/use-skill`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          battleId: battle.id,
          participantId,
          skillId,
          targetId
        })
      });
      
      const result = await res.json();
      if (!res.ok) {
        // * Update battle state even on error (in case server returned updated state)
        if (result.battle) {
          set({ battle: result.battle });
        }
        throw new Error(result.error || 'Не удалось применить способность');
      }

      // * Trigger visual dice rolls if any
      if (result.rolls && Array.isArray(result.rolls)) {
        const { triggerRoll } = useDiceStore.getState();
        await Promise.all(result.rolls.map((r: any) => triggerRoll(r.sides, r.result, r.label)));
      }

      // * Update battle state
      if (result.battle) {
        set({ battle: result.battle });
        
        // * Sync local character stats and SKILLS
        const playerPart = result.battle.participants.find((p: any) => p.characterId === useGameStore.getState().character?.id);
        if (playerPart) {
          await useGameStore.getState().refreshCharacter();
        }
      }
      return result;
    } catch (error) {
      console.error('Use skill failed:', error);
      throw error; // * Re-throw to allow component to handle it
    }
  },

  useConsumable: async (participantId, itemId, targetId) => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    if (!battle || !token) throw new Error('No battle or token');

    try {
      const res = await fetch(`${API_BASE}/battle/use-consumable`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          battleId: battle.id,
          participantId,
          itemId,
          targetId
        })
      });
      
      const result = await res.json();
      if (!res.ok) {
        if (result.battle) {
          set({ battle: result.battle });
        }
        throw new Error(result.error || 'Не удалось использовать предмет');
      }

      if (result.battle) {
        set({ battle: result.battle });

        // * Sync local character stats immediately after consumable use
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
          // * Also refresh character to get updated inventory
          await useGameStore.getState().refreshCharacter();
        }
      }
      return result;
    } catch (error) {
      console.error('Use consumable failed:', error);
      throw error;
    }
  },

  move: async (participantId, direction, targetDistance) => {
    const { battle } = get();
    const { token } = useGameStore.getState();
    if (!battle || !token) return;

    try {
      const res = await fetch(`${API_BASE}/battle/move`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          battleId: battle.id,
          participantId,
          direction,
          targetDistance
        })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      if (result.battle) {
        set({ battle: result.battle });
        
        // Sync local character stats (in case of AoO damage)
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
    } catch (error) {
      console.error('Move failed:', error);
    }
  },

  syncBattle: async (battleId) => {
    const { token } = useGameStore.getState();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/battle/${battleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.battle) {
        set({ battle: result.battle });
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

