// 📁 src/services/StaticDataService.ts - Centralized data access
// 🎯 Core function: Provides access to all game templates and static data
// 🔗 Key dependencies: src/data/*, src/types/game.ts
// 💡 Usage: Used by gameStore and engines to look up templates

import { ITEM_TEMPLATES, RECIPES } from '../data/items';
import { MONSTER_TEMPLATES } from '../data/monsters';
import { RANKS } from '../data/ranks';
import { RACES } from '../data/races';
import { SPEEDS } from '../data/speeds';
import { LOCATIONS, BUILDINGS, CONNECTIONS } from '../data/locations';
import { QUESTS } from '../data/quests';
import { EVENTS } from '../data/events';
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
  UUID 
} from '../types/game';

export const StaticDataService = {
  // World Data
  getAllLocations(): Location[] {
    return LOCATIONS;
  },
  getLocation(id: UUID): Location | undefined {
    return LOCATIONS.find(l => l.id === id);
  },
  getAllBuildings(): Building[] {
    return BUILDINGS;
  },
  getBuilding(id: UUID): Building | undefined {
    return BUILDINGS.find(b => b.id === id);
  },
  getConnections(fromId: UUID): LocationConnection[] {
    return CONNECTIONS.filter(c => c.fromLocationId === fromId);
  },

  // Quests & Events
  getAllQuests(): Quest[] {
    return QUESTS;
  },
  getQuest(id: UUID): Quest | undefined {
    return QUESTS.find(q => q.id === id);
  },
  getAllEvents(): GameEvent[] {
    return EVENTS;
  },
  getEvent(id: UUID): GameEvent | undefined {
    return EVENTS.find(e => e.id === id);
  },

  // Items
  getAllItemTemplates(): ItemTemplate[] {
    return ITEM_TEMPLATES;
  },
  getItemTemplate(id: UUID): ItemTemplate | undefined {
    return ITEM_TEMPLATES.find(t => t.id === id);
  },

  // Monsters
  getAllMonsterTemplates(): MonsterTemplate[] {
    return MONSTER_TEMPLATES;
  },
  getMonsterTemplate(id: UUID): MonsterTemplate | undefined {
    return MONSTER_TEMPLATES.find(t => t.id === id);
  },

  // Ranks
  getAllRanks(): Rank[] {
    return RANKS;
  },
  getRank(id: UUID): Rank | undefined {
    return RANKS.find(r => r.id === id);
  },
  getRankByOrder(order: number): Rank | undefined {
    return RANKS.find(r => r.order === order);
  },

  // Races
  getAllRaces(): Race[] {
    return RACES;
  },
  getRace(id: UUID): Race | undefined {
    return RACES.find(r => r.id === id);
  },

  // Speeds
  getAllSpeeds(): Speed[] {
    return SPEEDS;
  },
  getSpeed(id: UUID): Speed | undefined {
    return SPEEDS.find(s => s.id === id);
  },

  // Recipes
  getAllRecipes() {
    return RECIPES;
  }
};

