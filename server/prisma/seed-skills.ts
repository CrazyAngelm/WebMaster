// 📁 server/prisma/seed-skills.ts - Seed basic combat skills
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSkills() {
  const skills = [
    {
      id: 'skill-fire-bolt',
      name: 'Огненный заряд',
      description: 'Выпускает огненный заряд, наносящий урон со временем.',
      rarity: 'COMMON',
      castTime: 0,
      cooldown: 3,
      targetType: 'TARGET',
      distance: JSON.stringify({ minRange: 5, maxRange: 20 }),
      penetration: 'LIGHT',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-burn']),
      isCombat: true,
      isStarter: true
    },
    {
      id: 'skill-heal',
      name: 'Лечение',
      description: 'Восстанавливает здоровье со временем.',
      rarity: 'COMMON',
      castTime: 0,
      cooldown: 2,
      targetType: 'SELF',
      distance: null,
      penetration: null,
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-regen']), // Using regen effect for HoT
      isCombat: true,
      isStarter: true
    },
    {
      id: 'skill-power-strike',
      name: 'Мощный удар',
      description: 'Наносит урон и оглушение противнику.',
      rarity: 'COMMON',
      castTime: 0,
      cooldown: 4,
      targetType: 'TARGET',
      distance: JSON.stringify({ minRange: 0, maxRange: 5 }),
      penetration: 'MEDIUM',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-stun']),
      isCombat: true,
      isStarter: true
    },
    {
      id: 'skill-blessing',
      name: 'Благословение',
      description: 'Повышает точность атаки.',
      rarity: 'COMMON',
      castTime: 0,
      cooldown: 3,
      targetType: 'SELF',
      distance: null,
      penetration: null,
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-accuracy-buff']),
      isCombat: true,
      isStarter: true
    },
    // --- MONSTER SKILLS ---
    {
      id: 'skill-monster-bite',
      name: 'Укус',
      description: 'Монстр кусает цель, нанося урон и вызывая кровотечение.',
      rarity: 'COMMON',
      castTime: 0,
      cooldown: 2,
      targetType: 'TARGET',
      distance: JSON.stringify({ minRange: 0, maxRange: 5 }),
      penetration: 'MEDIUM',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-bleed']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-claw',
      name: 'Когти',
      description: 'Монстр царапает цель когтями, нанося двойной урон.',
      rarity: 'COMMON',
      castTime: 0,
      cooldown: 3,
      targetType: 'TARGET',
      distance: JSON.stringify({ minRange: 0, maxRange: 5 }),
      penetration: 'LIGHT',
      alwaysPenetrates: false,
      effects: JSON.stringify([]),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-charge',
      name: 'Таран',
      description: 'Монстр совершает стремительную атаку, оглушая цель.',
      rarity: 'RARE',
      castTime: 0,
      cooldown: 4,
      targetType: 'TARGET',
      distance: JSON.stringify({ minRange: 5, maxRange: 15 }),
      penetration: 'HEAVY',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-stun']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-rage',
      name: 'Ярость',
      description: 'Монстр впадает в ярость, увеличивая свой урон.',
      rarity: 'RARE',
      castTime: 0,
      cooldown: 5,
      targetType: 'SELF',
      distance: null,
      penetration: null,
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-damage-buff']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-regeneration',
      name: 'Регенерация',
      description: 'Монстр восстанавливает здоровье.',
      rarity: 'RARE',
      castTime: 0,
      cooldown: 4,
      targetType: 'SELF',
      distance: null,
      penetration: null,
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-regen']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-shield',
      name: 'Щит',
      description: 'Монстрит создаёт защитный барьер.',
      rarity: 'RARE',
      castTime: 0,
      cooldown: 4,
      targetType: 'SELF',
      distance: null,
      penetration: null,
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-protection-buff']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-fear',
      name: 'Страх',
      description: 'Монстр вселяет ужас во врагов, снижая их характеристики.',
      rarity: 'EPIC',
      castTime: 0,
      cooldown: 5,
      targetType: 'AREA',
      distance: JSON.stringify({ minRange: 0, maxRange: 15 }),
      penetration: 'NONE',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-fear']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-fire-breath',
      name: 'Огненное дыхание',
      description: 'Монстр выпускает поток огня, нанося урон огнём всем целям в области.',
      rarity: 'EPIC',
      castTime: 0,
      cooldown: 4,
      targetType: 'AREA',
      distance: JSON.stringify({ minRange: 5, maxRange: 20 }),
      penetration: 'MEDIUM',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-burn']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-ice-breath',
      name: 'Ледяное дыхание',
      description: 'Монстр выпускает поток льда, нанося урон холодом.',
      rarity: 'EPIC',
      castTime: 0,
      cooldown: 4,
      targetType: 'AREA',
      distance: JSON.stringify({ minRange: 5, maxRange: 20 }),
      penetration: 'MEDIUM',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-freeze']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-poison-sting',
      name: 'Ядовитое жало',
      description: 'Монстр жалит цель, отравляя её.',
      rarity: 'RARE',
      castTime: 0,
      cooldown: 3,
      targetType: 'TARGET',
      distance: JSON.stringify({ minRange: 0, maxRange: 5 }),
      penetration: 'LIGHT',
      alwaysPenetrates: false,
      effects: JSON.stringify(['effect-poison']),
      isCombat: true,
      isStarter: false
    },
    {
      id: 'skill-monster-summon',
      name: 'Призыв',
      description: 'Монстр призывает помощников.',
      rarity: 'MYTHIC',
      castTime: 2,
      cooldown: 6,
      targetType: 'SELF',
      distance: null,
      penetration: null,
      alwaysPenetrates: false,
      effects: JSON.stringify([]),
      isCombat: true,
      isStarter: false
    }
  ];

  for (const skill of skills) {
    await prisma.skillTemplate.upsert({
      where: { id: skill.id },
      update: skill,
      create: skill,
    });
  }

  console.log('Basic skills seeded!');
}

export { seedSkills };
