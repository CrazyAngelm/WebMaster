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
  worldTime: number; // * Total hours passed since start
  
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
  rest: () => void;
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
  worldTime: 0,

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
      
      // * Load saved quest states
      const savedQuests = await StorageService.getMeta('activeQuests') as Quest[] | undefined;
      const allQuests = StaticDataService.getAllQuests();
      
      // * Merge saved quest states with quest templates
      let questsToLoad: Quest[];
      if (savedQuests && savedQuests.length > 0) {
        // * Merge: use saved state if quest exists, otherwise use template
        questsToLoad = allQuests.map(templateQuest => {
          const savedQuest = savedQuests.find(q => q.id === templateQuest.id);
          if (savedQuest) {
            // * Preserve saved state but update objectives from template (in case template changed)
            return {
              ...savedQuest,
              objectives: templateQuest.objectives.map(templateObj => {
                const savedObj = savedQuest.objectives.find(o => o.id === templateObj.id);
                return savedObj || templateObj;
              })
            };
          }
          return templateQuest;
        });
      } else {
        questsToLoad = allQuests;
      }
      
      if (charId) {
        const character = await StorageService.getCharacter(charId);
        if (character) {
          const inventory = await StorageService.getInventory(character.id);
          const worldTime = await StorageService.getMeta('worldTime') || 0;
          
          set({ 
            character, 
            inventory, 
            worldTime, 
            activeQuests: questsToLoad 
          });
        }
      } else {
        // * Even without character, we can load quests
        set({ activeQuests: questsToLoad });
      }
    } catch (error) {
      console.error('Error loading game:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveGame: async () => {
    const { character, inventory, worldTime, activeQuests } = get();
    if (character) {
      await StorageService.saveCharacter(character);
      await StorageService.saveMeta('activeCharacterId', character.id);
    }
    if (inventory) {
      await StorageService.saveInventory(inventory);
    }
    await StorageService.saveMeta('worldTime', worldTime);
    await StorageService.saveMeta('activeQuests', activeQuests);
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
    const { character, worldTime } = get();
    if (!character) return;

    // * Check training cooldown (e.g., once every 12 hours)
    const TRAIN_COOLDOWN = 12;
    if (character.lastTrainTime !== undefined && (worldTime - character.lastTrainTime) < TRAIN_COOLDOWN) {
      console.log(`You need more time to recover from previous training. Next available in ${TRAIN_COOLDOWN - (worldTime - character.lastTrainTime)} hours.`);
      return;
    }

    // * Deep copy stats to avoid mutations
    const updatedCharacter = { 
      ...character,
      stats: {
        ...character.stats,
        essence: { ...character.stats.essence },
        energy: { ...character.stats.energy },
        protection: { ...character.stats.protection }
      }
    };
    
    const result = CharacterService.trainEssence(updatedCharacter);
    
    if (result) {
      updatedCharacter.lastTrainTime = worldTime; // Update training time
      set({ 
        character: updatedCharacter,
        worldTime: worldTime + 2 // Training takes 2 hours
      });
      StorageService.saveCharacter(updatedCharacter);
      StorageService.saveMeta('worldTime', worldTime + 2);
    } else {
      console.log("Not enough energy to train!");
    }
  },

  rest: () => {
    const { character, worldTime } = get();
    if (!character) return;

    // * 1. Check Location
    if (!character.location.buildingId) {
      console.log("You can't rest in the open. Find a safe building (e.g., a Tavern).");
      return;
    }

    const building = StaticDataService.getBuilding(character.location.buildingId);
    if (!building || !building.canRest) {
      console.log("This building is not suitable for resting.");
      return;
    }

    // * 2. Check Money
    const REST_COST = 10;
    if (character.money < REST_COST) {
      console.log(`Resting costs ${REST_COST} coins. You are too poor.`);
      return;
    }

    // * 3. Update Character
    const updatedCharacter = { 
      ...character,
      money: character.money - REST_COST,
      stats: {
        ...character.stats,
        energy: { ...character.stats.energy },
        protection: { ...character.stats.protection }
      }
    };
    
    updatedCharacter.stats.energy.current = updatedCharacter.stats.energy.max;
    updatedCharacter.stats.protection.current = updatedCharacter.stats.protection.max;
    
    const nextWorldTime = worldTime + 8; // Resting takes 8 hours
    
    set({ 
      character: updatedCharacter,
      worldTime: nextWorldTime 
    });
    StorageService.saveCharacter(updatedCharacter);
    StorageService.saveMeta('worldTime', nextWorldTime);
    console.log(`You spent ${REST_COST} coins and rested for 8 hours. Energy restored.`);
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
    const { character, activeQuests, worldTime } = get();
    if (!character) {
      console.warn('Cannot move: no character');
      return;
    }

    // * Use original character for check (no need for deep copy here, canMoveTo doesn't mutate)
    const moveResult = WorldService.canMoveTo(character, locationId);
    if (moveResult.allowed) {
      // * moveCharacter creates a new object, so we can use the original character
      const updatedCharacter = WorldService.moveCharacter(
        character, 
        locationId, 
        moveResult.energyCost || 0
      );
      
      const nextWorldTime = worldTime + (moveResult.timeCost || 0);

      // Update Visit objectives
      const { updatedQuests } = QuestService.updateProgress(activeQuests, 'VISIT', locationId);
      
      // Check for random event
      const event = EventService.rollForTravelEvent();
      
      set({ 
        character: updatedCharacter, 
        activeQuests: updatedQuests,
        activeEvent: event,
        worldTime: nextWorldTime
      });
      StorageService.saveCharacter(updatedCharacter);
      StorageService.saveMeta('worldTime', nextWorldTime);
      StorageService.saveMeta('activeQuests', updatedQuests);
      
      console.log(`Moved to ${locationId}. Energy: ${updatedCharacter.stats.energy.current}/${updatedCharacter.stats.energy.max}`);
    } else {
      console.warn('Cannot move:', moveResult.reason || 'Unknown reason');
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
      StorageService.saveMeta('activeQuests', updatedQuests);
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
    
    // * Check if quest exists and is not already accepted
    const quest = activeQuests.find(q => q.id === questId);
    if (!quest) {
      console.warn(`Quest ${questId} not found in activeQuests`);
      return;
    }
    
    if (quest.status === QuestStatus.IN_PROGRESS || quest.status === QuestStatus.COMPLETED) {
      console.log(`Quest ${questId} is already accepted`);
      return;
    }
    
    const updatedQuests = activeQuests.map(q => 
      q.id === questId ? { ...q, status: QuestStatus.IN_PROGRESS } : q
    );
    
    set({ activeQuests: updatedQuests });
    StorageService.saveMeta('activeQuests', updatedQuests);
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
      StorageService.saveMeta('activeQuests', updatedQuests);
    }
  },

  setActiveEvent: (event) => set({ activeEvent: event }),

  handleEventChoice: (choiceId: UUID) => {
    const { character, activeEvent } = get();
    if (!character || !activeEvent) return;

    // * Deep copy stats
    const characterToProcess = { 
      ...character,
      stats: {
        ...character.stats,
        essence: { ...character.stats.essence },
        energy: { ...character.stats.energy },
        protection: { ...character.stats.protection }
      }
    };

    const { character: updatedCharacter, message } = EventService.processChoice(characterToProcess, choiceId);
    
    // In real app, show message to user
    console.log(message);

    set({ character: updatedCharacter, activeEvent: null });
    StorageService.saveCharacter(updatedCharacter);
  }
}));
