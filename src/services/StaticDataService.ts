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
  Recipe,
  Rarity
} from '../types/game';

// Default test events
function getDefaultEvents(): GameEvent[] {
  return [
    {
      id: 'event-wounded-traveler',
      title: 'Раненый путник',
      description: 'У дороги вы замечаете раненого путника. Он просит о помощи.',
      rarity: Rarity.COMMON,
      choices: [
        {
          id: 'choice-help-traveler',
          text: 'Помочь путнику (исцелить)',
          outcome: () => {},
          successChance: 70
        },
        {
          id: 'choice-rob-traveler',
          text: 'Ограбить беспомощного',
          outcome: () => {},
          successChance: 50
        },
        {
          id: 'choice-leave-traveler',
          text: 'Пройти мимо',
          outcome: () => {}
        }
      ]
    },
    {
      id: 'event-abandoned-chest',
      title: 'Заброшенный сундук',
      description: 'Вы наткнулись на старый сундук, стоящий посреди тропы. Он выглядит заброшенным, но может быть заперт.',
      rarity: Rarity.RARE,
      choices: [
        {
          id: 'choice-open-chest',
          text: 'Открыть сундук',
          outcome: () => {},
          successChance: 60
        },
        {
          id: 'choice-check-trap',
          text: 'Проверить на ловушки первым',
          outcome: () => {},
          successChance: 80
        },
        {
          id: 'choice-leave-chest',
          text: 'Не трогать (может быть ловушка)',
          outcome: () => {}
        }
      ]
    },
    {
      id: 'event-mysterious-merchant',
      title: 'Таинственный торговец',
      description: 'Из тумана появляется странный торговец с необычными товарами. Он предлагает сделку.',
      rarity: Rarity.EPIC,
      choices: [
        {
          id: 'choice-buy-rare',
          text: 'Купить редкий товар (50 золота)',
          outcome: () => {},
          requirement: { type: 'MONEY', value: 50 },
          successChance: 75
        },
        {
          id: 'choice-trade-info',
          text: 'Обменяться информацией',
          outcome: () => {},
          successChance: 90
        },
        {
          id: 'choice-leave-merchant',
          text: 'Отказаться и уйти',
          outcome: () => {}
        }
      ]
    },
    {
      id: 'event-ambush',
      title: 'Засада!',
      description: 'Из кустов выскакивают бандиты! Они требуют ваши деньги и ценности.',
      rarity: Rarity.COMMON,
      choices: [
        {
          id: 'choice-fight',
          text: 'Сразиться!',
          outcome: () => {},
          successChance: 40
        },
        {
          id: 'choice-pay-off',
          text: 'Заплатить выкуп (30 золота)',
          outcome: () => {},
          requirement: { type: 'MONEY', value: 30 },
          successChance: 100
        },
        {
          id: 'choice-run',
          text: 'Попытаться убежать',
          outcome: () => {},
          successChance: 60
        }
      ]
    },
    {
      id: 'event-strange-altar',
      title: 'Странный алтарь',
      description: 'Вы нашли древний алтарь, покрытый рунами. От него исходит странное свечение.',
      rarity: Rarity.MYTHIC,
      choices: [
        {
          id: 'choice-pray',
          text: 'Помолиться у алтаря',
          outcome: () => {},
          successChance: 50
        },
        {
          id: 'choice-touch',
          text: 'Прикоснуться к рунам',
          outcome: () => {},
          successChance: 30
        },
        {
          id: 'choice-leave-altar',
          text: 'Уйти подальше',
          outcome: () => {}
        }
      ]
    }
  ];
}

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
  effectTemplates: any[];
  skillTemplates: any[];
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
  effectTemplates: [],
  skillTemplates: [],
  configs: {}
};

const API_BASE = '/api';

export const StaticDataService = {
  async init(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/static/bundle`);
      if (!res.ok) throw new Error('Failed to fetch static data');
      data = await res.json();
      
      // Add test events if none exist
      if (!data.events || data.events.length === 0) {
        data.events = getDefaultEvents();
      }
      
      console.log('Static data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize static data:', error);
      // Load default events even if API fails
      data.events = getDefaultEvents();
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

  getEffectTemplate(id: UUID): any | undefined {
    return data.effectTemplates.find(e => e.id === id);
  },

  getSkillTemplate(id: UUID): any | undefined {
    return data.skillTemplates.find(s => s.id === id);
  },

  getAllSkillTemplates(): any[] {
    return data.skillTemplates;
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
