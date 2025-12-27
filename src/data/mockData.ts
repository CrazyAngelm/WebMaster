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
    name: 'Novice',
    maxEssence: 100,
    maxArtifacts: 1,
    maxSkills: 2,
    breakthroughConditions: ['Complete tutorial']
  },
  {
    id: 'rank-2',
    order: 2,
    name: 'Disciple',
    maxEssence: 500,
    maxArtifacts: 2,
    maxSkills: 4,
    breakthroughConditions: ['Defeat 10 wolves', '1d100 > 50']
  }
];

export const MOCK_RACES: Race[] = [
  {
    id: 'race-human',
    name: 'Human',
    description: 'Versatile and ambitious.',
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
  description: 'A young seeker of power.',
  bio: 'Born in the outskirts of Hornygrad, Kaelen seeks to master the essence.',
  stats: {
    essence: { current: 50, max: 100 },
    protection: { current: 20, max: 20 },
    speedId: 'speed-ordinary'
  },
  inventoryId: 'inv-1',
  location: {
    locationId: 'loc-outskirts',
    position: 'Center'
  },
  isDead: false,
  money: 100,
  bonuses: {
    evasion: 0,
    accuracy: 0,
    damageResistance: 0,
    initiative: 0
  }
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

