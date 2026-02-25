import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Import and call other seed functions
import { seedSkills } from './seed-skills';
import { seedEffects } from './seed-effects';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding static data...');
  
  // * Effects must be seeded before skills (skills reference effect IDs)
  await seedEffects();
  await seedSkills();

  const systemPasswordHash = await bcrypt.hash('SYSTEM_NPC_PASSWORD', 10);
  await prisma.user.upsert({
    where: { login: 'system-npc' },
    update: {},
    create: {
      id: 'system-npc',
      login: 'system-npc',
      passwordHash: systemPasswordHash,
      role: 'SYSTEM'
    }
  });

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
      accuracyBonus: 0,
      evasionBonus: 0,
      initiativeBonus: 80,
      resistanceBonus: 0,
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
      accuracyBonus: 70,
      evasionBonus: 0,
      initiativeBonus: 30,
      resistanceBonus: 0,
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
      id: 'wpn-steel-hammer-poisoned',
      name: 'Стальной молот',
      type: 'WEAPON',
      category: 'TWO_HANDED',
      rarity: 'RARE',
      stackSize: 1,
      isUnique: false,
      baseEssence: 60,
      maxEssence: 150,
      penetration: 'LIGHT',
      distance: JSON.stringify({ minRange: 0, maxRange: 5 }),
      effects: JSON.stringify(['effect-poison']),
      description: 'Тяжелый молот с отравленным наконечником. Наносит яд при попадании.',
      basePrice: 300
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
      baseEssence: 30,
      description: JSON.stringify({
        description: 'Восстанавливает 30 HP.',
        targetType: 'SELF',
        actionType: 'BONUS'
      }),
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
      baseEssence: 30,
      effects: JSON.stringify(['effect-small-heal']),
      description: JSON.stringify({
        description: 'Восстанавливает 30 HP.',
        targetType: 'SELF',
        actionType: 'BONUS'
      }),
      basePrice: 50
    },
    {
      id: 'scroll-simple-bolt',
      name: 'Простой боевой свиток',
      type: 'CONSUMABLE',
      category: 'SCROLL',
      rarity: 'COMMON',
      stackSize: 5,
      isUnique: false,
      baseEssence: 40,
      penetration: 'NONE',
      distance: JSON.stringify({ minRange: 5, maxRange: 20 }),
      description: JSON.stringify({
        description: 'Выпускает энергетический заряд по цели на средней дистанции.',
        targetType: 'TARGET',
        actionType: 'MAIN'
      }),
      basePrice: 80
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
    },
    // --- MATERIALS FOR MONSTER LOOT ---
    // Rank 1 (COMMON)
    {
      id: 'mat-goblin-ear',
      name: 'Ухо гоблина',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 20,
      isUnique: false,
      description: 'Ухо гоблина. Можно продать или использовать для зелий.',
      basePrice: 15
    },
    {
      id: 'mat-rat-tail',
      name: 'Хвост крысы',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 30,
      isUnique: false,
      description: 'Хвост гигантской крысы.',
      basePrice: 5
    },
    {
      id: 'mat-wolf-pelt',
      name: 'Шкура волка',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 10,
      isUnique: false,
      description: 'Шкура волка,可用于 крафта.',
      basePrice: 25
    },
    {
      id: 'mat-boar-tusk',
      name: 'Клык кабана',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 15,
      isUnique: false,
      description: 'Клык кабана. Используется для создания оружия.',
      basePrice: 20
    },
    {
      id: 'mat-bone-common',
      name: 'Обычная кость',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 30,
      isUnique: false,
      description: 'Простая кость существа. Используется для крафта.',
      basePrice: 10
    },
    {
      id: 'mat-slime-gel',
      name: 'Слизь слайма',
      type: 'MATERIAL',
      rarity: 'COMMON',
      stackSize: 30,
      isUnique: false,
      description: 'Желеобразная слизь слайма.',
      basePrice: 8
    },
    // Rank 2 (RARE)
    {
      id: 'mat-orc-fang',
      name: 'Клык орка',
      type: 'MATERIAL',
      rarity: 'RARE',
      stackSize: 15,
      isUnique: false,
      description: 'Клык орка. Ценный материал для оружия.',
      basePrice: 40
    },
    {
      id: 'mat-ogre-bone',
      name: 'Кость огра',
      type: 'MATERIAL',
      rarity: 'RARE',
      stackSize: 10,
      isUnique: false,
      description: 'Кость могучего огра.',
      basePrice: 60
    },
    {
      id: 'mat-ghost-essence',
      name: 'Эссенция призрака',
      type: 'MATERIAL',
      rarity: 'RARE',
      stackSize: 20,
      isUnique: false,
      description: 'Эссенция призрачного существа.',
      basePrice: 80
    },
    {
      id: 'mat-spider-venom',
      name: 'Яд паука',
      type: 'MATERIAL',
      rarity: 'RARE',
      stackSize: 20,
      isUnique: false,
      description: 'Яд гигантского паука. Используется для отравления оружия.',
      basePrice: 70
    },
    {
      id: 'mat-troll-blood',
      name: 'Кровь тролля',
      type: 'MATERIAL',
      rarity: 'RARE',
      stackSize: 15,
      isUnique: false,
      description: 'Кровь тролля. Обладает регенерирующими свойствами.',
      basePrice: 90
    },
    // Rank 3 (EPIC)
    {
      id: 'mat-vampire-fang',
      name: 'Клык вампира',
      type: 'MATERIAL',
      rarity: 'EPIC',
      stackSize: 10,
      isUnique: false,
      description: 'Клык вампира. Ценный материал.',
      basePrice: 200
    },
    {
      id: 'mat-demon-horn',
      name: 'Рог демона',
      type: 'MATERIAL',
      rarity: 'EPIC',
      stackSize: 10,
      isUnique: false,
      description: 'Рог демона. Используется для создания мощного оружия.',
      basePrice: 250
    },
    {
      id: 'mat-elemental-core',
      name: 'Ядро элементаля',
      type: 'MATERIAL',
      rarity: 'EPIC',
      stackSize: 10,
      isUnique: false,
      description: 'Сердцевина элементаля. Содержит чистую стихию.',
      basePrice: 300
    },
    {
      id: 'mat-werewolf-claw',
      name: 'Коготь оборотня',
      type: 'MATERIAL',
      rarity: 'EPIC',
      stackSize: 10,
      isUnique: false,
      description: 'Коготь оборотня. Острый и прочный.',
      basePrice: 220
    },
    {
      id: 'mat-shadow-essence',
      name: 'Эссенция тени',
      type: 'MATERIAL',
      rarity: 'EPIC',
      stackSize: 15,
      isUnique: false,
      description: 'Концентрированная эссенция тьмы.',
      basePrice: 280
    },
    // Rank 4 (MYTHIC)
    {
      id: 'mat-lich-phylactery',
      name: 'Филактерия лича',
      type: 'MATERIAL',
      rarity: 'MYTHIC',
      stackSize: 5,
      isUnique: false,
      description: 'Филактерия, содержащая душу лича.',
      basePrice: 500
    },
    {
      id: 'mat-dragon-scale',
      name: 'Чешуя дракона',
      type: 'MATERIAL',
      rarity: 'MYTHIC',
      stackSize: 10,
      isUnique: false,
      description: 'Чешуя дракона. Невероятно прочная.',
      basePrice: 600
    },
    {
      id: 'mat-phoenix-feather',
      name: 'Перо феникса',
      type: 'MATERIAL',
      rarity: 'MYTHIC',
      stackSize: 10,
      isUnique: false,
      description: 'Перо феника. Светится вечным пламенем.',
      basePrice: 550
    },
    {
      id: 'mat-golem-core',
      name: 'Ядро голема',
      type: 'MATERIAL',
      rarity: 'MYTHIC',
      stackSize: 5,
      isUnique: false,
      description: 'Сердце голема. Источник его силы.',
      basePrice: 450
    },
    {
      id: 'mat-void-crystal',
      name: 'Кристалл пустоты',
      type: 'MATERIAL',
      rarity: 'MYTHIC',
      stackSize: 10,
      isUnique: false,
      description: 'Кристалл, содержащий силу Бездны.',
      basePrice: 700
    },
    // Rank 5 (LEGENDARY/DIVINE)
    {
      id: 'mat-death-knight-soul',
      name: 'Душа рыцаря смерти',
      type: 'MATERIAL',
      rarity: 'LEGENDARY',
      stackSize: 5,
      isUnique: false,
      description: 'Душа павшего рыцаря смерти.',
      basePrice: 1500
    },
    {
      id: 'mat-elder-dragon-heart',
      name: 'Сердце древнего дракона',
      type: 'MATERIAL',
      rarity: 'LEGENDARY',
      stackSize: 3,
      isUnique: false,
      description: 'Сердце древнего дракона. Пульсирует невероятной силой.',
      basePrice: 2000
    },
    {
      id: 'mat-abyssal-essence',
      name: 'Эссенция бездны',
      type: 'MATERIAL',
      rarity: 'DIVINE',
      stackSize: 5,
      isUnique: false,
      description: 'Чистая эссенция Бездны.',
      basePrice: 3000
    },
    {
      id: 'mat-world-eater-fragment',
      name: 'Фрагмент Пожирателя Миров',
      type: 'MATERIAL',
      rarity: 'DIVINE',
      stackSize: 3,
      isUnique: false,
      description: 'Фрагмент сущности Пожирателя Миров.',
      basePrice: 5000
    },
    // --- CONSUMABLES FOR MONSTER LOOT ---
    {
      id: 'con-healing-potion-medium',
      name: 'Среднее зелье лечения',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'RARE',
      stackSize: 5,
      isUnique: false,
      baseEssence: 50,
      effects: JSON.stringify(['effect-medium-heal']),
      description: JSON.stringify({
        description: 'Восстанавливает 50 HP.',
        targetType: 'SELF',
        actionType: 'BONUS'
      }),
      basePrice: 150
    },
    {
      id: 'con-healing-potion-large',
      name: 'Большое зелье лечения',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'EPIC',
      stackSize: 3,
      isUnique: false,
      baseEssence: 100,
      effects: JSON.stringify(['effect-large-heal']),
      description: JSON.stringify({
        description: 'Восстанавливает 100 HP.',
        targetType: 'SELF',
        actionType: 'BONUS'
      }),
      basePrice: 400
    },
    {
      id: 'con-strength-potion',
      name: 'Зелье силы',
      type: 'CONSUMABLE',
      category: 'POTION',
      rarity: 'RARE',
      stackSize: 5,
      isUnique: false,
      description: JSON.stringify({
        description: '+20 к попаданию на 3 хода.',
        targetType: 'SELF',
        actionType: 'BONUS'
      }),
      basePrice: 200
    },
    {
      id: 'scroll-fireball',
      name: 'Свиток огненного шара',
      type: 'CONSUMABLE',
      category: 'SCROLL',
      rarity: 'RARE',
      stackSize: 5,
      isUnique: false,
      baseEssence: 80,
      penetration: 'MEDIUM',
      distance: JSON.stringify({ minRange: 5, maxRange: 25 }),
      description: JSON.stringify({
        description: 'Выпускает огненный шар, наносящий урон огнём всем целям в области.',
        targetType: 'AREA',
        actionType: 'MAIN'
      }),
      basePrice: 300
    },
    {
      id: 'scroll-ice-bolt',
      name: 'Свиток ледяной стрелы',
      type: 'CONSUMABLE',
      category: 'SCROLL',
      rarity: 'RARE',
      stackSize: 5,
      isUnique: false,
      baseEssence: 70,
      penetration: 'MEDIUM',
      distance: JSON.stringify({ minRange: 5, maxRange: 25 }),
      description: JSON.stringify({
        description: 'Выпускает ледяную стрелу, наносящую урон холодом.',
        targetType: 'TARGET',
        actionType: 'MAIN'
      }),
      basePrice: 280
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
      speedId: 'speed-fast',
      skills: JSON.stringify(['skill-monster-bite', 'skill-monster-rage']),
      lootTable: JSON.stringify([
        { templateId: 'mat-wolf-heart', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-wolf-pelt', chance: 0.5, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-meat', chance: 0.4, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-boar',
      name: 'Boar',
      rankOrder: 1,
      baseEssence: 130,
      speedId: 'speed-ordinary',
      skills: JSON.stringify(['skill-monster-charge']),
      lootTable: JSON.stringify([
        { templateId: 'mat-boar-tusk', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-meat', chance: 0.6, minQuantity: 1, maxQuantity: 3 },
        { templateId: 'mat-leather-scraps', chance: 0.3, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-orc',
      name: 'Orc',
      rankOrder: 2,
      baseEssence: 350,
      speedId: 'speed-slow',
      skills: JSON.stringify(['skill-monster-rage', 'skill-monster-shield']),
      lootTable: JSON.stringify([
        { templateId: 'mat-orc-fang', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-iron-ore', chance: 0.2, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'wpn-thief-dagger', chance: 0.05, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-vampire',
      name: 'Vampire',
      rankOrder: 3,
      baseEssence: 700,
      speedId: 'speed-very-fast',
      skills: JSON.stringify(['skill-monster-bite', 'skill-monster-regeneration', 'skill-monster-fear']),
      lootTable: JSON.stringify([
        { templateId: 'mat-vampire-fang', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-magic-dust', chance: 0.3, minQuantity: 1, maxQuantity: 3 },
        { templateId: 'con-healing-potion-medium', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-lich',
      name: 'Lich',
      rankOrder: 4,
      baseEssence: 1000,
      speedId: 'speed-ordinary',
      skills: JSON.stringify(['skill-monster-fire-breath', 'skill-monster-summon']),
      lootTable: JSON.stringify([
        { templateId: 'mat-lich-phylactery', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-magic-dust', chance: 0.4, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'scroll-fireball', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-death-knight',
      name: 'Death Knight',
      rankOrder: 5,
      baseEssence: 1300,
      speedId: 'speed-slow',
      skills: JSON.stringify(['skill-monster-shield', 'skill-monster-fear']),
      lootTable: JSON.stringify([
        { templateId: 'mat-death-knight-soul', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-adamantite-ore', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'wpn-gross-messer', chance: 0.05, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-elder-dragon',
      name: 'Elder Dragon',
      rankOrder: 6,
      baseEssence: 1700,
      speedId: 'speed-ordinary',
      skills: JSON.stringify(['skill-monster-fire-breath', 'skill-monster-rage', 'skill-monster-regeneration']),
      lootTable: JSON.stringify([
        { templateId: 'mat-elder-dragon-heart', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-dragon-scale', chance: 0.3, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'mat-adamantite-ore', chance: 0.2, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-abyssal-horror',
      name: 'Abyssal Horror',
      rankOrder: 7,
      baseEssence: 2200,
      speedId: 'speed-ordinary',
      skills: JSON.stringify(['skill-monster-fear', 'skill-monster-poison-sting', 'skill-monster-summon']),
      lootTable: JSON.stringify([
        { templateId: 'mat-abyssal-essence', chance: 0.15, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-void-crystal', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'scroll-ice-bolt', chance: 0.2, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-world-eater',
      name: 'World Eater',
      rankOrder: 8,
      baseEssence: 2700,
      speedId: 'speed-very-slow',
      skills: JSON.stringify(['skill-monster-fire-breath', 'skill-monster-fear', 'skill-monster-regeneration']),
      lootTable: JSON.stringify([
        { templateId: 'mat-world-eater-fragment', chance: 0.05, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-abyssal-essence', chance: 0.3, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'wpn-poleaxe', chance: 0.03, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    // --- RANK 1 MONSTERS (80-250 essence) ---
    {
      id: 'mon-rat-giant',
      name: 'Гигантская крыса',
      rankOrder: 1,
      baseEssence: 80,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-rat-tail', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-meat', chance: 0.3, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-slime-green',
      name: 'Зелёный слайм',
      rankOrder: 1,
      baseEssence: 90,
      speedId: 'speed-very-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-slime-gel', chance: 0.6, minQuantity: 1, maxQuantity: 3 },
        { templateId: 'mat-herbs-common', chance: 0.2, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-goblin-scout',
      name: 'Гоблин-разведчик',
      rankOrder: 1,
      baseEssence: 110,
      speedId: 'speed-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-goblin-ear', chance: 0.35, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-copper-ore', chance: 0.15, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-skeleton-warrior',
      name: 'Скелет-воин',
      rankOrder: 1,
      baseEssence: 150,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-bone-common', chance: 0.5, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'mat-iron-ore', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-zombie',
      name: 'Зомби',
      rankOrder: 1,
      baseEssence: 170,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-bone-common', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-leather-scraps', chance: 0.25, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-goblin-warrior',
      name: 'Гоблин-воин',
      rankOrder: 1,
      baseEssence: 190,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-goblin-ear', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-iron-ore', chance: 0.2, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'wpn-thief-dagger', chance: 0.05, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-spider-giant',
      name: 'Гигантский паук',
      rankOrder: 1,
      baseEssence: 210,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-spider-venom', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-herbs-common', chance: 0.3, minQuantity: 1, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-bandit',
      name: 'Разбойник',
      rankOrder: 1,
      baseEssence: 250,
      speedId: 'speed-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-copper-ore', chance: 0.3, minQuantity: 1, maxQuantity: 3 },
        { templateId: 'con-healing-potion-small', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'wpn-thief-dagger', chance: 0.08, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    // --- RANK 2 MONSTERS (250-500 essence) ---
    {
      id: 'mon-goblin-chief',
      name: 'Вождь гоблинов',
      rankOrder: 2,
      baseEssence: 280,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-goblin-ear', chance: 0.5, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-iron-ore', chance: 0.3, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'wpn-thief-dagger', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-orc-scout',
      name: 'Орк-разведчик',
      rankOrder: 2,
      baseEssence: 320,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-orc-fang', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-iron-ore', chance: 0.25, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-ogre',
      name: 'Огр',
      rankOrder: 2,
      baseEssence: 400,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-ogre-bone', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-leather-scraps', chance: 0.4, minQuantity: 2, maxQuantity: 4 }
      ])
    },
    {
      id: 'mon-ghost',
      name: 'Призрак',
      rankOrder: 2,
      baseEssence: 380,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-ghost-essence', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-magic-dust', chance: 0.2, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-werewolf',
      name: 'Оборотень',
      rankOrder: 2,
      baseEssence: 420,
      speedId: 'speed-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-werewolf-claw', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-wolf-pelt', chance: 0.4, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-harpy',
      name: 'Гарпия',
      rankOrder: 2,
      baseEssence: 360,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-herbs-common', chance: 0.3, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-leather-scraps', chance: 0.25, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-troll',
      name: 'Тролль',
      rankOrder: 2,
      baseEssence: 480,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-troll-blood', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-bone-common', chance: 0.4, minQuantity: 3, maxQuantity: 5 }
      ])
    },
    {
      id: 'mon-minotaur',
      name: 'Минотавр',
      rankOrder: 2,
      baseEssence: 450,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-ogre-bone', chance: 0.2, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-iron-ore', chance: 0.35, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'wpn-gross-messer', chance: 0.03, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-dark-spider',
      name: 'Тёмный паук',
      rankOrder: 2,
      baseEssence: 340,
      speedId: 'speed-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-spider-venom', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-magic-dust', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    // --- RANK 3 MONSTERS (500-800 essence) ---
    {
      id: 'mon-orc-warlord',
      name: 'Полководец орков',
      rankOrder: 3,
      baseEssence: 520,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-orc-fang', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-iron-ore', chance: 0.35, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'wpn-gross-messer', chance: 0.08, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-vampire-fledgling',
      name: 'Молодой вампир',
      rankOrder: 3,
      baseEssence: 580,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-vampire-fang', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-magic-dust', chance: 0.25, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-demon-lesser',
      name: 'Младший демон',
      rankOrder: 3,
      baseEssence: 620,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-magic-dust', chance: 0.3, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-golem-stone',
      name: 'Каменный голем',
      rankOrder: 3,
      baseEssence: 700,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-golem-core', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-iron-ore', chance: 0.4, minQuantity: 3, maxQuantity: 5 }
      ])
    },
    {
      id: 'mon-elemental-fire',
      name: 'Огненный элементаль',
      rankOrder: 3,
      baseEssence: 650,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-coal', chance: 0.5, minQuantity: 3, maxQuantity: 5 }
      ])
    },
    {
      id: 'mon-elemental-ice',
      name: 'Ледяной элементаль',
      rankOrder: 3,
      baseEssence: 650,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-water', chance: 0.4, minQuantity: 2, maxQuantity: 4 }
      ])
    },
    {
      id: 'mon-necromancer',
      name: 'Некромант',
      rankOrder: 3,
      baseEssence: 600,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-ghost-essence', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-magic-dust', chance: 0.4, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'scroll-fireball', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-basilisk',
      name: 'Василиск',
      rankOrder: 3,
      baseEssence: 720,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-spider-venom', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-demon-horn', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-shadow-assassin',
      name: 'Теневой ассасин',
      rankOrder: 3,
      baseEssence: 550,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-shadow-essence', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-ghost-essence', chance: 0.25, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    // --- RANK 4 MONSTERS (800-1100 essence) ---
    {
      id: 'mon-demon',
      name: 'Демон',
      rankOrder: 4,
      baseEssence: 850,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-magic-dust', chance: 0.4, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'scroll-fireball', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-golem-iron',
      name: 'Железный голем',
      rankOrder: 4,
      baseEssence: 950,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-golem-core', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-iron-ore', chance: 0.5, minQuantity: 4, maxQuantity: 6 },
        { templateId: 'mat-adamantite-ore', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-vampire-elder',
      name: 'Древний вампир',
      rankOrder: 4,
      baseEssence: 900,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-vampire-fang', chance: 0.35, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-magic-dust', chance: 0.35, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'con-healing-potion-large', chance: 0.2, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-dragon-young',
      name: 'Молодой дракон',
      rankOrder: 4,
      baseEssence: 1050,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-dragon-scale', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-magic-dust', chance: 0.3, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-sphinx',
      name: 'Сфинкс',
      rankOrder: 4,
      baseEssence: 880,
      speedId: 'speed-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-magic-dust', chance: 0.45, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-elemental-core', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'scroll-ice-bolt', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-manticore',
      name: 'Мантикора',
      rankOrder: 4,
      baseEssence: 920,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-spider-venom', chance: 0.35, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-werewolf-claw', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-leather-scraps', chance: 0.4, minQuantity: 3, maxQuantity: 5 }
      ])
    },
    {
      id: 'mon-chimera',
      name: 'Химера',
      rankOrder: 4,
      baseEssence: 980,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-dragon-scale', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-spider-venom', chance: 0.3, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-archmage-dark',
      name: 'Тёмный архимаг',
      rankOrder: 4,
      baseEssence: 820,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-magic-dust', chance: 0.5, minQuantity: 4, maxQuantity: 6 },
        { templateId: 'mat-void-crystal', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'scroll-fireball', chance: 0.2, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-wraith',
      name: 'Призрачный страж',
      rankOrder: 4,
      baseEssence: 860,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-ghost-essence', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-shadow-essence', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-lich-phylactery', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    // --- RANK 5 MONSTERS (1100-1400 essence) ---
    {
      id: 'mon-demon-greater',
      name: 'Старший демон',
      rankOrder: 5,
      baseEssence: 1150,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-void-crystal', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'scroll-fireball', chance: 0.25, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-dragon-adult',
      name: 'Взрослый дракон',
      rankOrder: 5,
      baseEssence: 1350,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-dragon-scale', chance: 0.35, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'mat-elder-dragon-heart', chance: 0.08, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-adamantite-ore', chance: 0.2, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-lich-archmage',
      name: 'Лич-архимаг',
      rankOrder: 5,
      baseEssence: 1200,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-lich-phylactery', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-void-crystal', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'scroll-fireball', chance: 0.3, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-titan',
      name: 'Титан',
      rankOrder: 5,
      baseEssence: 1400,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-adamantite-ore', chance: 0.35, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-golem-core', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'wpn-poleaxe', chance: 0.03, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-phoenix',
      name: 'Феникс',
      rankOrder: 5,
      baseEssence: 1180,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-phoenix-feather', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-elemental-core', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-magic-dust', chance: 0.4, minQuantity: 4, maxQuantity: 6 }
      ])
    },
    {
      id: 'mon-hydra',
      name: 'Гидра',
      rankOrder: 5,
      baseEssence: 1320,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-spider-venom', chance: 0.45, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'mat-dragon-scale', chance: 0.2, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-troll-blood', chance: 0.3, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-kraken',
      name: 'Кракен',
      rankOrder: 5,
      baseEssence: 1280,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-water', chance: 0.5, minQuantity: 5, maxQuantity: 8 },
        { templateId: 'mat-adamantite-ore', chance: 0.15, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-angel-fallen',
      name: 'Падший ангел',
      rankOrder: 5,
      baseEssence: 1250,
      speedId: 'speed-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-phoenix-feather', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-void-crystal', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'con-healing-potion-large', chance: 0.3, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-golem-adamantite',
      name: 'Адамантитовый голем',
      rankOrder: 5,
      baseEssence: 1380,
      speedId: 'speed-very-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-adamantite-ore', chance: 0.5, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-golem-core', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'wpn-poleaxe', chance: 0.05, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    // --- RANK 6 MONSTERS (1400-1800 essence) ---
    {
      id: 'mon-demon-lord',
      name: 'Лорд демонов',
      rankOrder: 6,
      baseEssence: 1600,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.45, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'mat-void-crystal', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'scroll-fireball', chance: 0.35, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-lich-king',
      name: 'Король личей',
      rankOrder: 6,
      baseEssence: 1550,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-lich-phylactery', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-void-crystal', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-death-knight-soul', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-angel-dark',
      name: 'Тёмный ангел',
      rankOrder: 6,
      baseEssence: 1500,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-phoenix-feather', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-void-crystal', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'con-healing-potion-large', chance: 0.35, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-giant-storm',
      name: 'Штормовой великан',
      rankOrder: 6,
      baseEssence: 1750,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-adamantite-ore', chance: 0.4, minQuantity: 4, maxQuantity: 6 },
        { templateId: 'mat-elemental-core', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'wpn-poleaxe', chance: 0.05, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-behemoth',
      name: 'Бегемот',
      rankOrder: 6,
      baseEssence: 1800,
      speedId: 'speed-very-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-adamantite-ore', chance: 0.45, minQuantity: 4, maxQuantity: 6 },
        { templateId: 'mat-golem-core', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-elder-dragon-heart', chance: 0.08, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-leviathan',
      name: 'Левиафан',
      rankOrder: 6,
      baseEssence: 1650,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-water', chance: 0.6, minQuantity: 6, maxQuantity: 10 },
        { templateId: 'mat-adamantite-ore', chance: 0.2, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-djinn-noble',
      name: 'Благородный джинн',
      rankOrder: 6,
      baseEssence: 1450,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-magic-dust', chance: 0.5, minQuantity: 5, maxQuantity: 8 },
        { templateId: 'mat-elemental-core', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'scroll-ice-bolt', chance: 0.3, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-dragon-undead',
      name: 'Нежить-дракон',
      rankOrder: 6,
      baseEssence: 1720,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-dragon-scale', chance: 0.3, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'mat-lich-phylactery', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-death-knight-soul', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-elemental-prince',
      name: 'Принц элементалей',
      rankOrder: 6,
      baseEssence: 1580,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-void-crystal', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'scroll-fireball', chance: 0.25, minQuantity: 2, maxQuantity: 2 }
      ])
    },
    // --- RANK 7 MONSTERS (1800-2300 essence) ---
    {
      id: 'mon-dragon-ancient',
      name: 'Древнейший дракон',
      rankOrder: 7,
      baseEssence: 2100,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elder-dragon-heart', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-dragon-scale', chance: 0.35, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-abyssal-essence', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-demon-prince',
      name: 'Принц демонов',
      rankOrder: 7,
      baseEssence: 2000,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.5, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-void-crystal', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-abyssal-essence', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-titan-elder',
      name: 'Древний титан',
      rankOrder: 7,
      baseEssence: 2300,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-adamantite-ore', chance: 0.5, minQuantity: 5, maxQuantity: 8 },
        { templateId: 'mat-golem-core', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-elder-dragon-heart', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-phoenix-empyrean',
      name: 'Огненный феникс',
      rankOrder: 7,
      baseEssence: 1950,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-phoenix-feather', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-elemental-core', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-abyssal-essence', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-kraken-elder',
      name: 'Древний кракен',
      rankOrder: 7,
      baseEssence: 2150,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-water', chance: 0.7, minQuantity: 8, maxQuantity: 12 },
        { templateId: 'mat-abyssal-essence', chance: 0.12, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-archdevil',
      name: 'Архидьявол',
      rankOrder: 7,
      baseEssence: 2050,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.45, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-void-crystal', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'scroll-fireball', chance: 0.4, minQuantity: 2, maxQuantity: 4 }
      ])
    },
    {
      id: 'mon-void-walker',
      name: 'Странник пустоты',
      rankOrder: 7,
      baseEssence: 1900,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-void-crystal', chance: 0.45, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-abyssal-essence', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-shadow-essence', chance: 0.3, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-lich-demigod',
      name: 'Полубог-лич',
      rankOrder: 7,
      baseEssence: 2250,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-lich-phylactery', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-abyssal-essence', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-death-knight-soul', chance: 0.2, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-elemental-king',
      name: 'Король элементалей',
      rankOrder: 7,
      baseEssence: 1850,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.5, minQuantity: 2, maxQuantity: 4 },
        { templateId: 'mat-void-crystal', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'scroll-fireball', chance: 0.35, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    // --- RANK 8 MONSTERS (2300-3000 essence) ---
    {
      id: 'mon-dragon-god',
      name: 'Бог-дракон',
      rankOrder: 8,
      baseEssence: 2800,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elder-dragon-heart', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
        { templateId: 'mat-dragon-scale', chance: 0.4, minQuantity: 4, maxQuantity: 6 },
        { templateId: 'mat-world-eater-fragment', chance: 0.08, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-titan-primordial',
      name: 'Первородный титан',
      rankOrder: 8,
      baseEssence: 2900,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-adamantite-ore', chance: 0.6, minQuantity: 6, maxQuantity: 10 },
        { templateId: 'mat-golem-core', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-world-eater-fragment', chance: 0.05, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-demon-overlord',
      name: 'Повелитель демонов',
      rankOrder: 8,
      baseEssence: 2600,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-demon-horn', chance: 0.55, minQuantity: 4, maxQuantity: 6 },
        { templateId: 'mat-void-crystal', chance: 0.45, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-abyssal-essence', chance: 0.25, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-void-lord',
      name: 'Повелитель пустоты',
      rankOrder: 8,
      baseEssence: 2500,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-void-crystal', chance: 0.5, minQuantity: 3, maxQuantity: 4 },
        { templateId: 'mat-abyssal-essence', chance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-world-eater-fragment', chance: 0.1, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-angel-seraph',
      name: 'Серафим',
      rankOrder: 8,
      baseEssence: 2400,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-phoenix-feather', chance: 0.5, minQuantity: 3, maxQuantity: 4 },
        { templateId: 'mat-void-crystal', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'con-healing-potion-large', chance: 0.45, minQuantity: 2, maxQuantity: 3 }
      ])
    },
    {
      id: 'mon-leviathan-ancient',
      name: 'Древнейший левиафан',
      rankOrder: 8,
      baseEssence: 2750,
      speedId: 'speed-slow',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.5, minQuantity: 3, maxQuantity: 4 },
        { templateId: 'mat-water', chance: 0.8, minQuantity: 10, maxQuantity: 15 },
        { templateId: 'mat-abyssal-essence', chance: 0.2, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'mon-phoenix-eternal',
      name: 'Вечный феникс',
      rankOrder: 8,
      baseEssence: 2550,
      speedId: 'speed-very-fast',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-phoenix-feather', chance: 0.55, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-elemental-core', chance: 0.4, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'mat-elder-dragon-heart', chance: 0.15, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-lich-god',
      name: 'Бог-лич',
      rankOrder: 8,
      baseEssence: 2850,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-lich-phylactery', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-abyssal-essence', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        { templateId: 'mat-world-eater-fragment', chance: 0.08, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'mon-elemental-titan',
      name: 'Титан стихий',
      rankOrder: 8,
      baseEssence: 2650,
      speedId: 'speed-ordinary',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-elemental-core', chance: 0.55, minQuantity: 3, maxQuantity: 5 },
        { templateId: 'mat-void-crystal', chance: 0.35, minQuantity: 2, maxQuantity: 3 },
        { templateId: 'scroll-fireball', chance: 0.45, minQuantity: 3, maxQuantity: 5 }
      ])
    }
  ];

  for (const m of monsterTemplates) {
    await prisma.monsterTemplate.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  // --- NPC Templates ---
  const npcTemplates = [
    {
      id: 'npc-guard',
      name: 'Стражник',
      npcType: 'guard',
      rankOrder: 2,
      baseEssence: 150,
      speedId: 'speed-ordinary',
      description: 'Городской стражник, следящий за порядком',
      personality: 'Серьёзный, дисциплинированный, справедливый',
      greeting: 'Стой! Кто идёт?',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-iron-ore', chance: 0.2, minQuantity: 1, maxQuantity: 2 }
      ])
    },
    {
      id: 'npc-merchant',
      name: 'Торговец',
      npcType: 'merchant',
      rankOrder: 1,
      baseEssence: 80,
      speedId: 'speed-slow',
      description: 'Торговец, путешествующий между городами',
      personality: 'Дружелюбный, расчётливый, разговорчивый',
      greeting: 'Добро пожаловать, путник! Что прикажешь?',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-gold-coin', chance: 0.5, minQuantity: 10, maxQuantity: 30 }
      ])
    },
    {
      id: 'npc-questgiver',
      name: 'Старик',
      npcType: 'questgiver',
      rankOrder: 3,
      baseEssence: 200,
      speedId: 'speed-ordinary',
      description: 'Мудрый старик, знающий много тайн',
      personality: 'Мудрый, загадочный, доброжелательный',
      greeting: 'Приветствую тебя, молодой искатель приключений',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-mana-crystal', chance: 0.3, minQuantity: 1, maxQuantity: 1 }
      ])
    },
    {
      id: 'npc-villager',
      name: 'Крестьянин',
      npcType: 'villager',
      rankOrder: 1,
      baseEssence: 60,
      speedId: 'speed-ordinary',
      description: 'Простой крестьянин, работающий на полях',
      personality: 'Простой, трудолюбивый, немного боязливый',
      greeting: 'Здравствуй, странник',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-bread', chance: 0.4, minQuantity: 1, maxQuantity: 3 }
      ])
    },
    {
      id: 'npc-mysterious',
      name: 'Таинственный незнакомец',
      npcType: 'mysterious',
      rankOrder: 4,
      baseEssence: 300,
      speedId: 'speed-very-fast',
      description: 'Загадочная фигура в тёмном плаще',
      personality: 'Таинственный, осторожный, непредсказуемый',
      greeting: '...',
      skills: JSON.stringify([]),
      lootTable: JSON.stringify([
        { templateId: 'mat-shadow-essence', chance: 0.6, minQuantity: 1, maxQuantity: 2 }
      ])
    }
  ];

  for (const n of npcTemplates) {
    await prisma.nPCTemplate.upsert({
      where: { id: n.id },
      update: n,
      create: n,
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

  // --- NPCs ---
  const npcs = [
    {
      id: 'npc-barkeep',
      name: 'Марвин',
      description: 'Хозяин таверны, толстый мужчина с усами и добрым взглядом.',
      personality: 'Дружелюбный, болтливый, любит сплетни',
      greeting: 'Эй, путник! Добро пожаловать в "Ржавый якорь"! Что будешь пить?',
      buildingId: 'build-rusty-anchor',
      npcType: 'merchant'
    },
    {
      id: 'npc-blacksmith',
      name: 'Гордин',
      description: 'Мускулистый кузнец с шрамами на руках и молотом на поясе.',
      personality: 'Прямой, грубоватый, но справедливый',
      greeting: 'Что тебе, путник? Оружие починить или новое ковать?',
      buildingId: 'build-blacksmith-shop',
      npcType: 'merchant'
    },
    {
      id: 'npc-alchemist',
      name: 'Элизия',
      description: 'Худая женщина с седыми волосами и внимательным взглядом.',
      personality: 'Загадочная, мудрая, немного странная',
      greeting: 'А... новый посетитель. Интересно, какие травы тебя привели?',
      buildingId: 'build-alchemy-lab',
      npcType: 'merchant'
    },
    {
      id: 'npc-guard',
      name: 'Стражник Альрик',
      description: 'Элитный страж в блестящих доспехах, с серьёзным выражением лица.',
      personality: 'Дисциплинированный, бдительный, немного высокомерный',
      greeting: 'Стой! Предъяви документы или цель визита.',
      buildingId: 'build-guard-post',
      npcType: 'guard'
    },
    {
      id: 'npc-merchant',
      name: 'Торговец Брам',
      description: 'Хитрый торговец с подсчитывающим взглядом.',
      personality: 'Хитрый, расчётливый, всегда торгуется',
      greeting: 'Ассортимент к твоим услугам, путник. Что ищешь?',
      buildingId: 'build-district-market',
      npcType: 'merchant'
    }
  ];

  for (const npc of npcs) {
    await prisma.nPC.upsert({
      where: { id: npc.id },
      update: npc,
      create: npc,
    });
  }
  console.log(`Seeded ${npcs.length} NPCs`);

  // --- NPC Monsters (must be after monsterTemplates) ---
  const npcMonsters = [
    {
      npcId: 'npc-barkeep',
      monsterId: 'mon-goblin-scout',
      essenceBonus: 20,
      protectionBonus: 10,
      accuracyBonus: 5,
      evasionBonus: 0,
      initiativeBonus: 0,
      description: 'Боевые характеристики для Марвин'
    },
    {
      npcId: 'npc-blacksmith',
      monsterId: 'mon-orc-scout',
      essenceBonus: 40,
      protectionBonus: 25,
      accuracyBonus: 8,
      evasionBonus: 2,
      initiativeBonus: 5,
      description: 'Боевые характеристики для Гордин'
    },
    {
      npcId: 'npc-alchemist',
      monsterId: 'mon-necromancer',
      essenceBonus: 30,
      protectionBonus: 15,
      accuracyBonus: 10,
      evasionBonus: 5,
      initiativeBonus: 8,
      description: 'Боевые характеристики для Элизия'
    },
    {
      npcId: 'npc-guard',
      monsterId: 'mon-orc',
      essenceBonus: 50,
      protectionBonus: 30,
      accuracyBonus: 10,
      evasionBonus: 5,
      initiativeBonus: 10,
      description: 'Боевые характеристики для Стражник Альрик'
    },
    {
      npcId: 'npc-merchant',
      monsterId: 'mon-bandit',
      essenceBonus: 20,
      protectionBonus: 10,
      accuracyBonus: 5,
      evasionBonus: 0,
      initiativeBonus: 0,
      description: 'Боевые характеристики для Торговец Брам'
    }
  ];

  for (const nm of npcMonsters) {
    await prisma.nPCMonster.upsert({
      where: { npcId: nm.npcId },
      update: nm,
      create: nm,
    });
  }
  console.log(`Seeded ${npcMonsters.length} NPC Monsters`);

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

  await prisma.professionRankThreshold.deleteMany({});
  await prisma.professionRankThreshold.createMany({ data: thresholds });

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
      key: 'SERVER_TIME_DATA',
      value: JSON.stringify({
        baseServerTime: 0,
        baseRealTime: Date.now(),
        multiplier: 1.0
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

  // --- Backfill NPC Combat Profiles ---
  console.log('Backfilling NPC combat profiles...');
  
  const DEFAULT_MONSTER_TEMPLATE_BY_NPC_TYPE: Record<string, string> = {
    guard: 'mon-goblin-warrior',
    merchant: 'mon-bandit',
    questgiver: 'mon-goblin-chief',
    villager: 'mon-bandit',
    mysterious: 'mon-vampire'
  };
  const DEFAULT_MONSTER_TEMPLATE = 'mon-bandit';

  const allNPCs = await prisma.nPC.findMany();
  
  let backfilledCount = 0;
  for (const npc of allNPCs) {
    const existingMonster = await prisma.nPCMonster.findUnique({
      where: { npcId: npc.id }
    });
    
    if (!existingMonster) {
      const monsterTemplateId = npc.npcType 
        ? (DEFAULT_MONSTER_TEMPLATE_BY_NPC_TYPE[npc.npcType] || DEFAULT_MONSTER_TEMPLATE)
        : DEFAULT_MONSTER_TEMPLATE;
      
      try {
        await prisma.nPCMonster.create({
          data: {
            npcId: npc.id,
            monsterId: monsterTemplateId,
            essenceBonus: 0,
            protectionBonus: 0,
            accuracyBonus: 0,
            evasionBonus: 0,
            initiativeBonus: 0
          }
        });
        
        backfilledCount++;
        console.log(`  Backfilled NPC: ${npc.name} (${npc.id})`);
      } catch (e) {
        console.error(`  Failed to backfill NPC: ${npc.name} (${npc.id})`, e);
      }
    }
  }
  
  console.log(`Backfilled ${backfilledCount} NPCs.`);
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

