import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding static data...');

  // --- Speeds ---
  const speeds = [
    { id: 'speed-very-slow', name: 'Very Slow', category: 'VERY_SLOW', distancePerAction: 5 },
    { id: 'speed-slow', name: 'Slow', category: 'SLOW', distancePerAction: 10 },
    { id: 'speed-ordinary', name: 'Ordinary', category: 'ORDINARY', distancePerAction: 15 },
    { id: 'speed-fast', name: 'Fast', category: 'FAST', distancePerAction: 20 },
    { id: 'speed-very-fast', name: 'Very Fast', category: 'VERY_FAST', distancePerAction: 30 }
  ];

  for (const s of speeds) {
    await prisma.speed.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  // --- Races ---
  const races = [
    {
      id: 'race-human',
      name: 'Human',
      description: 'Versatile and ambitious.',
      baseSpeedId: 'speed-ordinary',
      innateSkills: JSON.stringify([]),
      passiveEffects: JSON.stringify([])
    },
    {
      id: 'race-elf',
      name: 'Elf',
      description: 'Graceful and long-lived.',
      baseSpeedId: 'speed-fast',
      innateSkills: JSON.stringify([]),
      passiveEffects: JSON.stringify([])
    }
  ];

  for (const r of races) {
    await prisma.race.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }

  // --- Ranks ---
  const ranks = [
    {
      id: 'rank-1',
      order: 1,
      name: 'Rank 1',
      maxEssence: 300,
      maxArtifacts: 1,
      maxSkills: 1,
      breakthroughConditions: JSON.stringify(['Start of adventure'])
    },
    {
      id: 'rank-2',
      order: 2,
      name: 'Rank 2',
      maxEssence: 600,
      maxArtifacts: 1,
      maxSkills: 2,
      breakthroughConditions: JSON.stringify(['1 common event', '1d100 > 50', 'Training', 'con-essence-potion'])
    },
    {
      id: 'rank-3',
      order: 3,
      name: 'Rank 3',
      maxEssence: 900,
      maxArtifacts: 2,
      maxSkills: 3,
      breakthroughConditions: JSON.stringify(['1 rare event', '1d100 > 60', 'Training', 'con-spirit-potion'])
    },
    {
      id: 'rank-4',
      order: 4,
      name: 'Rank 4',
      maxEssence: 1200,
      maxArtifacts: 2,
      maxSkills: 4,
      breakthroughConditions: JSON.stringify(['1 epic event', '1d100 > 70', 'Training', 'con-phoenix-potion'])
    },
    {
      id: 'rank-5',
      order: 5,
      name: 'Rank 5',
      maxEssence: 1500,
      maxArtifacts: 3,
      maxSkills: 5,
      breakthroughConditions: JSON.stringify(['1 mythic event', '1d100 > 80', 'Training', 'con-demonic-potion'])
    },
    {
      id: 'rank-c1',
      order: 6,
      name: 'Champion Rank 1',
      maxEssence: 2000,
      minEssenceRoll: 250,
      maxArtifacts: 3,
      maxSkills: 6,
      breakthroughConditions: JSON.stringify(['1 legendary event', '1d100 > 85', 'con-element-potion'])
    },
    {
      id: 'rank-c2',
      order: 7,
      name: 'Champion Rank 2',
      maxEssence: 2500,
      minEssenceRoll: 500,
      maxArtifacts: 3,
      maxSkills: 6,
      breakthroughConditions: JSON.stringify(['1 legendary event', '1d100 > 90', 'con-chaos-potion'])
    },
    {
      id: 'rank-c3',
      order: 8,
      name: 'Champion Rank 3',
      maxEssence: 3000,
      minEssenceRoll: 750,
      maxArtifacts: 4,
      maxSkills: 6,
      breakthroughConditions: JSON.stringify(['1 divine event', '1d100 > 50', 'con-death-potion'])
    }
  ];

  for (const r of ranks) {
    await prisma.rank.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }

  // --- Item Templates ---
  const itemTemplates = [
    {
      id: 'mat-copper-ore',
      name: 'Медная руда',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 20,
      isUnique: false,
      description: 'Обычная руда, используемая для базовой ковки.',
      basePrice: 10
    },
    {
      id: 'mat-iron-ore',
      name: 'Железная руда',
      type: 'MATERIAL',
      rarity: 'RARE',
      stackSize: 20,
      isUnique: false,
      description: 'Прочная руда для качественного оружия и доспехов.',
      basePrice: 50
    },
    {
      id: 'mat-linen-fabric',
      name: 'Льняная ткань',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 30,
      isUnique: false,
      basePrice: 5
    },
    {
      id: 'mat-wolf-heart',
      name: 'Сердце волка',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 10,
      isUnique: false,
      basePrice: 20
    },
    {
      id: 'mat-tin-ore',
      name: 'Оловянная руда',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 20,
      isUnique: false,
      basePrice: 15
    },
    {
      id: 'mat-adamantite-ore',
      name: 'Адамантитовая руда',
      type: 'MATERIAL',
      rarity: 'MYTHIC',
      stackSize: 15,
      isUnique: false,
      basePrice: 500
    },
    {
      id: 'mat-silk-fabric',
      name: 'Шёлковая ткань',
      type: 'MATERIAL',
      rarity: 'EPIC',
      stackSize: 30,
      isUnique: false,
      basePrice: 150
    },
    {
      id: 'mat-coal',
      name: 'Уголь',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 50,
      isUnique: false,
      description: 'Топливо для кузницы.',
      basePrice: 5
    },
    {
      id: 'mat-leather-scraps',
      name: 'Обрывки кожи',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 40,
      isUnique: false,
      basePrice: 8
    },
    {
      id: 'mat-herbs-common',
      name: 'Обычные травы',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 50,
      isUnique: false,
      basePrice: 5
    },
    {
      id: 'mat-meat',
      name: 'Мясо',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 20,
      isUnique: false,
      basePrice: 15
    },
    {
      id: 'mat-water',
      name: 'Вода',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 50,
      isUnique: false,
      basePrice: 2
    },
    {
      id: 'mat-magic-dust',
      name: 'Магическая пыль',
      type: 'MATERIAL',
      rarity: 'RARE',
      stackSize: 100,
      isUnique: false,
      basePrice: 50
    },
    {
      id: 'wpn-thief-dagger',
      name: 'Кинжал вора',
      type: 'WEAPON',
      category: 'ONE_HANDED',
      rarity: 'COMMON',
      stackSize: 1,
      isUnique: false,
      baseEssence: 45,
      maxEssence: 100,
      penetration: 'NONE',
      distance: 'CLOSE',
      basePrice: 100
    },
    {
      id: 'wpn-gross-messer',
      name: 'Гросс-мессер',
      type: 'WEAPON',
      category: 'ONE_HANDED',
      rarity: 'EPIC',
      stackSize: 1,
      isUnique: false,
      baseEssence: 200,
      maxEssence: 300,
      penetration: 'MEDIUM',
      distance: 'CLOSE',
      description: '+80 Инициатива',
      basePrice: 850
    },
    {
      id: 'wpn-poleaxe',
      name: 'Полэкс',
      type: 'WEAPON',
      category: 'TWO_HANDED',
      rarity: 'MYTHIC',
      stackSize: 1,
      isUnique: false,
      baseEssence: 550,
      maxEssence: 800,
      penetration: 'HEAVY',
      distance: 'CLOSE',
      description: '+70 Точность, +30 Инициатива, +100 Защита',
      basePrice: 2500
    },
    {
      id: 'wpn-impaler-bow',
      name: 'Короткий лук "Пронзатель"',
      type: 'WEAPON',
      category: 'TWO_HANDED',
      rarity: 'COMMON',
      stackSize: 1,
      isUnique: false,
      baseEssence: 90,
      maxEssence: 150,
      penetration: 'NONE',
      distance: 'MEDIUM',
      basePrice: 120
    },
    {
      id: 'arm-light-leather',
      name: 'Лёгкая кожаная броня',
      type: 'ARMOR',
      category: 'LIGHT',
      rarity: 'COMMON',
      stackSize: 1,
      isUnique: false,
      ignoreDamage: 0,
      baseDurability: 2,
      basePrice: 50
    },
    {
      id: 'arm-medium-chain',
      name: 'Средняя кольчуга',
      type: 'ARMOR',
      category: 'MEDIUM',
      rarity: 'RARE',
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
      type: 'ARMOR',
      category: 'HEAVY',
      rarity: 'EPIC',
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
      type: 'ARMOR',
      category: 'SUPER_HEAVY',
      rarity: 'LEGENDARY',
      stackSize: 1,
      isUnique: false,
      ignoreDamage: 350,
      hitPenalty: 300,
      evasionPenalty: 400,
      speedPenalty: 6,
      baseDurability: 6,
      basePrice: 5000
    },
    {
      id: 'con-simple-stew',
      name: 'Простое рагу',
      type: 'CONSUMABLE',
      category: 'FOOD',
      rarity: 'COMMON',
      stackSize: 4,
      isUnique: false,
      description: 'Восстанавливает 30 ОЗ.',
      basePrice: 15
    },
    {
      id: 'con-healing-potion-small',
      name: 'Малое зелье лечения',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'COMMON',
      stackSize: 6,
      isUnique: false,
      baseEssence: 100,
      description: 'Восстанавливает здоровье.',
      basePrice: 50
    },
    {
      id: 'con-essence-potion',
      name: 'Зелье сущности',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'RARE',
      stackSize: 1,
      isUnique: false,
      description: 'Требуется для прорыва ранга 2.',
      basePrice: 500
    },
    {
      id: 'con-spirit-potion',
      name: 'Концентрированное зелье духа',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'EPIC',
      stackSize: 1,
      isUnique: false,
      description: 'Требуется для прорыва ранга 3.',
      basePrice: 1500
    },
    {
      id: 'con-phoenix-potion',
      name: 'Зелье феникса',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'MYTHIC',
      stackSize: 1,
      isUnique: false,
      description: 'Требуется для прорыва ранга 4.',
      basePrice: 5000
    },
    {
      id: 'con-demonic-potion',
      name: 'Зелье демонической сущности',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'LEGENDARY',
      stackSize: 1,
      isUnique: false,
      description: 'Требуется для прорыва ранга 5.',
      basePrice: 15000
    },
    {
      id: 'con-element-potion',
      name: 'Зелье заключённого элемента',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'DIVINE',
      stackSize: 1,
      isUnique: false,
      description: 'Требуется для прорыва ранга чемпиона 1.',
      basePrice: 50000
    },
    {
      id: 'con-chaos-potion',
      name: 'Зелье хаоса',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'DIVINE',
      stackSize: 1,
      isUnique: false,
      description: 'Требуется для прорыва ранга чемпиона 2.',
      basePrice: 100000
    },
    {
      id: 'con-death-potion',
      name: 'Зелье обратной смерти',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'DIVINE',
      stackSize: 1,
      isUnique: false,
      description: 'Требуется для прорыва ранга чемпиона 3.',
      basePrice: 250000
    },
    {
      id: 'bag-linen-worn',
      name: 'Потрёпанная льняная сумка',
      type: 'BAG',
      rarity: 'COMMON',
      stackSize: 1,
      isUnique: false,
      slotCount: 3,
      basePrice: 80
    },
    {
      id: 'bag-leather-sturdy',
      name: 'Прочная кожаная сумка',
      type: 'BAG',
      rarity: 'RARE',
      stackSize: 1,
      isUnique: false,
      slotCount: 5,
      basePrice: 450
    },
    {
      id: 'bag-silk-fine',
      name: 'Изящная шёлковая сумка',
      type: 'BAG',
      rarity: 'EPIC',
      stackSize: 1,
      isUnique: false,
      slotCount: 8,
      basePrice: 1200
    },
    {
      id: 'bag-void-small',
      name: 'Малая сумка Бездны',
      type: 'BAG',
      rarity: 'MYTHIC',
      stackSize: 1,
      isUnique: false,
      slotCount: 12,
      basePrice: 4000
    },
    {
      id: 'bag-dragon-hide',
      name: 'Сумка из драконьей чешуи',
      type: 'BAG',
      rarity: 'LEGENDARY',
      stackSize: 1,
      isUnique: false,
      slotCount: 16,
      basePrice: 15000
    },
    {
      id: 'bag-divine-infinite',
      name: 'Бесконечная божественная сумка',
      type: 'BAG',
      rarity: 'DIVINE',
      stackSize: 1,
      isUnique: false,
      slotCount: 20,
      basePrice: 100000
    }
  ];

  for (const t of itemTemplates) {
    await prisma.itemTemplate.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }

  // --- Recipes ---
  const recipes = [
    {
      id: 'rec-simple-stew',
      resultTemplateId: 'con-simple-stew',
      profession: 'COOK',
      rankRequired: 1,
      ingredients: JSON.stringify([
        { templateId: 'mat-meat', quantity: 1 },
        { templateId: 'mat-water', quantity: 1 }
      ])
    },
    {
      id: 'rec-copper-dagger',
      resultTemplateId: 'wpn-thief-dagger',
      profession: 'BLACKSMITH',
      rankRequired: 1,
      ingredients: JSON.stringify([
        { templateId: 'mat-copper-ore', quantity: 2 },
        { templateId: 'mat-coal', quantity: 1 }
      ]),
      stationRequired: 'Forge'
    },
    {
      id: 'rec-leather-armor-light',
      resultTemplateId: 'arm-light-leather',
      profession: 'TAILOR',
      rankRequired: 1,
      ingredients: JSON.stringify([
        { templateId: 'mat-leather-scraps', quantity: 3 },
        { templateId: 'mat-linen-fabric', quantity: 1 }
      ])
    },
    {
      id: 'rec-healing-potion-small',
      resultTemplateId: 'con-healing-potion-small',
      profession: 'POTION_MAKER',
      rankRequired: 1,
      ingredients: JSON.stringify([
        { templateId: 'mat-herbs-common', quantity: 2 },
        { templateId: 'mat-water', quantity: 1 }
      ]),
      stationRequired: 'Alchemy Table'
    }
  ];

  for (const r of recipes) {
    await prisma.recipe.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }

  // --- Monster Templates ---
  const monsterTemplates = [
    {
      id: 'mon-wolf',
      name: 'Wolf',
      rankOrder: 1,
      baseEssence: 100,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-wolf-heart', chance: 0.3, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-boar',
      name: 'Boar',
      rankOrder: 1,
      baseEssence: 120,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([])
    },
    {
      id: 'mon-orc',
      name: 'Orc',
      rankOrder: 2,
      baseEssence: 450,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-iron-ore', chance: 0.1, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-vampire',
      name: 'Vampire',
      rankOrder: 3,
      baseEssence: 800,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([])
    },
    {
      id: 'mon-lich',
      name: 'Lich',
      rankOrder: 4,
      baseEssence: 1100,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([])
    },
    {
      id: 'mon-death-knight',
      name: 'Death Knight',
      rankOrder: 5,
      baseEssence: 1400,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([])
    },
    {
      id: 'mon-elder-dragon',
      name: 'Elder Dragon',
      rankOrder: 6,
      baseEssence: 1800,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([])
    },
    {
      id: 'mon-abyssal-horror',
      name: 'Abyssal Horror',
      rankOrder: 7,
      baseEssence: 2300,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([])
    },
    {
      id: 'mon-world-eater',
      name: 'World Eater',
      rankOrder: 8,
      baseEssence: 2800,
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([])
    }
  ];

  for (const m of monsterTemplates) {
    await prisma.monsterTemplate.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  // --- Quests ---
  const quests = [
    {
      id: 'quest-tutorial-1',
      title: 'Добро пожаловать в Хорниград',
      description: 'Ориентируйтесь на окраинах города.',
      status: 'NOT_STARTED',
      rankRequired: 1,
      objectives: JSON.stringify([
        {
          id: 'obj-1',
          description: 'Посетите городские ворота',
          type: 'VISIT',
          targetId: 'loc-city-gates',
          requiredAmount: 1,
          currentAmount: 0,
          isCompleted: false
        }
      ]),
      rewards: JSON.stringify({
        money: 50,
        essence: 10
      })
    },
    {
      id: 'quest-merchant-aid',
      title: 'Помощь торговцу',
      description: 'Местному торговцу нужна медная руда для индивидуального заказа.',
      status: 'NOT_STARTED',
      rankRequired: 1,
      objectives: JSON.stringify([
        {
          id: 'obj-2',
          description: 'Соберите медную руду',
          type: 'COLLECT',
          targetId: 'mat-copper-ore',
          requiredAmount: 5,
          currentAmount: 0,
          isCompleted: false
        }
      ]),
      rewards: JSON.stringify({
        money: 150,
        items: [{ templateId: 'con-healing-potion-small', quantity: 2 }]
      })
    }
  ];

  for (const q of quests) {
    await prisma.quest.upsert({
      where: { id: q.id },
      update: q,
      create: q,
    });
  }

  // --- Locations ---
  const locations = [
    {
      id: 'loc-outskirts',
      name: 'Окраины Хорниграда',
      description: 'Пыльные, заброшенные окраины города. Место для тех, кто хочет остаться незамеченным.',
      zoneType: 'GREEN',
      buildings: JSON.stringify(['build-rusty-anchor'])
    },
    {
      id: 'loc-city-gates',
      name: 'Городские ворота',
      description: 'Массивные железные ворота Хорниграда. Сильно охраняемые и всегда оживлённые.',
      zoneType: 'GREEN',
      buildings: JSON.stringify(['build-guard-post'])
    },
    {
      id: 'loc-merchant-district',
      name: 'Торговый район',
      description: 'Сердце коммерции. Прилавки и магазины выстроились вдоль улиц, продавая всё от экзотических специй до обычной стали.',
      zoneType: 'GREEN',
      buildings: JSON.stringify(['build-district-market', 'build-blacksmith-shop', 'build-alchemy-lab'])
    },
    {
      id: 'loc-forsaken-woods',
      name: 'Заброшенный лес',
      description: 'Тёмный, извилистый лес, где сущность ощущается тяжёлой и враждебной.',
      zoneType: 'YELLOW',
      buildings: JSON.stringify([])
    }
  ];

  for (const l of locations) {
    await prisma.location.upsert({
      where: { id: l.id },
      update: l,
      create: l,
    });
  }

  // --- Buildings ---
  const buildings = [
    {
      id: 'build-rusty-anchor',
      locationId: 'loc-outskirts',
      name: 'Таверна "Ржавый якорь"',
      description: 'Тускло освещённая таверна, пахнущая дешёвым элем и отчаянными мечтами.',
      hasShop: true,
      canRest: true,
      workstations: JSON.stringify(['Cooking Pot'])
    },
    {
      id: 'build-blacksmith-shop',
      locationId: 'loc-merchant-district',
      name: 'Кузница "Стальной молот"',
      description: 'Здесь всегда жарко и шумно. Лучшее место для ковки оружия.',
      hasShop: true,
      canRest: false,
      workstations: JSON.stringify(['Forge'])
    },
    {
      id: 'build-alchemy-lab',
      locationId: 'loc-merchant-district',
      name: 'Алхимическая лаборатория',
      description: 'Тихое место, наполненное странными запахами и булькающими колбами.',
      hasShop: true,
      canRest: false,
      workstations: JSON.stringify(['Alchemy Table'])
    },
    {
      id: 'build-guard-post',
      locationId: 'loc-city-gates',
      name: 'Караульный пост восточных ворот',
      description: 'Прочное каменное здание, где стража следит за всем трафиком, входящим в город.',
      hasShop: false,
      canRest: false,
      workstations: JSON.stringify([])
    },
    {
      id: 'build-district-market',
      locationId: 'loc-merchant-district',
      name: 'Универсальный магазин',
      description: 'Хорошо укомплектованный магазин, обслуживающий как путешественников, так и жителей.',
      hasShop: true,
      canRest: false,
      workstations: JSON.stringify([])
    }
  ];

  for (const b of buildings) {
    await prisma.building.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }

  // --- Connections ---
  const connections = [
    { id: 'conn-1', fromLocationId: 'loc-outskirts', toLocationId: 'loc-city-gates' },
    { id: 'conn-2', fromLocationId: 'loc-city-gates', toLocationId: 'loc-outskirts' },
    { id: 'conn-3', fromLocationId: 'loc-city-gates', toLocationId: 'loc-merchant-district' },
    { id: 'conn-4', fromLocationId: 'loc-merchant-district', toLocationId: 'loc-city-gates' },
    { id: 'conn-5', fromLocationId: 'loc-merchant-district', toLocationId: 'loc-forsaken-woods' },
    { id: 'conn-6', fromLocationId: 'loc-forsaken-woods', toLocationId: 'loc-merchant-district' }
  ];

  for (const c of connections) {
    await prisma.locationConnection.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }

  // --- Profession Rank Thresholds ---
  const thresholds = [
    { rank: 1, minExp: 0, maxExp: 20, name: 'Ученик' },
    { rank: 2, minExp: 20, maxExp: 50, name: 'Подмастерье' },
    { rank: 3, minExp: 50, maxExp: 100, name: 'Умелец' },
    { rank: 4, minExp: 100, maxExp: 200, name: 'Мастер' },
    { rank: 5, minExp: 200, maxExp: 400, name: 'Великий мастер' },
    { rank: 6, minExp: 400, maxExp: 999999999, name: 'Прославленный мастер' },
  ];

  for (const t of thresholds) {
    await prisma.professionRankThreshold.create({
      data: t
    });
  }

  // --- Game Events ---
  const events = [
    {
      id: 'evt-mysterious-traveler',
      title: 'Таинственный путешественник',
      description: 'Закутанная фигура приближается к вам на дороге. Они предлагают странный светящийся фрукт в обмен на несколько монет.',
      rarity: 'COMMON',
      choices: JSON.stringify([
        {
          id: 'choice-buy-fruit',
          text: 'Заплатить 10 монет за фрукт',
          requirement: { type: 'MONEY', value: 10 }
        },
        {
          id: 'choice-ignore',
          text: 'Вежливо отказаться и уйти'
        }
      ])
    },
    {
      id: 'evt-ambush-wolves',
      title: 'Внезапная засада!',
      description: 'Стая голодных волков выходит из теней! У вас нет выбора, кроме как сражаться.',
      rarity: 'COMMON'
    },
    {
      id: 'evt-ancient-shrine',
      title: 'Древнее святилище',
      description: 'Вы обнаруживаете скрытое святилище, заросшее мхом. Слабая магическая энергия пульсирует от алтаря.',
      rarity: 'RARE',
      choices: JSON.stringify([
        {
          id: 'choice-meditate',
          text: 'Медитировать у алтаря'
        }
      ])
    },
    {
      id: 'evt-meteor-impact',
      title: 'Падение метеорита',
      description: 'Полоса света пронзает небо и падает поблизости. Вы находите кратер со светящимся металлическим ядром.',
      rarity: 'EPIC',
      choices: JSON.stringify([
        {
          id: 'choice-extract-ore',
          text: 'Попытаться извлечь небесную руду'
        }
      ])
    },
    {
      id: 'evt-dimensional-rift',
      title: 'Разлом измерений',
      description: 'Воздух мерцает, и трещина в реальности открывается перед вами. Странные шёпоты эхом отдаются из пустоты.',
      rarity: 'MYTHIC',
      choices: JSON.stringify([
        {
          id: 'choice-step-through',
          text: 'Шагнуть в разлом'
        }
      ])
    },
    {
      id: 'evt-celestial-trial',
      title: 'Небесное испытание',
      description: 'Облака расступаются, и луч золотого света опускается. Появляется небесный страж, чтобы испытать вашу ценность.',
      rarity: 'LEGENDARY',
      choices: JSON.stringify([
        {
          id: 'choice-accept-trial',
          text: 'Принять испытание'
        }
      ])
    },
    {
      id: 'evt-divine-ascension',
      title: 'Божественное вознесение',
      description: 'Вы стоите на пороге божественности. Мир вокруг вас начинает растворяться в чистом свете.',
      rarity: 'DIVINE',
      choices: JSON.stringify([
        {
          id: 'choice-embrace-divinity',
          text: 'Принять свет'
        }
      ])
    }
  ];

  for (const e of events) {
    await prisma.gameEvent.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    });
  }

  // --- Game Config ---
  const gameConfig = [
    {
      key: 'CHARACTER_CREATION_DEFAULTS',
      value: JSON.stringify({
        rankId: 'rank-1',
        stats: {
          essence: { current: 100, max: 100 },
          energy: { current: 100, max: 100 },
          protection: { current: 100, max: 100 },
          speedId: 'speed-ordinary'
        },
        bonuses: {
          evasion: 0,
          accuracy: 0,
          damageResistance: 0,
          initiative: 0
        },
        professions: [],
        location: {
          locationId: 'loc-outskirts',
          position: 'Центр'
        },
        money: 100,
        inventory: {
          baseSlots: 10
        }
      })
    },
    {
      key: 'TRAINING_CONFIG',
      value: JSON.stringify({
        essenceGainRoll: 20,
        energyCost: 20,
        cooldownHours: 24
      })
    },
    {
      key: 'MOVEMENT_CONFIG',
      value: JSON.stringify({
        energyCostPerMove: 10,
        hoursPerMove: 1
      })
    },
    {
      key: 'TRADE_CONFIG',
      value: JSON.stringify({
        sellMultiplier: 0.5
      })
    },
    {
      key: 'REST_CONFIG',
      value: JSON.stringify({
        moneyCost: 10,
        hoursDuration: 8
      })
    },
    {
      key: 'CRAFTING_CONFIG',
      value: JSON.stringify({
        weaponTrainingGainRoll: 5,
        repairCost: 10,
        weaponEssenceRanges: {
          COMMON: { min1H: 0, max1H: 60, min2H: 0, max2H: 100 },
          RARE: { min1H: 60, max1H: 150, min2H: 100, max2H: 250 },
          EPIC: { min1H: 150, max1H: 300, min2H: 250, max2H: 500 },
          MYTHIC: { min1H: 300, max1H: 450, min2H: 500, max2H: 800 },
          LEGENDARY: { min1H: 450, max1H: 650, min2H: 800, max2H: 1200 },
          DIVINE: { min1H: 650, max1H: 850, min2H: 1200, max2H: 1500 }
        },
        armorDurability: {
          COMMON: 2,
          RARE: 3,
          EPIC: 4,
          MYTHIC: 5,
          LEGENDARY: 6,
          DIVINE: 7
        },
        potionEssenceMin: {
          COMMON: 0,
          RARE: 400,
          EPIC: 800,
          MYTHIC: 1200,
          LEGENDARY: 1600,
          DIVINE: 2000
        },
        scrollEssenceMin: {
          COMMON: 0,
          RARE: 300,
          EPIC: 600,
          MYTHIC: 900,
          LEGENDARY: 1200,
          DIVINE: 1600
        }
      })
    },
    {
      key: 'COMBAT_CONFIG',
      value: JSON.stringify({
        defaultUnarmedDamage: 5,
        defaultCombatLocationId: 'combat-zone'
      })
    },
    {
      key: 'EVENT_CONFIG',
      value: JSON.stringify({
        travelEventChance: 0.2
      })
    }
  ];

  for (const config of gameConfig) {
    await prisma.gameConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

