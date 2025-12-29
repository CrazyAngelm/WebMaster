// 📁 src/services/StaticDataService.ts - Centralized data access
// 🎯 Core function: Provides access to all game templates and static data
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Used by gameStore and engines to look up templates

import { 
  ItemTemplate, 
  MonsterTemplate, 
  Rank, 
  Race, 
  Speed,
  Location,
  Building,
  LocationConnection,
  Quest,
  GameEvent,
  UUID,
  Recipe
} from '../types/game';

interface StaticDataBundle {
  races: Race[];
  ranks: Rank[];
  itemTemplates: ItemTemplate[];
  recipes: Recipe[];
  monsterTemplates: MonsterTemplate[];
  quests: Quest[];
  locations: Location[];
  buildings: Building[];
  connections: LocationConnection[];
  professionThresholds: { rank: number; minExp: number; maxExp: number; name: string }[];
  speeds: Speed[];
  events: GameEvent[];
  configs: Record<string, any>;
}

let data: StaticDataBundle = {
  races: [],
  ranks: [],
  itemTemplates: [],
  recipes: [],
  monsterTemplates: [],
  quests: [],
  locations: [],
  buildings: [],
  connections: [],
  professionThresholds: [],
  speeds: [],
  events: [],
  configs: {}
};

const API_BASE = 'http://localhost:5000/api';

export const StaticDataService = {
  async init(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/static/bundle`);
      if (!res.ok) throw new Error('Failed to fetch static data');
      data = await res.json();
      console.log('Static data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize static data:', error);
      throw error;
    }
  },

  // World Data
  getAllLocations(): Location[] {
    return data.locations;
  },
  getLocation(id: UUID): Location | undefined {
    return data.locations.find(l => l.id === id);
  },
  getAllBuildings(): Building[] {
    return data.buildings;
  },
  getBuilding(id: UUID): Building | undefined {
    return data.buildings.find(b => b.id === id);
  },
  getConnections(fromId: UUID): LocationConnection[] {
    return data.connections.filter(c => c.fromLocationId === fromId);
  },

  // Quests & Events
  getAllQuests(): Quest[] {
    return data.quests;
  },
  getQuest(id: UUID): Quest | undefined {
    return data.quests.find(q => q.id === id);
  },
  getAllEvents(): GameEvent[] {
    return data.events;
  },
  getEvent(id: UUID): GameEvent | undefined {
    return data.events.find(e => e.id === id);
  },

  // Items
  getAllItemTemplates(): ItemTemplate[] {
    return data.itemTemplates;
  },
  getItemTemplate(id: UUID): ItemTemplate | undefined {
    return data.itemTemplates.find(t => t.id === id);
  },

  // Monsters
  getAllMonsterTemplates(): MonsterTemplate[] {
    return data.monsterTemplates;
  },
  getMonsterTemplate(id: UUID): MonsterTemplate | undefined {
    return data.monsterTemplates.find(t => t.id === id);
  },

  // Ranks
  getAllRanks(): Rank[] {
    return data.ranks;
  },
  getRank(id: UUID): Rank | undefined {
    return data.ranks.find(r => r.id === id);
  },
  getRankByOrder(order: number): Rank | undefined {
    return data.ranks.find(r => r.order === order);
  },

  // Races
  getAllRaces(): Race[] {
    return data.races;
  },
  getRace(id: UUID): Race | undefined {
    return data.races.find(r => r.id === id);
  },

  // Speeds
  getAllSpeeds(): Speed[] {
    return data.speeds;
  },
  getSpeed(id: UUID): Speed | undefined {
    return data.speeds.find(s => s.id === id);
  },

  // Recipes
  getAllRecipes(): Recipe[] {
    return data.recipes;
  },

  // Profession Thresholds
  getProfessionThresholds() {
    return data.professionThresholds;
  },

  // Game Config
  getConfig<T>(key: string): T | undefined {
    return data.configs[key] as T;
  }
};
