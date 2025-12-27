// 📁 src/types/game.ts - Core game entities
// 🎯 Core function: Type definitions for the entire game system
// 🔗 Key dependencies: None
// 💡 Usage: Imported by services, components, and game engine

export type UUID = string;

/**
 * * Common Enums
 */

export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  MYTHIC = 'MYTHIC',
  LEGENDARY = 'LEGENDARY',
  DIVINE = 'DIVINE',
}

export enum ZoneType {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum BattleStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export enum EffectType {
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  ARTIFACT = 'ARTIFACT',
  CONSUMABLE = 'CONSUMABLE',
  INGREDIENT = 'INGREDIENT',
  BAG = 'BAG',
  SHIELD = 'SHIELD',
}

export enum WeaponCategory {
  ONE_HANDED = 'ONE_HANDED',
  TWO_HANDED = 'TWO_HANDED',
  MAGIC_STABILIZER = 'MAGIC_STABILIZER',
  SHIELD = 'SHIELD',
}

export enum ArmorCategory {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
  SUPER_HEAVY = 'SUPER_HEAVY',
}

export enum SpeedCategory {
  VERY_SLOW = 'VERY_SLOW',
  SLOW = 'SLOW',
  ORDINARY = 'ORDINARY',
  FAST = 'FAST',
  VERY_FAST = 'VERY_FAST',
}

/**
 * * Entities
 */

export interface User {
  id: UUID;
  name: string;
  avatarUrl?: string;
  settings: Record<string, any>;
}

export interface Speed {
  id: UUID;
  name: string;
  category: SpeedCategory;
  distancePerAction: number;
}

export interface CharacterStats {
  essence: { current: number; max: number };
  protection: { current: number; max: number };
  speedId: UUID;
}

export interface CharacterBonuses {
  evasion: number;
  accuracy: number;
  damageResistance: number;
  initiative: number;
}

export interface Character {
  id: UUID;
  userId: UUID;
  name: string;
  raceId: UUID;
  rankId: UUID;
  description: string;
  bio: string;
  stats: CharacterStats;
  inventoryId: UUID;
  location: {
    locationId: UUID;
    buildingId?: UUID;
    position: string;
  };
  isDead: boolean;
  bonuses: CharacterBonuses;
}

export interface Location {
  id: UUID;
  name: string;
  description: string;
  zoneType: ZoneType;
}

export interface Building {
  id: UUID;
  locationId: UUID;
  name: string;
  description: string;
  hasShop: boolean;
}

export interface LocationConnection {
  id: UUID;
  fromLocationId: UUID;
  toLocationIds: UUID[];
}

export interface Rank {
  id: UUID;
  order: number;
  name: string;
  maxEssence: number;
  maxArtifacts: number;
  maxSkills: number;
  breakthroughConditions: string[];
}

export interface Race {
  id: UUID;
  name: string;
  description: string;
  baseSpeedId: UUID;
  innateSkills: UUID[];
  passiveEffects: UUID[];
}

export interface Inventory {
  id: UUID;
  characterId: UUID;
  maxWeight: number;
  items: ExistingItem[];
}

export interface ItemTemplate {
  id: UUID;
  name: string;
  type: ItemType;
  category?: WeaponCategory | ArmorCategory;
  rarity: Rarity;
  weight: number;
  isUnique: boolean;
  baseEssence?: number; // Starting essence for weapons
  maxEssence?: number; // Max possible essence through mastery
  baseDurability?: number;
  penetration?: number; // For weapons
  armorType?: ArmorCategory; // For armor
  ignoreDamage?: number; // For armor
  hitPenalty?: number; // For armor
  evasionPenalty?: number; // For armor
  speedPenalty?: number; // For armor
}

export interface ExistingItem {
  id: UUID;
  templateId: UUID;
  quantity: number;
  currentEssence: number;
  currentDurability: number;
  isEquipped: boolean;
  buffs: UUID[];
}

export interface Skill {
  id: UUID;
  name: string;
  description: string;
  rarity: Rarity;
  castTime: number;
  cooldown: number;
  range: number;
  effects: UUID[];
}

export interface Battle {
  id: UUID;
  locationId: UUID;
  status: BattleStatus;
  turnOrder: Participant[];
  currentTurnIndex: number;
  log: string[];
}

export interface Participant {
  id: UUID;
  characterId: UUID;
  teamId: UUID;
  initiative: number;
  currentActions: {
    main: number;
    bonus: number;
  };
}

export interface Effect {
  id: UUID;
  name: string;
  type: EffectType;
  duration: number; // in ticks or turns
  triggerCondition?: string;
  value: number;
  parameter: string; // e.g., 'essence', 'speed', etc.
}

