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
  UUID
} from '../types/game';
import { CharacterService } from '../services/CharacterService';
import { InventoryService } from '../services/InventoryService';
import { StorageService } from '../services/StorageService';
import { StaticDataService } from '../services/StaticDataService';
import { WorldService } from '../services/WorldService';
import { TradeService } from '../services/TradeService';
import { QuestService } from '../services/QuestService';
import { EventService } from '../services/EventService';

interface GameState {
  character: Character | null;
  inventory: Inventory | null;
  itemTemplates: Map<string, ItemTemplate>;
  ranks: Rank[];
  activeQuests: Quest[];
  activeEvent: GameEvent | null;
  isLoading: boolean;
  
  // Actions
  setCharacter: (character: Character) => void;
  setInventory: (inventory: Inventory) => void;
  initializeData: () => void;
  
  // Persistence
  loadGame: () => Promise<void>;
  saveGame: () => Promise<void>;
  exportSave: () => Promise<string>;
  importSave: (jsonData: string) => Promise<boolean>;
  
  // Game Logic Actions
  trainCharacter: () => void;
  equipItem: (itemId: UUID) => void;
  unequipItem: (itemId: UUID) => void;

  // World Actions
  moveToLocation: (locationId: UUID) => void;
  enterBuilding: (buildingId: UUID) => void;
  exitBuilding: () => void;

  // Trade Actions
  buyItem: (templateId: UUID, quantity?: number) => void;
  sellItem: (itemId: UUID, quantity?: number) => void;

  // Quest Actions
  acceptQuest: (questId: UUID) => void;
  completeQuest: (questId: UUID) => void;
  
  // Event Actions
  setActiveEvent: (event: GameEvent | null) => void;
  handleEventChoice: (choiceId: UUID) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  character: null,
  inventory: null,
  itemTemplates: new Map(),
  ranks: [],
  activeQuests: [],
  activeEvent: null,
  isLoading: true,

  initializeData: () => {
    const templates = StaticDataService.getAllItemTemplates();
    const itemMap = new Map<string, ItemTemplate>();
    templates.forEach(t => itemMap.set(t.id, t));
    
    set({ 
      itemTemplates: itemMap,
      ranks: StaticDataService.getAllRanks()
    });
  },

  setCharacter: (character) => {
    set({ character });
    StorageService.saveCharacter(character);
    StorageService.saveMeta('activeCharacterId', character.id);
  },
  
  setInventory: (inventory) => {
    set({ inventory });
    StorageService.saveInventory(inventory);
  },

  loadGame: async () => {
    set({ isLoading: true });
    try {
      get().initializeData();

      const charId = await StorageService.getMeta('activeCharacterId');
      if (charId) {
        const character = await StorageService.getCharacter(charId);
        if (character) {
          const inventory = await StorageService.getInventory(character.id);
          // In real app, load quests from DB too
          set({ character, inventory, activeQuests: StaticDataService.getAllQuests() });
        }
      }
    } catch (error) {
      console.error('Error loading game:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveGame: async () => {
    const { character, inventory } = get();
    if (character) {
      await StorageService.saveCharacter(character);
      await StorageService.saveMeta('activeCharacterId', character.id);
    }
    if (inventory) {
      await StorageService.saveInventory(inventory);
    }
  },

  exportSave: async () => {
    return await StorageService.exportSave();
  },

  importSave: async (jsonData: string) => {
    const success = await StorageService.importSave(jsonData);
    if (success) {
      await get().loadGame();
    }
    return success;
  },

  trainCharacter: () => {
    const { character } = get();
    if (!character) return;

    const updatedCharacter = { ...character };
    const gain = CharacterService.trainEssence(updatedCharacter);
    
    set({ character: updatedCharacter });
    StorageService.saveCharacter(updatedCharacter);
  },

  equipItem: (itemId: UUID) => {
    const { character, inventory, ranks, itemTemplates } = get();
    if (!character || !inventory) return;

    const item = inventory.items.find(i => i.id === itemId);
    const template = item ? itemTemplates.get(item.templateId) : null;
    const rank = ranks.find(r => r.id === character.rankId);

    if (!item || !template || !rank) return;

    const check = InventoryService.canEquip(character, rank, item, template, inventory);
    
    if (check.allowed) {
      const updatedItems = inventory.items.map(i => {
        if (i.id === itemId) return { ...i, isEquipped: true };
        return i;
      });

      set({ 
        inventory: { ...inventory, items: updatedItems } 
      });
      StorageService.saveInventory({ ...inventory, items: updatedItems });
      
      CharacterService.refreshBonuses(character, {
        evasion: template.evasionPenalty ? -template.evasionPenalty : 0,
        accuracy: template.hitPenalty ? -template.hitPenalty : 0,
        damageResistance: template.ignoreDamage || 0,
        initiative: 0 
      });
    }
  },

  unequipItem: (itemId: UUID) => {
    const { inventory } = get();
    if (!inventory) return;

    const updatedItems = inventory.items.map(i => {
      if (i.id === itemId) return { ...i, isEquipped: false };
      return i;
    });

    set({ 
      inventory: { ...inventory, items: updatedItems } 
    });
    StorageService.saveInventory({ ...inventory, items: updatedItems });
  },

  moveToLocation: (locationId: UUID) => {
    const { character, activeQuests } = get();
    if (!character) return;

    const moveResult = WorldService.canMoveTo(character, locationId);
    if (moveResult.allowed) {
      const updatedCharacter = WorldService.moveCharacter(character, locationId);
      
      // Update Visit objectives
      const { updatedQuests } = QuestService.updateProgress(activeQuests, 'VISIT', locationId);
      
      // Check for random event
      const event = EventService.rollForTravelEvent();
      
      set({ 
        character: updatedCharacter, 
        activeQuests: updatedQuests,
        activeEvent: event 
      });
      StorageService.saveCharacter(updatedCharacter);
    }
  },

  enterBuilding: (buildingId: UUID) => {
    const { character } = get();
    if (!character) return;

    const result = WorldService.enterBuilding(character, buildingId);
    if (result.allowed && result.character) {
      set({ character: result.character });
      StorageService.saveCharacter(result.character);
    }
  },

  exitBuilding: () => {
    const { character } = get();
    if (!character) return;

    const updatedCharacter = WorldService.exitBuilding(character);
    set({ character: updatedCharacter });
    StorageService.saveCharacter(updatedCharacter);
  },

  buyItem: (templateId: UUID, quantity: number = 1) => {
    const { character, inventory, activeQuests } = get();
    if (!character || !inventory) return;

    const result = TradeService.buyItem(character, inventory, templateId, quantity);
    if (result.success && result.character && result.inventory) {
      // Update Collect objectives
      const { updatedQuests } = QuestService.updateProgress(activeQuests, 'COLLECT', templateId, quantity);
      
      set({ 
        character: result.character, 
        inventory: result.inventory,
        activeQuests: updatedQuests 
      });
      StorageService.saveCharacter(result.character);
      StorageService.saveInventory(result.inventory);
    }
  },

  sellItem: (itemId: UUID, quantity: number = 1) => {
    const { character, inventory } = get();
    if (!character || !inventory) return;

    const result = TradeService.sellItem(character, inventory, itemId, quantity);
    if (result.success && result.character && result.inventory) {
      set({ character: result.character, inventory: result.inventory });
      StorageService.saveCharacter(result.character);
      StorageService.saveInventory(result.inventory);
    }
  },

  acceptQuest: (questId: UUID) => {
    const { activeQuests } = get();
    const updatedQuests = activeQuests.map(q => 
      q.id === questId ? { ...q, status: QuestStatus.IN_PROGRESS } : q
    );
    set({ activeQuests: updatedQuests });
  },

  completeQuest: (questId: UUID) => {
    const { character, inventory, activeQuests } = get();
    if (!character || !inventory) return;

    const quest = activeQuests.find(q => q.id === questId);
    if (quest && quest.status === QuestStatus.COMPLETED) {
      const { character: updatedCharacter, inventory: updatedInventory } = 
        QuestService.claimRewards(character, inventory, quest);
      
      const updatedQuests = activeQuests.filter(q => q.id !== questId);
      
      set({ 
        character: updatedCharacter, 
        inventory: updatedInventory,
        activeQuests: updatedQuests
      });
      StorageService.saveCharacter(updatedCharacter);
      StorageService.saveInventory(updatedInventory);
    }
  },

  setActiveEvent: (event) => set({ activeEvent: event }),

  handleEventChoice: (choiceId: UUID) => {
    const { character, activeEvent } = get();
    if (!character || !activeEvent) return;

    const { character: updatedCharacter, message } = EventService.processChoice(character, choiceId);
    
    // In real app, show message to user
    console.log(message);

    set({ character: updatedCharacter, activeEvent: null });
    StorageService.saveCharacter(updatedCharacter);
  }
}));
