// 📁 src/store/gameStore.ts - Main game state management
// 🎯 Core function: Handles auth, character selection, and game logic
// 🔗 Key dependencies: zustand, src/services/*
// 💡 Usage: Global state accessible by all components

import { create } from 'zustand';
import { 
  Character, 
  Inventory, 
  ItemTemplate, 
  Rank, 
  ExistingItem,
  Quest,
  GameEvent,
  QuestStatus,
  UUID,
  Recipe,
  ItemType
} from '../types/game';
import { CharacterService } from '../services/CharacterService';
import { InventoryService } from '../services/InventoryService';
import { StaticDataService } from '../services/StaticDataService';
import { WorldService } from '../services/WorldService';
import { TradeService } from '../services/TradeService';
import { QuestService } from '../services/QuestService';
import { EventService } from '../services/EventService';
import { CraftingService } from '../services/CraftingService';
import { ProfessionService } from '../services/ProfessionService';

const API_BASE = 'http://localhost:5000/api';

interface User {
  id: string;
  login: string;
  role: 'USER' | 'ADMIN';
}

interface GameState {
  // Auth State
  user: User | null;
  token: string | null;
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  
  // Character Management
  userCharacters: Character[];
  
  // Active Game State
  character: Character | null;
  inventory: Inventory | null;
  itemTemplates: Map<string, ItemTemplate>;
  ranks: Rank[];
  activeQuests: Quest[];
  activeEvent: GameEvent | null;
  recipes: Recipe[];
  isLoading: boolean;
  isSaving: boolean;
  serverTime: number; 
  serverTimeData: {
    multiplier: number;
    baseRealTime: number;
    baseServerTime: number;
  } | null;
  
  // Auth Actions
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  // Character Selection Actions
  fetchCharacters: () => Promise<void>;
  createCharacter: (name: string, raceId: string) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  selectCharacter: (character: Character) => Promise<void>;

  // Game Logic Actions
  initializeData: () => Promise<void>;
  fetchServerTime: () => Promise<void>;
  syncServerTime: () => void;
  loadGame: () => Promise<void>;
  saveGame: () => Promise<void>;
  trainCharacter: () => void;
  rest: () => void;
  equipItem: (itemId: UUID) => void;
  unequipItem: (itemId: UUID) => void;
  discardItem: (itemId: UUID, quantity?: number) => void;
  craftItem: (recipeId: UUID) => void;
  repairItem: (itemId: UUID) => void;
  moveToLocation: (locationId: UUID) => void;
  enterBuilding: (buildingId: UUID) => void;
  exitBuilding: () => void;
  buyItem: (templateId: UUID, quantity?: number) => void;
  sellItem: (itemId: UUID, quantity?: number) => void;
  acceptQuest: (questId: UUID) => void;
  completeQuest: (questId: UUID) => void;
  setActiveEvent: (event: GameEvent | null) => void;
  handleEventChoice: (choiceId: UUID) => void;
  
  // Admin Actions
  adminAddGold: (amount: number) => Promise<void>;
  adminSkipTime: (hours: number) => Promise<void>;
  adminSetMultiplier: (multiplier: number) => Promise<void>;
  adminForceRest: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  authStatus: 'idle',
  userCharacters: [],
  character: null,
  inventory: null,
  itemTemplates: new Map(),
  ranks: [],
  activeQuests: [],
  activeEvent: null,
  recipes: [],
  isLoading: true,
  isSaving: false,
  serverTime: 0,
  serverTimeData: null,

  // --- Auth Actions ---
  login: async (login, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, authStatus: 'authenticated' });
    await get().initializeData();
    await get().fetchCharacters();
  },

  register: async (login, password, role) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, authStatus: 'authenticated' });
    await get().initializeData();
    set({ userCharacters: [] });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ 
      user: null, 
      token: null, 
      authStatus: 'unauthenticated', 
      character: null, 
      inventory: null,
      userCharacters: []
    });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ authStatus: 'unauthenticated', isLoading: false });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        set({ user: data.user, authStatus: 'authenticated' });
        await get().initializeData();
        await get().fetchCharacters();
      } else {
        get().logout();
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      set({ authStatus: 'unauthenticated', isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // --- Character Selection Actions ---
  fetchCharacters: async () => {
    const token = get().token;
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/characters`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store' // * Prevent browser caching
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch characters:', errorData);
        set({ userCharacters: [] });
        return;
      }
      const data = await res.json();
      set({ userCharacters: data || [] });
    } catch (e) {
      console.error('Failed to fetch characters:', e);
      set({ userCharacters: [] });
    }
  },

  createCharacter: async (name, raceId) => {
    const token = get().token;
    if (!token) return;

    const res = await fetch(`${API_BASE}/characters`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, raceId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    await get().fetchCharacters();
  },

  deleteCharacter: async (id) => {
    const token = get().token;
    if (!token) return;

    const res = await fetch(`${API_BASE}/characters/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    
    await get().fetchCharacters();
    if (get().character?.id === id) {
      set({ character: null, inventory: null });
    }
  },

  selectCharacter: async (character) => {
    try {
      set({ 
        character, 
        inventory: (character as any).inventory,
        activeQuests: character.activeQuests || [],
        isLoading: true 
      });
      // Initialize game data if needed
      await get().initializeData();
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to select character:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // --- Admin Actions ---
  adminAddGold: async (amount) => {
    const { token, character } = get();
    if (!token || !character) return;
    const res = await fetch(`${API_BASE}/admin/add-gold`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ characterId: character.id, amount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    set({ character: { ...character, money: data.money } });
  },

  adminSkipTime: async (hours) => {
    const { token } = get();
    if (!token) return;
    const res = await fetch(`${API_BASE}/admin/skip-time`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ hours })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    await get().fetchServerTime();
  },

  adminSetMultiplier: async (multiplier) => {
    const { token } = get();
    if (!token) return;
    const res = await fetch(`${API_BASE}/admin/set-multiplier`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ multiplier })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    await get().fetchServerTime();
  },

  adminForceRest: async () => {
    const { token, character } = get();
    if (!token || !character) return;
    const res = await fetch(`${API_BASE}/admin/force-rest`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ characterId: character.id })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    
    // Fully restore locally
    const stats = { ...character.stats };
    stats.essence.current = stats.essence.max;
    stats.energy.current = stats.energy.max;
    stats.protection.current = stats.protection.max;
    set({ character: { ...character, stats } });
    await get().saveGame();
  },

  // --- Existing Game Actions (Adapted) ---
  initializeData: async () => {
    try {
      await StaticDataService.init();
      await get().fetchServerTime();

      const templates = StaticDataService.getAllItemTemplates();
      const itemMap = new Map<string, ItemTemplate>();
      templates.forEach(t => itemMap.set(t.id, t));
      
      set({ 
        itemTemplates: itemMap,
        ranks: StaticDataService.getAllRanks(),
        recipes: StaticDataService.getAllRecipes()
      });

      // Start time sync/interpolation
      get().syncServerTime();
    } catch (error) {
      console.error('Failed to initialize data:', error);
      // Set empty defaults to prevent crashes
      set({ 
        itemTemplates: new Map(),
        ranks: [],
        recipes: []
      });
    }
  },

  fetchServerTime: async () => {
    try {
      const res = await fetch(`${API_BASE}/static/server-time`);
      if (res.ok) {
        const data = await res.json();
        set({ 
          serverTimeData: {
            multiplier: data.multiplier,
            baseRealTime: data.baseRealTime,
            baseServerTime: data.baseServerTime
          },
          serverTime: data.currentTime
        });
      }
    } catch (e) {
      console.error('Failed to fetch server time:', e);
    }
  },

  syncServerTime: () => {
    // 1. Interpolation interval (every second)
    setInterval(() => {
      const { serverTimeData } = get();
      if (!serverTimeData) return;

      const realElapsedMs = Date.now() - serverTimeData.baseRealTime;
      const realElapsedHours = realElapsedMs / (1000 * 3600);
      const serverElapsedHours = realElapsedHours * serverTimeData.multiplier;
      const currentTime = serverTimeData.baseServerTime + serverElapsedHours;

      set({ serverTime: currentTime });
    }, 1000);

    // 2. Sync interval (every minute)
    setInterval(() => {
      get().fetchServerTime();
    }, 60000);
  },

  loadGame: async () => {
    // This is now handled by checkAuth and selectCharacter
    await get().checkAuth();
  },

  saveGame: async () => {
    const { character, inventory, activeQuests, token } = get();
    if (!character || !token) return;

    set({ isSaving: true });
    try {
      console.log('Saving game...', { 
        money: character.money, 
        itemsCount: inventory?.items?.length 
      });

      // * Sync everything in a single atomic request to avoid race conditions
      const res = await fetch(`${API_BASE}/characters/${character.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stats: character.stats,
          money: character.money,
          professions: character.professions,
          location: character.location,
          bonuses: character.bonuses,
          activeQuests,
          lastTrainTime: typeof character.lastTrainTime === 'number' ? character.lastTrainTime : null,
          inventory: inventory ? {
            items: inventory.items,
            baseSlots: inventory.baseSlots
          } : undefined
        }),
        keepalive: true
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Save failed: ${err.error || res.statusText}`);
      }

      const updatedData = await res.json();
      
      // * Sync state with server data
      set({ 
        character: updatedData,
        inventory: updatedData.inventory,
        activeQuests: updatedData.activeQuests,
        isSaving: false
      });
      
      console.log('Game saved successfully');
    } catch (e) {
      console.error('Save game failed:', e);
      set({ isSaving: false });
      throw e;
    }
  },

  trainCharacter: async () => {
    const { character, serverTime } = get();
    if (!character) return;
    const config = StaticDataService.getConfig<{ cooldownHours: number }>('TRAINING_CONFIG');
    const TRAIN_COOLDOWN = config?.cooldownHours || 12;
    if (character.lastTrainTime !== undefined && (serverTime - character.lastTrainTime) < TRAIN_COOLDOWN) return;

    const updatedCharacter = { 
      ...character,
      stats: { ...character.stats, essence: { ...character.stats.essence }, energy: { ...character.stats.energy }, protection: { ...character.stats.protection } }
    };
    
    const result = CharacterService.trainEssence(updatedCharacter);
    if (result) {
      updatedCharacter.lastTrainTime = serverTime;
      set({ character: updatedCharacter });
      await get().saveGame();
    }
  },

  rest: async () => {
    const { character } = get();
    if (!character) return;
    if (!character.location.buildingId) return;
    const building = StaticDataService.getBuilding(character.location.buildingId);
    if (!building || !building.canRest) return;
    
    const config = StaticDataService.getConfig<{ moneyCost: number; hoursDuration: number }>('REST_CONFIG');
    const REST_COST = config?.moneyCost || 10;
    if (character.money < REST_COST) return;

    const updatedCharacter = { 
      ...character,
      money: character.money - REST_COST,
      stats: { ...character.stats, energy: { ...character.stats.energy }, protection: { ...character.stats.protection } }
    };
    updatedCharacter.stats.essence.current = updatedCharacter.stats.essence.max;
    updatedCharacter.stats.energy.current = updatedCharacter.stats.energy.max;
    updatedCharacter.stats.protection.current = updatedCharacter.stats.protection.max;
    
    set({ character: updatedCharacter });
    await get().saveGame();
  },

  equipItem: async (itemId) => {
    const { character, inventory, ranks, itemTemplates } = get();
    if (!character || !inventory) return;
    
    const itemIndex = inventory.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    let item = inventory.items[itemIndex];
    const template = itemTemplates.get(item.templateId);
    const rank = ranks.find(r => r.id === character.rankId);
    
    if (!template || !rank) return;
    
    const check = InventoryService.canEquip(character, rank, item, template, inventory, itemTemplates);
    if (!check.allowed) return;

    let updatedItems = [...inventory.items];
    let finalEquipId = itemId;

    // * If item is in a stack, split it first
    if (item.quantity > 1) {
      const newItem: ExistingItem = {
        ...item,
        id: crypto.randomUUID(),
        quantity: 1,
        isEquipped: false // Will be set to true in the map below
      };
      
      // Reduce original stack
      updatedItems[itemIndex] = { ...item, quantity: item.quantity - 1 };
      updatedItems.push(newItem);
      finalEquipId = newItem.id;
    }

    updatedItems = updatedItems.map(i => {
      const otherTemplate = itemTemplates.get(i.templateId);
      if (!otherTemplate) return i;

      // * If this is the item being equipped
      if (i.id === finalEquipId) {
        return { ...i, isEquipped: true };
      }

      // * Logic for mutually exclusive items
      if (i.isEquipped) {
        // * 1. Same type (Armor, Weapon, etc.)
        if (otherTemplate.type === template.type) {
          if ([ItemType.ARMOR, ItemType.WEAPON, ItemType.SHIELD].includes(template.type)) {
            return { ...i, isEquipped: false };
          }
        }

        // * 2. Two-handed weapon vs Shield conflict
        if (template.type === ItemType.WEAPON && template.category === 'TWO_HANDED' && otherTemplate.type === ItemType.SHIELD) {
          return { ...i, isEquipped: false };
        }
        if (template.type === ItemType.SHIELD && otherTemplate.type === ItemType.WEAPON && otherTemplate.category === 'TWO_HANDED') {
          return { ...i, isEquipped: false };
        }
      }

      return i;
    });
    
    set({ inventory: { ...inventory, items: updatedItems } });
    await get().saveGame();
  },

  unequipItem: async (itemId) => {
    const { inventory } = get();
    if (!inventory) return;
    const updatedItems = inventory.items.map(i => i.id === itemId ? { ...i, isEquipped: false } : i);
    set({ inventory: { ...inventory, items: updatedItems } });
    await get().saveGame();
  },

  discardItem: async (itemId, quantity = 1) => {
    const { inventory } = get();
    if (!inventory) return;
    
    const itemIndex = inventory.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const item = inventory.items[itemIndex];
    const discardQty = Math.min(quantity, item.quantity);
    
    // * If discarding an equipped item, it will be automatically unequipped as it's removed from inventory
    
    const updatedItems = [...inventory.items];
    
    if (discardQty >= item.quantity) {
      // * Remove item completely
      updatedItems.splice(itemIndex, 1);
    } else {
      // * Reduce quantity
      updatedItems[itemIndex] = {
        ...item,
        quantity: item.quantity - discardQty
      };
    }
    
    set({ inventory: { ...inventory, items: updatedItems } });
    await get().saveGame();
  },

  craftItem: async (recipeId) => {
    const { character, inventory, recipes, itemTemplates } = get();
    if (!character || !inventory) return;
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    const building = character.location.buildingId ? StaticDataService.getBuilding(character.location.buildingId) : null;
    const workstations = building?.workstations || [];
    const result = CraftingService.craft(character, inventory, recipe, itemTemplates, workstations);
    if (result.success && result.character && result.inventory) {
      set({ character: result.character, inventory: result.inventory });
      await get().saveGame();
    }
  },

  repairItem: async (itemId) => {
    const { character, inventory, itemTemplates } = get();
    if (!character || !inventory) return;
    const result = CraftingService.repair(character, inventory, itemId, itemTemplates);
    if (result.success && result.inventory) {
      set({ inventory: result.inventory });
      await get().saveGame();
    }
  },

  moveToLocation: async (locationId) => {
    const { character, activeQuests } = get();
    if (!character) return;
    const moveResult = WorldService.canMoveTo(character, locationId);
    if (moveResult.allowed) {
      const updatedCharacter = WorldService.moveCharacter(character, locationId, moveResult.energyCost || 0);
      const { updatedQuests } = QuestService.updateProgress(activeQuests, 'VISIT', locationId);
      const event = EventService.rollForTravelEvent();
      set({ character: updatedCharacter, activeQuests: updatedQuests, activeEvent: event });
      await get().saveGame();
    }
  },

  enterBuilding: async (buildingId) => {
    const { character } = get();
    if (!character) return;
    const result = WorldService.enterBuilding(character, buildingId);
    if (result.allowed && result.character) {
      set({ character: result.character });
      await get().saveGame();
    }
  },

  exitBuilding: async () => {
    const { character } = get();
    if (!character) return;
    const updatedCharacter = WorldService.exitBuilding(character);
    set({ character: updatedCharacter });
    await get().saveGame();
  },

  buyItem: async (templateId, quantity = 1) => {
    const { character, inventory, activeQuests, itemTemplates } = get();
    if (!character || !inventory) return;
    
    try {
      const result = TradeService.buyItem(character, inventory, templateId, quantity, itemTemplates);
      if (result.success && result.character && result.inventory) {
        const { updatedQuests } = QuestService.updateProgress(activeQuests, 'COLLECT', templateId, quantity);
        set({ character: result.character, inventory: result.inventory, activeQuests: updatedQuests });
        await get().saveGame();
      } else if (result.reason) {
        alert(result.reason);
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      alert(`Ошибка при покупке: ${error.message}`);
      // * Reload characters to sync state back to server if save failed
      await get().fetchCharacters();
    }
  },

  sellItem: async (itemId, quantity = 1) => {
    const { character, inventory } = get();
    if (!character || !inventory) return;
    const result = TradeService.sellItem(character, inventory, itemId, quantity);
    if (result.success && result.character && result.inventory) {
      set({ character: result.character, inventory: result.inventory });
      await get().saveGame();
    }
  },

  acceptQuest: async (questId) => {
    const { activeQuests } = get();
    const quest = activeQuests.find(q => q.id === questId);
    if (!quest || quest.status !== QuestStatus.NOT_STARTED) return;
    const updatedQuests = activeQuests.map(q => q.id === questId ? { ...q, status: QuestStatus.IN_PROGRESS } : q);
    set({ activeQuests: updatedQuests });
    await get().saveGame();
  },

  completeQuest: async (questId) => {
    const { character, inventory, activeQuests } = get();
    if (!character || !inventory) return;
    const quest = activeQuests.find(q => q.id === questId);
    if (quest && quest.status === QuestStatus.COMPLETED) {
      const { character: updatedCharacter, inventory: updatedInventory } = QuestService.claimRewards(character, inventory, quest);
      const updatedQuests = activeQuests.filter(q => q.id !== questId);
      set({ character: updatedCharacter, inventory: updatedInventory, activeQuests: updatedQuests });
      await get().saveGame();
    }
  },

  setActiveEvent: (event) => set({ activeEvent: event }),

  handleEventChoice: async (choiceId) => {
    const { character, activeEvent } = get();
    if (!character || !activeEvent) return;
    const characterToProcess = { ...character, stats: { ...character.stats, essence: { ...character.stats.essence }, energy: { ...character.stats.energy }, protection: { ...character.stats.protection } } };
    const { character: updatedCharacter, message } = EventService.processChoice(characterToProcess, choiceId);
    set({ character: updatedCharacter, activeEvent: null });
    await get().saveGame();
  }
}));