import { 
  Character, 
  Rank, 
  Race, 
  ItemTemplate, 
  Inventory, 
  ItemType, 
  Rarity,
  ArmorCategory,
  WeaponCategory,
  SpeedCategory,
  ZoneType
} from '../types/game';
import { ITEM_TEMPLATES } from './items';

export const MOCK_RANKS: Rank[] = [
  {
    id: 'rank-1',
    order: 1,
    name: 'Новичок',
    maxEssence: 100,
    maxArtifacts: 1,
    maxSkills: 2,
    breakthroughConditions: ['Завершить обучение']
  },
  {
    id: 'rank-2',
    order: 2,
    name: 'Ученик',
    maxEssence: 500,
    maxArtifacts: 2,
    maxSkills: 4,
    breakthroughConditions: ['Победить 10 волков', '1d100 > 50']
  }
];

export const MOCK_RACES: Race[] = [
  {
    id: 'race-human',
    name: 'Человек',
    description: 'Универсальный и амбициозный.',
    baseSpeedId: 'speed-ordinary',
    innateSkills: [],
    passiveEffects: []
  }
];

export const MOCK_ITEM_TEMPLATES: ItemTemplate[] = ITEM_TEMPLATES;

export const MOCK_CHARACTER: Character = {
  id: 'char-1',
  userId: 'user-1',
  name: 'Kaelen',
  raceId: 'race-human',
  rankId: 'rank-1',
  description: 'Молодой искатель силы.',
  bio: 'Рождённый на окраинах Хорниграда, Каэлен стремится овладеть сущностью.',
  stats: {
    essence: { current: 50, max: 100 },
    energy: { current: 100, max: 100 },
    protection: { current: 20, max: 20 },
    speedId: 'speed-ordinary'
  },
  inventoryId: 'inv-1',
  location: {
    locationId: 'loc-outskirts',
    position: 'Центр'
  },
  isDead: false,
  money: 100,
  bonuses: {
    evasion: 0,
    accuracy: 0,
    damageResistance: 0,
    initiative: 0
  },
  professions: []
  // * lastTrainTime is undefined for new characters (allows first training)
};

export const MOCK_INVENTORY: Inventory = {
  id: 'inv-1',
  characterId: 'char-1',
  maxWeight: 30,
  items: [
    {
      id: 'item-1',
      templateId: 'tmpl-thief-dagger',
      quantity: 1,
      currentEssence: 45,
      currentDurability: 10,
      isEquipped: true,
      buffs: []
    },
    {
      id: 'item-2',
      templateId: 'tmpl-squire-armor',
      quantity: 1,
      currentEssence: 0,
      currentDurability: 3,
      isEquipped: false,
      buffs: []
    },
    {
      id: 'item-3',
      templateId: 'tmpl-monk-ring',
      quantity: 1,
      currentEssence: 0,
      currentDurability: 100,
      isEquipped: false,
      buffs: []
    },
    {
      id: 'item-4',
      templateId: 'tmpl-gross-messer',
      quantity: 1,
      currentEssence: 200,
      currentDurability: 15,
      isEquipped: false,
      buffs: []
    }
  ]
};

