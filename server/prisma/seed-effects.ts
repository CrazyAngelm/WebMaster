// 📁 server/prisma/seed-effects.ts - Seed basic combat effects
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEffects() {
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
    },
    {
      id: 'effect-burn',
      name: 'Горение',
      type: 'PERIODIC_DAMAGE',
      duration: 3,
      value: 15,
      parameter: null,
      isNegative: true,
      description: 'Наносит 15 магического урона каждый ход.'
    },
    {
      id: 'effect-small-heal',
      name: 'Малое исцеление',
      type: 'PERIODIC_HEAL',
      duration: 1,
      value: 30,
      parameter: null,
      isNegative: false,
      description: 'Мгновенно восстанавливает 30 HP.'
    },
    // --- MONSTER EFFECTS ---
    {
      id: 'effect-bleed',
      name: 'Кровотечение',
      type: 'PERIODIC_DAMAGE',
      duration: 3,
      value: 8,
      parameter: null,
      isNegative: true,
      description: 'Наносит 8 урона каждый ход от кровотечения.'
    },
    {
      id: 'effect-damage-buff',
      name: 'Ярость',
      type: 'BUFF',
      duration: 3,
      value: 30,
      parameter: 'damage',
      isNegative: false,
      description: 'Увеличивает урон на 30.'
    },
    {
      id: 'effect-protection-buff',
      name: 'Щит',
      type: 'BUFF',
      duration: 2,
      value: 50,
      parameter: 'protection',
      isNegative: false,
      description: 'Увеличивает защиту на 50.'
    },
    {
      id: 'effect-fear',
      name: 'Страх',
      type: 'DEBUFF',
      duration: 2,
      value: -30,
      parameter: 'evasion',
      isNegative: true,
      description: 'Снижает уклонение на 30 и точность на 20.'
    },
    {
      id: 'effect-freeze',
      name: 'Заморозка',
      type: 'PERIODIC_DAMAGE',
      duration: 2,
      value: 12,
      parameter: 'ice',
      isNegative: true,
      description: 'Наносит 12 урона холодом каждый ход.'
    },
    {
      id: 'effect-medium-heal',
      name: 'Среднее исцеление',
      type: 'PERIODIC_HEAL',
      duration: 1,
      value: 50,
      parameter: null,
      isNegative: false,
      description: 'Мгновенно восстанавливает 50 HP.'
    },
    {
      id: 'effect-large-heal',
      name: 'Большое исцеление',
      type: 'PERIODIC_HEAL',
      duration: 1,
      value: 100,
      parameter: null,
      isNegative: false,
      description: 'Мгновенно восстанавливает 100 HP.'
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

export { seedEffects };
