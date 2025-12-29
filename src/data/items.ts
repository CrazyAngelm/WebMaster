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
  ConsumableCategory,
  ProfessionType 
} from '../types/game';

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // --- MATERIALS ---
  {
    id: 'mat-copper-ore',
    name: 'Медная руда',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 5,
    stackSize: 20,
    isUnique: false,
    description: 'Обычная руда, используемая для базовой ковки.',
    basePrice: 10
  },
  {
    id: 'mat-iron-ore',
    name: 'Железная руда',
    type: ItemType.MATERIAL,
    rarity: Rarity.RARE,
    weight: 7,
    stackSize: 20,
    isUnique: false,
    description: 'Прочная руда для качественного оружия и доспехов.',
    basePrice: 50
  },
  {
    id: 'mat-linen-fabric',
    name: 'Льняная ткань',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 30,
    isUnique: false,
    basePrice: 5
  },
  {
    id: 'mat-wolf-heart',
    name: 'Сердце волка',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 10,
    isUnique: false,
    basePrice: 20
  },
  {
    id: 'mat-tin-ore',
    name: 'Оловянная руда',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 5,
    stackSize: 20,
    isUnique: false,
    basePrice: 15
  },
  {
    id: 'mat-adamantite-ore',
    name: 'Адамантитовая руда',
    type: ItemType.MATERIAL,
    rarity: Rarity.MYTHIC,
    weight: 15,
    stackSize: 15,
    isUnique: false,
    basePrice: 500
  },
  {
    id: 'mat-silk-fabric',
    name: 'Шёлковая ткань',
    type: ItemType.MATERIAL,
    rarity: Rarity.EPIC,
    weight: 3,
    stackSize: 30,
    isUnique: false,
    basePrice: 150
  },
  {
    id: 'mat-coal',
    name: 'Уголь',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 50,
    isUnique: false,
    description: 'Топливо для кузницы.',
    basePrice: 5
  },
  {
    id: 'mat-leather-scraps',
    name: 'Обрывки кожи',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 1,
    stackSize: 40,
    isUnique: false,
    basePrice: 8
  },
  {
    id: 'mat-herbs-common',
    name: 'Обычные травы',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 1,
    stackSize: 50,
    isUnique: false,
    basePrice: 5
  },
  {
    id: 'mat-meat',
    name: 'Мясо',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 20,
    isUnique: false,
    basePrice: 15
  },
  {
    id: 'mat-water',
    name: 'Вода',
    type: ItemType.MATERIAL,
    rarity: Rarity.COMMON,
    weight: 1,
    stackSize: 50,
    isUnique: false,
    basePrice: 2
  },
  {
    id: 'mat-magic-dust',
    name: 'Магическая пыль',
    type: ItemType.MATERIAL,
    rarity: Rarity.RARE,
    weight: 1,
    stackSize: 100,
    isUnique: false,
    basePrice: 50
  },

  // --- WEAPONS ---
  {
    id: 'wpn-thief-dagger',
    name: 'Кинжал вора',
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
    name: 'Гросс-мессер',
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
    description: '+80 Инициатива',
    basePrice: 850
  },
  {
    id: 'wpn-poleaxe',
    name: 'Полэкс',
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
    description: '+70 Точность, +30 Инициатива, +100 Защита',
    basePrice: 2500
  },
  {
    id: 'wpn-impaler-bow',
    name: 'Короткий лук "Пронзатель"',
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
    name: 'Лёгкая кожаная броня',
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
    name: 'Средняя кольчуга',
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
    name: 'Тяжёлые латы',
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
    name: 'Сверхтяжёлый бастион',
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
    name: 'Простое рагу',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.FOOD,
    rarity: Rarity.COMMON,
    weight: 2,
    stackSize: 4,
    isUnique: false,
    description: 'Восстанавливает 30 ОЗ.',
    basePrice: 15
  },
  {
    id: 'con-healing-potion-small',
    name: 'Малое зелье лечения',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.COMMON,
    weight: 3,
    stackSize: 6,
    isUnique: false,
    baseEssence: 100,
    description: 'Восстанавливает здоровье.',
    basePrice: 50
  },

  // --- BREAKTHROUGH POTIONS ---
  {
    id: 'con-essence-potion',
    name: 'Зелье сущности',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.RARE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Требуется для прорыва ранга 2.',
    basePrice: 500
  },
  {
    id: 'con-spirit-potion',
    name: 'Концентрированное зелье духа',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.EPIC,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Требуется для прорыва ранга 3.',
    basePrice: 1500
  },
  {
    id: 'con-phoenix-potion',
    name: 'Зелье феникса',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.MYTHIC,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Требуется для прорыва ранга 4.',
    basePrice: 5000
  },
  {
    id: 'con-demonic-potion',
    name: 'Зелье демонической сущности',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.LEGENDARY,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Требуется для прорыва ранга 5.',
    basePrice: 15000
  },
  {
    id: 'con-element-potion',
    name: 'Зелье заключённого элемента',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.DIVINE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Требуется для прорыва ранга чемпиона 1.',
    basePrice: 50000
  },
  {
    id: 'con-chaos-potion',
    name: 'Зелье хаоса',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.DIVINE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Требуется для прорыва ранга чемпиона 2.',
    basePrice: 100000
  },
  {
    id: 'con-death-potion',
    name: 'Зелье обратной смерти',
    type: ItemType.CONSUMABLE,
    category: ConsumableCategory.POTION,
    rarity: Rarity.DIVINE,
    weight: 1,
    stackSize: 1,
    isUnique: false,
    description: 'Требуется для прорыва ранга чемпиона 3.',
    basePrice: 250000
  },

  // --- BAGS ---
  {
    id: 'bag-linen-worn',
    name: 'Потрёпанная льняная сумка',
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
    profession: ProfessionType.COOK,
    rankRequired: 1,
    ingredients: [
      { templateId: 'mat-meat', quantity: 1 },
      { templateId: 'mat-water', quantity: 1 }
    ]
  },
  {
    id: 'rec-copper-dagger',
    resultTemplateId: 'wpn-thief-dagger',
    profession: ProfessionType.BLACKSMITH,
    rankRequired: 1,
    ingredients: [
      { templateId: 'mat-copper-ore', quantity: 2 },
      { templateId: 'mat-coal', quantity: 1 }
    ],
    stationRequired: 'Forge'
  },
  {
    id: 'rec-leather-armor-light',
    resultTemplateId: 'arm-light-leather',
    profession: ProfessionType.TAILOR,
    rankRequired: 1,
    ingredients: [
      { templateId: 'mat-leather-scraps', quantity: 3 },
      { templateId: 'mat-linen-fabric', quantity: 1 }
    ]
  },
  {
    id: 'rec-healing-potion-small',
    resultTemplateId: 'con-healing-potion-small',
    profession: ProfessionType.POTION_MAKER,
    rankRequired: 1,
    ingredients: [
      { templateId: 'mat-herbs-common', quantity: 2 },
      { templateId: 'mat-water', quantity: 1 }
    ],
    stationRequired: 'Alchemy Table'
  }
];
