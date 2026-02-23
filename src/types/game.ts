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

export enum ParticipantStatus {
  ALIVE = 'ALIVE',
  DOWNED = 'DOWNED',
  DEAD = 'DEAD',
}

export enum EffectType {
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  PERIODIC_DAMAGE = 'PERIODIC_DAMAGE',
  PERIODIC_HEAL = 'PERIODIC_HEAL',
  STUN = 'STUN',
  CONTROL = 'CONTROL',
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  ARTIFACT = 'ARTIFACT',
  CONSUMABLE = 'CONSUMABLE',
  MATERIAL = 'MATERIAL', // Plants, Ore, Fabrics, Ingredients
  BAG = 'BAG',
  SHIELD = 'SHIELD',
}

export enum ItemCategory {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  ARTIFACT = 'ARTIFACT',
  CONSUMABLE = 'CONSUMABLE',
  MATERIAL = 'MATERIAL',
  BAG = 'BAG',
  SHIELD = 'SHIELD',
}

export enum WeaponCategory {
  ONE_HANDED = 'ONE_HANDED',
  TWO_HANDED = 'TWO_HANDED',
  MAGIC_STABILIZER = 'MAGIC_STABILIZER',
}

export enum ArmorCategory {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
  SUPER_HEAVY = 'SUPER_HEAVY',
}

export enum ShieldCategory {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
  SUPER_HEAVY = 'SUPER_HEAVY',
}

export enum ConsumableCategory {
  FOOD = 'FOOD',
  POTION = 'POTION',
  SCROLL = 'SCROLL',
  REPAIR = 'REPAIR',
  TREATMENT = 'TREATMENT', // Binds, kits
}

export enum PenetrationType {
  NONE = 'NONE',
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
  VERY_HEAVY = 'VERY_HEAVY',
}

export enum DistanceType {
  CLOSE = 'CLOSE', // 0-5m
  MEDIUM = 'MEDIUM', // 5-20m
  FAR = 'FAR', // 20-50m
  SNIPER = 'SNIPER', // 50-200m
}

export enum SpeedCategory {
  VERY_SLOW = 'VERY_SLOW',
  SLOW = 'SLOW',
  ORDINARY = 'ORDINARY',
  FAST = 'FAST',
  VERY_FAST = 'VERY_FAST',
}

export enum ProfessionType {
  BLACKSMITH = 'BLACKSMITH',
  TAILOR = 'TAILOR',
  POTION_MAKER = 'POTION_MAKER',
  ALCHEMIST = 'ALCHEMIST',
  SCRIBE = 'SCRIBE',
  COOK = 'COOK',
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

export interface CharacterProfession {
  type: ProfessionType;
  exp: number;
  rank: number;
}

export interface CharacterStats {
  essence: { current: number; max: number };
  energy: { current: number; max: number }; // * Added for time/activity system
  protection: { current: number; max: number };
  speedId: UUID;
}

export interface CharacterBonuses {
  evasion: number;
  accuracy: number;
  damageResistance: number;
  initiative: number;
}

export interface ActiveEffect {
  id: UUID;
  templateId: UUID;
  name: string;
  type: EffectType;
  level: 'WEAK' | 'ORDINARY' | 'STRONG';
  value: number;
  remainingTurns: number;
  parameter?: string; // e.g., 'accuracy', 'evasion', 'damageResistance'
  isNegative: boolean;
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
  money: number;
  activeQuests: Quest[];
  bonuses: CharacterBonuses;
  professions: CharacterProfession[];
  lastTrainTime?: number; // * Added to track training cooldown (in server time hours)
  lastRestTime?: number;  // * Added to track rest cooldown (in server time hours)
  activeSkills?: CharacterSkill[];
}

export interface Location {
  id: UUID;
  name: string;
  description: string;
  zoneType: ZoneType;
  buildings?: UUID[];
}

export interface Building {
  id: UUID;
  locationId: UUID;
  name: string;
  description: string;
  hasShop: boolean;
  canRest?: boolean; // * Added for rest restrictions
  shopInventory?: UUID; // Optional shop reference
  workstations?: string[];
}

export interface LocationConnection {
  id: UUID;
  fromLocationId: UUID;
  toLocationId: UUID; // Simplified to single target
}

export interface Rank {
  id: UUID;
  order: number;
  name: string;
  maxEssence: number;
  minEssenceRoll?: number; // * Champion rank feature
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

export const MAX_EQUIPPED_BAGS = 4;

export interface Inventory {
  id: UUID;
  characterId: UUID;
  baseSlots: number;
  items: ExistingItem[];
}

export interface ItemTemplate {
  id: UUID;
  name: string;
  type: ItemType;
  category?: WeaponCategory | ArmorCategory | ShieldCategory | ConsumableCategory;
  rarity: Rarity;
  stackSize: number;
  isUnique: boolean;
  
  // Weapon specific
  baseEssence?: number;
  maxEssence?: number;
  penetration?: PenetrationType;
  distance?: DistanceType;
  
  // Armor/Shield specific
  baseDurability?: number;
  ignoreDamage?: number;
  hitPenalty?: number;
  evasionPenalty?: number;
  speedPenalty?: number;

  // General bonuses
  accuracyBonus?: number;
  evasionBonus?: number;
  initiativeBonus?: number;
  resistanceBonus?: number;
  
  // Bag specific
  slotCount?: number;

  // Consumable/Artifact specific
  effects?: UUID[];
  
  description?: string;
  basePrice?: number;
}

/**
 * * Quests and Events
 */

export enum QuestStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface QuestObjective {
  id: UUID;
  description: string;
  type: 'KILL' | 'COLLECT' | 'VISIT' | 'INTERACT';
  targetId: UUID; // MonsterTemplate ID, ItemTemplate ID, or Location ID
  requiredAmount: number;
  currentAmount: number;
  isCompleted: boolean;
}

export interface Quest {
  id: UUID;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: {
    money?: number;
    essence?: number;
    items?: { templateId: UUID; quantity: number }[];
  };
  status: QuestStatus;
  rankRequired: number;
}

export interface GameEventChoice {
  id: UUID;
  text: string;
  outcome: (state: any) => void; // This is a bit tricky for serialization, maybe use eventId for next step
  nextEventId?: UUID;
  requirement?: {
    type: 'ESSENCE' | 'MONEY' | 'ITEM';
    value: number | UUID;
  };
}

export interface GameEvent {
  id: UUID;
  title: string;
  description: string;
  rarity: Rarity; // * Added for breakthrough requirements
  image?: string;
  choices?: GameEventChoice[];
  autoTriggerNextId?: UUID;
  triggerCondition?: string; // Simple logic string or type
}

export interface MonsterTemplate {
  id: UUID;
  name: string;
  rankOrder: number; // 1 to 6 (Champion ranks)
  baseEssence: number;
  description?: string;
  skills: UUID[];
  lootTable: {
    templateId: UUID;
    chance: number;
    minQuantity: number;
    maxQuantity: number;
  }[];
}

export interface ExistingItem {
  id: UUID;
  templateId: UUID;
  quantity: number;
  currentEssence: number;
  currentDurability: number;
  isEquipped: boolean;
  buffs: UUID[];
  spellSlots?: { used: number; max: number }; // For magic stabilizers
}

export interface Skill {
  id: UUID;
  name: string;
  description: string;
  rarity: Rarity;
  castTime: number;
  cooldown: number;
  targetType: 'SELF' | 'TARGET' | 'AREA';
  distance?: { minRange: number; maxRange: number } | string;
  penetration?: PenetrationType;
  alwaysPenetrates?: boolean;
  effects?: UUID[];
  isCombat: boolean;
  isStarter: boolean;
}

export interface CharacterSkill {
  id: UUID;
  characterId: UUID;
  skillTemplateId: UUID;
  currentCooldown: number;
  castTimeRemaining?: number | null;
  isItemSkill: boolean;
  baseEssence: number;
}

export interface Battle {
  id: UUID;
  locationId: UUID;
  status: BattleStatus;
  participants: BattleParticipant[];
  turnOrder?: BattleParticipant[]; // * Combat order by initiative (used by CombatEngine)
  currentTurnIndex: number;
  log: string[];
}

export interface BattleParticipant {
  id: UUID;
  characterId?: UUID;
  monsterTemplateId?: UUID;
  name: string;
  initiative: number;
  currentHp: number;
  currentProtection: number;
  maxHp: number;
  maxProtection: number;
  mainActions: number;
  bonusActions: number;
  currentActions?: { main: number; bonus: number };
  isPlayer: boolean;
  distance: number;
  activeEffects?: ActiveEffect[];
  isBlocking?: boolean;
  status?: ParticipantStatus;
  downedRoundsRemaining?: number;
}

/** Alias for CombatEngine compatibility */
export type Participant = BattleParticipant;

export interface Effect {
  id: UUID;
  name: string;
  type: EffectType;
  duration: number; // in turns, -1 for permanent/passive
  triggerCondition?: string;
  value: number;
  parameter: string; // e.g., 'essence', 'speed', 'evasion', etc.
  description?: string;
}

export interface Recipe {
  id: UUID;
  resultTemplateId: UUID;
  profession: ProfessionType;
  rankRequired: number;
  ingredients: {
    templateId: UUID;
    quantity: number;
  }[];
  stationRequired?: string;
}
