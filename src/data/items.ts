// 📁 src/data/items.ts - Static item templates
// 🎯 Core function: Database of all items in the game
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Loaded by GameStore to populate itemTemplates

import { 
  ItemTemplate, 
  ItemType, 
  Rarity, 
  WeaponCategory, 
  ArmorCategory, 
  PenetrationType, 
  DistanceType,
  ConsumableCategory 
} from '../types/game';

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // --- MATERIALS ---
  {
    id: 'mat-copper-ore',
    name: 'Copper Ore',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 5,
    stackSize: 20,
    isUnique: false,
    description: 'A common ore used for basic smithing.',
    basePrice: 10
  },
  {
    id: 'mat-iron-ore',
    name: 'Iron Ore',
    type: ItemType.MATERIAL,
    rarity: Rarity.RARE,
    weight: 7,
    stackSize: 20,
    isUnique: false,
    description: 'A sturdy ore for quality weapons and armor.',
    basePrice: 50
  },
  {
    id: 'mat-linen-fabric',
    name: 'Linen Fabric',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 30,
    isUnique: false,
    basePrice: 5
  },
  {
    id: 'mat-wolf-heart',
    name: 'Wolf Heart',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 10,
    isUnique: false,
    basePrice: 20
  },
  {
    id: 'mat-tin-ore',
    name: 'Tin Ore',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 5,
    stackSize: 20,
    isUnique: false,
    basePrice: 15
  },
  {
    id: 'mat-adamantite-ore',
    name: 'Adamantite Ore',
    type: ItemType.MATERIAL,
    rarity: Rarity.MYTHIC,
    weight: 15,
    stackSize: 15,
    isUnique: false,
    basePrice: 500
  },
  {
    id: 'mat-silk-fabric',
    name: 'Silk Fabric',
    type: ItemType.MATERIAL,
    rarity: Rarity.EPIC,
    weight: 3,
    stackSize: 30,
    isUnique: false,
    basePrice: 150
  },

  // --- WEAPONS ---
  {
    id: 'wpn-thief-dagger',
    name: 'Thief Dagger',
    type: ItemType.WEAPON,
    category: WeaponCategory.ONE_HANDED,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 1,
    isUnique: false,
    baseEssence: 45,
    maxEssence: 100,
    penetration: PenetrationType.NONE,
    distance: DistanceType.CLOSE,
    basePrice: 100
  },
  {
    id: 'wpn-gross-messer',
    name: 'Gross-Messer',
    type: ItemType.WEAPON,
    category: WeaponCategory.ONE_HANDED,
    rarity: Rarity.EPIC,
    weight: 4,
    stackSize: 1,
    isUnique: false,
    baseEssence: 200,
    maxEssence: 300,
    penetration: PenetrationType.MEDIUM,
    distance: DistanceType.CLOSE,
    description: '+80 Initiative',
    basePrice: 850
  },
  {
    id: 'wpn-poleaxe',
    name: 'Poleaxe',
    type: ItemType.WEAPON,
    category: WeaponCategory.TWO_HANDED,
    rarity: Rarity.MYTHIC,
    weight: 8,
    stackSize: 1,
    isUnique: false,
    baseEssence: 550,
    maxEssence: 800,
    penetration: PenetrationType.HEAVY,
    distance: DistanceType.CLOSE,
    description: '+70 Accuracy, +30 Initiative, +100 Protection',
    basePrice: 2500
  },
  {
    id: 'wpn-impaler-bow',
    name: 'Impaler Short Bow',
    type: ItemType.WEAPON,
    category: WeaponCategory.TWO_HANDED,
    rarity: Rarity.COMMON,
    weight: 3,
    stackSize: 1,
    isUnique: false,
    baseEssence: 90,
    maxEssence: 150,
    penetration: PenetrationType.NONE,
    distance: DistanceType.MEDIUM,
    basePrice: 120
  },

  // --- ARMOR ---
  {
    id: 'arm-light-leather',
    name: 'Light Leather Armor',
    type: ItemType.ARMOR,
    category: ArmorCategory.LIGHT,
    rarity: Rarity.COMMON,
    weight: 3,
    stackSize: 1,
    isUnique: false,
    ignoreDamage: 0,
    baseDurability: 2,
    basePrice: 50
  },
  {
    id: 'arm-medium-chain',
    name: 'Medium Chainmail',
    type: ItemType.ARMOR,
    category: ArmorCategory.MEDIUM,
    rarity: Rarity.RARE,
    weight: 6,
    stackSize: 1,
    isUnique: false,
    ignoreDamage: 50,
    hitPenalty: 50,
    evasionPenalty: 100,
    baseDurability: 3,
    basePrice: 200
  },
  {
    id: 'arm-heavy-plate',
    name: 'Heavy Plate Armor',
    type: ItemType.ARMOR,
    category: ArmorCategory.HEAVY,
    rarity: Rarity.EPIC,
    weight: 12,
    stackSize: 1,
    isUnique: false,
    ignoreDamage: 200,
    hitPenalty: 150,
    evasionPenalty: 250,
    speedPenalty: 3,
    baseDurability: 4,
    basePrice: 800
  },
  {
    id: 'arm-super-heavy-bastion',
    name: 'Super Heavy Bastion',
    type: ItemType.ARMOR,
    category: ArmorCategory.SUPER_HEAVY,
    rarity: Rarity.LEGENDARY,
    weight: 20,
    stackSize: 1,
    isUnique: false,
    ignoreDamage: 350,
    hitPenalty: 300,
    evasionPenalty: 400,
    speedPenalty: 6,
    baseDurability: 6,
    basePrice: 5000
  },

  // --- CONSUMABLES ---
  {
    id: 'con-simple-stew',
    name: 'Simple Stew',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.FOOD,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 4,
    isUnique: false,
    description: 'Restores 30 HP.',
    basePrice: 15
  },
  {
    id: 'con-healing-potion-small',
    name: 'Small Healing Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.COMMON,
    weight: 3,
    stackSize: 6,
    isUnique: false,
    baseEssence: 100,
    description: 'Restores health.',
    basePrice: 50
  },

  // --- BREAKTHROUGH POTIONS ---
  {
    id: 'con-essence-potion',
    name: 'Essence Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.RARE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Required for Rank 2 breakthrough.',
    basePrice: 500
  },
  {
    id: 'con-spirit-potion',
    name: 'Concentrated Spirit Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.EPIC,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Required for Rank 3 breakthrough.',
    basePrice: 1500
  },
  {
    id: 'con-phoenix-potion',
    name: 'Phoenix Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.MYTHIC,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Required for Rank 4 breakthrough.',
    basePrice: 5000
  },
  {
    id: 'con-demonic-potion',
    name: 'Demonic Essence Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.LEGENDARY,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Required for Rank 5 breakthrough.',
    basePrice: 15000
  },
  {
    id: 'con-element-potion',
    name: 'Enclosed Element Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.DIVINE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Required for Champion Rank 1 breakthrough.',
    basePrice: 50000
  },
  {
    id: 'con-chaos-potion',
    name: 'Chaos Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.DIVINE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Required for Champion Rank 2 breakthrough.',
    basePrice: 100000
  },
  {
    id: 'con-death-potion',
    name: 'Reverse Death Potion',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.DIVINE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Required for Champion Rank 3 breakthrough.',
    basePrice: 250000
  },

  // --- BAGS ---
  {
    id: 'bag-linen-worn',
    name: 'Worn Linen Bag',
    type: ItemType.BAG,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 1,
    isUnique: false,
    slotCount: 6,
    basePrice: 80
  }
];

export const RECIPES = [
  {
    id: 'rec-simple-stew',
    resultTemplateId: 'con-simple-stew',
    profession: 'Cook',
    rankRequired: 1,
    ingredients: [
      { templateId: 'mat-meat', quantity: 1 },
      { templateId: 'mat-water', quantity: 1 }
    ]
  }
];
