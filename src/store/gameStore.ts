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
  Recipe
} from '../types/game';
import { CharacterService } from '../services/CharacterService';
import { InventoryService } from '../services/InventoryService';
import { StorageService } from '../services/StorageService';
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
  worldTime: number; 
  
  // Auth Actions
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  // Character Selection Actions
  fetchCharacters: () => Promise<void>;
  createCharacter: (name: string, raceId: string) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  selectCharacter: (character: Character) => void;

  // Game Logic Actions
  initializeData: () => void;
  loadGame: () => Promise<void>;
  saveGame: () => Promise<void>;
  trainCharacter: () => void;
  rest: () => void;
  equipItem: (itemId: UUID) => void;
  unequipItem: (itemId: UUID) => void;
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
  worldTime: 0,

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
        await get().fetchCharacters();
      } else {
        get().logout();
      }
    } catch (e) {
      set({ authStatus: 'unauthenticated' });
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        set({ userCharacters: data });
      }
    } catch (e) {
      console.error('Failed to fetch characters');
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

  selectCharacter: (character) => {
    set({ 
      character, 
      inventory: (character as any).inventory,
      isLoading: false 
    });
    // Initialize game data if needed
    get().initializeData();
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
    set({ worldTime: get().worldTime + hours });
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
    stats.energy.current = stats.energy.max;
    stats.protection.current = stats.protection.max;
    set({ character: { ...character, stats } });
  },

  // --- Existing Game Actions (Adapted) ---
  initializeData: () => {
    const templates = StaticDataService.getAllItemTemplates();
    const itemMap = new Map<string, ItemTemplate>();
    templates.forEach(t => itemMap.set(t.id, t));
    
    set({ 
      itemTemplates: itemMap,
      ranks: StaticDataService.getAllRanks(),
      recipes: StaticDataService.getAllRecipes()
    });
  },

  loadGame: async () => {
    // This is now handled by checkAuth and selectCharacter
    await get().checkAuth();
  },

  saveGame: async () => {
    // In the new system, important actions save to DB immediately.
    // For now, we can leave this as a local save or ignore.
    const { character, inventory, worldTime, activeQuests } = get();
    if (character) {
      await StorageService.saveCharacter(character);
    }
    if (inventory) {
      await StorageService.saveInventory(inventory);
    }
    await StorageService.saveMeta('worldTime', worldTime);
    await StorageService.saveMeta('activeQuests', activeQuests);
  },

  trainCharacter: () => {
    const { character, worldTime } = get();
    if (!character) return;
    const TRAIN_COOLDOWN = 12;
    if (character.lastTrainTime !== undefined && (worldTime - character.lastTrainTime) < TRAIN_COOLDOWN) return;

    const updatedCharacter = { 
      ...character,
      stats: { ...character.stats, essence: { ...character.stats.essence }, energy: { ...character.stats.energy }, protection: { ...character.stats.protection } }
    };
    
    const result = CharacterService.trainEssence(updatedCharacter);
    if (result) {
      updatedCharacter.lastTrainTime = worldTime;
      set({ character: updatedCharacter, worldTime: worldTime + 2 });
      get().saveGame();
    }
  },

  rest: () => {
    const { character, worldTime } = get();
    if (!character) return;
    if (!character.location.buildingId) return;
    const building = StaticDataService.getBuilding(character.location.buildingId);
    if (!building || !building.canRest) return;
    const REST_COST = 10;
    if (character.money < REST_COST) return;

    const updatedCharacter = { 
      ...character,
      money: character.money - REST_COST,
      stats: { ...character.stats, energy: { ...character.stats.energy }, protection: { ...character.stats.protection } }
    };
    updatedCharacter.stats.energy.current = updatedCharacter.stats.energy.max;
    updatedCharacter.stats.protection.current = updatedCharacter.stats.protection.max;
    const nextWorldTime = worldTime + 8;
    set({ character: updatedCharacter, worldTime: nextWorldTime });
    get().saveGame();
  },

  equipItem: (itemId) => {
    const { character, inventory, ranks, itemTemplates } = get();
    if (!character || !inventory) return;
    const item = inventory.items.find(i => i.id === itemId);
    const template = item ? itemTemplates.get(item.templateId) : null;
    const rank = ranks.find(r => r.id === character.rankId);
    if (!item || !template || !rank) return;
    const check = InventoryService.canEquip(character, rank, item, template, inventory);
    if (check.allowed) {
      const updatedItems = inventory.items.map(i => i.id === itemId ? { ...i, isEquipped: true } : i);
      set({ inventory: { ...inventory, items: updatedItems } });
      get().saveGame();
    }
  },

  unequipItem: (itemId) => {
    const { inventory } = get();
    if (!inventory) return;
    const updatedItems = inventory.items.map(i => i.id === itemId ? { ...i, isEquipped: false } : i);
    set({ inventory: { ...inventory, items: updatedItems } });
    get().saveGame();
  },

  craftItem: (recipeId) => {
    const { character, inventory, recipes, itemTemplates } = get();
    if (!character || !inventory) return;
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    const building = character.location.buildingId ? StaticDataService.getBuilding(character.location.buildingId) : null;
    const workstations = building?.workstations || [];
    const result = CraftingService.craft(character, inventory, recipe, itemTemplates, workstations);
    if (result.success && result.character && result.inventory) {
      set({ character: result.character, inventory: result.inventory });
      get().saveGame();
    }
  },

  repairItem: (itemId) => {
    const { character, inventory, itemTemplates } = get();
    if (!character || !inventory) return;
    const result = CraftingService.repair(character, inventory, itemId, itemTemplates);
    if (result.success && result.inventory) {
      set({ inventory: result.inventory });
      get().saveGame();
    }
  },

  moveToLocation: (locationId) => {
    const { character, activeQuests, worldTime } = get();
    if (!character) return;
    const moveResult = WorldService.canMoveTo(character, locationId);
    if (moveResult.allowed) {
      const updatedCharacter = WorldService.moveCharacter(character, locationId, moveResult.energyCost || 0);
      const nextWorldTime = worldTime + (moveResult.timeCost || 0);
      const { updatedQuests } = QuestService.updateProgress(activeQuests, 'VISIT', locationId);
      const event = EventService.rollForTravelEvent();
      set({ character: updatedCharacter, activeQuests: updatedQuests, activeEvent: event, worldTime: nextWorldTime });
      get().saveGame();
    }
  },

  enterBuilding: (buildingId) => {
    const { character } = get();
    if (!character) return;
    const result = WorldService.enterBuilding(character, buildingId);
    if (result.allowed && result.character) {
      set({ character: result.character });
      get().saveGame();
    }
  },

  exitBuilding: () => {
    const { character } = get();
    if (!character) return;
    const updatedCharacter = WorldService.exitBuilding(character);
    set({ character: updatedCharacter });
    get().saveGame();
  },

  buyItem: (templateId, quantity = 1) => {
    const { character, inventory, activeQuests } = get();
    if (!character || !inventory) return;
    const result = TradeService.buyItem(character, inventory, templateId, quantity);
    if (result.success && result.character && result.inventory) {
      const { updatedQuests } = QuestService.updateProgress(activeQuests, 'COLLECT', templateId, quantity);
      set({ character: result.character, inventory: result.inventory, activeQuests: updatedQuests });
      get().saveGame();
    }
  },

  sellItem: (itemId, quantity = 1) => {
    const { character, inventory } = get();
    if (!character || !inventory) return;
    const result = TradeService.sellItem(character, inventory, itemId, quantity);
    if (result.success && result.character && result.inventory) {
      set({ character: result.character, inventory: result.inventory });
      get().saveGame();
    }
  },

  acceptQuest: (questId) => {
    const { activeQuests } = get();
    const quest = activeQuests.find(q => q.id === questId);
    if (!quest || quest.status !== QuestStatus.NOT_STARTED) return;
    const updatedQuests = activeQuests.map(q => q.id === questId ? { ...q, status: QuestStatus.IN_PROGRESS } : q);
    set({ activeQuests: updatedQuests });
    get().saveGame();
  },

  completeQuest: (questId) => {
    const { character, inventory, activeQuests } = get();
    if (!character || !inventory) return;
    const quest = activeQuests.find(q => q.id === questId);
    if (quest && quest.status === QuestStatus.COMPLETED) {
      const { character: updatedCharacter, inventory: updatedInventory } = QuestService.claimRewards(character, inventory, quest);
      const updatedQuests = activeQuests.filter(q => q.id !== questId);
      set({ character: updatedCharacter, inventory: updatedInventory, activeQuests: updatedQuests });
      get().saveGame();
    }
  },

  setActiveEvent: (event) => set({ activeEvent: event }),

  handleEventChoice: (choiceId) => {
    const { character, activeEvent } = get();
    if (!character || !activeEvent) return;
    const characterToProcess = { ...character, stats: { ...character.stats, essence: { ...character.stats.essence }, energy: { ...character.stats.energy }, protection: { ...character.stats.protection } } };
    const { character: updatedCharacter, message } = EventService.processChoice(characterToProcess, choiceId);
    set({ character: updatedCharacter, activeEvent: null });
    get().saveGame();
  }
}));