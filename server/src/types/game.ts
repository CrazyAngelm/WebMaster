// 📁 server/src/types/game.ts - Core game entities (Ported from frontend)
// 🎯 Core function: Type definitions for the entire game system on the server
// 💡 Usage: Used by server-side combat engine and controllers

export type UUID = string;

export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  MYTHIC = 'MYTHIC',
  LEGENDARY = 'LEGENDARY',
  DIVINE = 'DIVINE',
}

export enum BattleStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
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

export enum PenetrationType {
  NONE = 'NONE',
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
  VERY_HEAVY = 'VERY_HEAVY',
}

export interface CharacterStats {
  essence: { current: number; max: number };
  energy: { current: number; max: number };
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

export interface ExistingItem {
  id: UUID;
  templateId: UUID;
  quantity: number;
  currentEssence: number;
  currentDurability: number;
  isEquipped: boolean;
  buffs: UUID[];
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
  isPlayer: boolean;
  distance: number;
  bonuses?: string;
  activeEffects?: string; // JSON string of ActiveEffect[]
}

export interface Battle {
  id: UUID;
  locationId: UUID;
  status: BattleStatus;
  turnOrder: BattleParticipant[];
  currentTurnIndex: number;
  log: string[];
}

