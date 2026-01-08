// 📁 server/prisma/seed-effects.ts - Seed basic combat effects
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const effects = [
    {
      id: 'effect-poison',
      name: 'Яд',
      type: 'PERIODIC_DAMAGE',
      duration: 3,
      value: 10,
      parameter: null,
      isNegative: true,
      description: 'Наносит 10 урона каждый ход.'
    },
    {
      id: 'effect-regen',
      name: 'Регенерация',
      type: 'PERIODIC_HEAL',
      duration: 5,
      value: 15,
      parameter: null,
      isNegative: false,
      description: 'Восстанавливает 15 HP каждый ход.'
    },
    {
      id: 'effect-stun',
      name: 'Оглушение',
      type: 'STUN',
      duration: 1,
      value: 0,
      parameter: null,
      isNegative: true,
      description: 'Пропуск следующего хода.'
    },
    {
      id: 'effect-accuracy-buff',
      name: 'Точность',
      type: 'BUFF',
      duration: 5,
      value: 50,
      parameter: 'accuracy',
      isNegative: false,
      description: 'Повышает точность на 50.'
    }
  ];

  for (const effect of effects) {
    await prisma.effectTemplate.upsert({
      where: { id: effect.id },
      update: effect,
      create: effect,
    });
  }

  console.log('Basic effects seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
