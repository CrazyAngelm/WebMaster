// 📁 server/prisma/seed-skills.ts - Seed basic combat skills
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
