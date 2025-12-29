import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStaticBundle = async (req: Request, res: Response) => {
  try {
    const [
      races,
      ranks,
      itemTemplates,
      recipes,
      monsterTemplates,
      quests,
      locations,
      buildings,
      connections,
      professionThresholds,
      speeds,
      events,
      gameConfigs
    ] = await Promise.all([
      prisma.race.findMany(),
      prisma.rank.findMany({ orderBy: { order: 'asc' } }),
      prisma.itemTemplate.findMany(),
      prisma.recipe.findMany(),
      prisma.monsterTemplate.findMany(),
      prisma.quest.findMany(),
      prisma.location.findMany(),
      prisma.building.findMany(),
      prisma.locationConnection.findMany(),
      prisma.professionRankThreshold.findMany({ orderBy: { rank: 'asc' } }),
      prisma.speed.findMany(),
      prisma.gameEvent.findMany(),
      prisma.gameConfig.findMany()
    ]);

    // Parse JSON strings back to objects
    const result = {
      races: races.map(r => ({
        ...r,
        innateSkills: JSON.parse(r.innateSkills),
        passiveEffects: JSON.parse(r.passiveEffects)
      })),
      ranks: ranks.map(r => ({
        ...r,
        breakthroughConditions: JSON.parse(r.breakthroughConditions)
      })),
      itemTemplates: itemTemplates.map(t => ({
        ...t,
        effects: t.effects ? JSON.parse(t.effects) : undefined
      })),
      recipes: recipes.map(r => ({
        ...r,
        ingredients: JSON.parse(r.ingredients)
      })),
      monsterTemplates: monsterTemplates.map(m => ({
        ...m,
        skills: JSON.parse(m.skills),
        lootTable: JSON.parse(m.lootTable)
      })),
      quests: quests.map(q => ({
        ...q,
        objectives: JSON.parse(q.objectives),
        rewards: JSON.parse(q.rewards)
      })),
      locations: locations.map(l => ({
        ...l,
        buildings: JSON.parse(l.buildings)
      })),
      buildings: buildings.map(b => ({
        ...b,
        workstations: JSON.parse(b.workstations)
      })),
      connections,
      professionThresholds,
      speeds,
      events: events.map(e => ({
        ...e,
        choices: e.choices ? JSON.parse(e.choices) : undefined
      })),
      configs: gameConfigs.reduce((acc: any, config: { key: string; value: string }) => {
        acc[config.key] = JSON.parse(config.value);
        return acc;
      }, {})
    };

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch static bundle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

