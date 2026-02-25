// 📁 server/src/controllers/npcController.ts
// 🎯 Core function: Handles NPC CRUD operations
// 🔗 Key dependencies: Prisma, express
// 💡 Usage: API for static NPCs

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_MONSTER_TEMPLATE_BY_NPC_TYPE: Record<string, string> = {
  guard: 'mon-goblin-warrior',
  merchant: 'mon-bandit',
  questgiver: 'mon-goblin-chief',
  villager: 'mon-bandit',
  mysterious: 'mon-vampire'
};

const DEFAULT_MONSTER_TEMPLATE = 'mon-bandit';

function getMonsterTemplateForNpcType(npcType?: string): string {
  if (!npcType) return DEFAULT_MONSTER_TEMPLATE;
  return DEFAULT_MONSTER_TEMPLATE_BY_NPC_TYPE[npcType] || DEFAULT_MONSTER_TEMPLATE;
}

export const getNPCByBuilding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { buildingId } = req.params;

    const npc = await prisma.nPC.findFirst({
      where: { buildingId }
    });

    if (!npc) {
      res.status(404).json({ error: 'NPC not found for this building' });
      return;
    }

    const npcMonster = await prisma.nPCMonster.findUnique({ where: { npcId: npc.id } });
    if (!npcMonster) {
      res.status(409).json({ error: 'NPC combat profile missing' });
      return;
    }
    res.json({ ...npc, npcMonster });
  } catch (error) {
    console.error('Error fetching NPC:', error);
    res.status(500).json({ error: 'Failed to fetch NPC' });
  }
};

export const getNPCByLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { locationId } = req.params;

    const npc = await prisma.nPC.findFirst({
      where: { locationId }
    });

    if (!npc) {
      res.status(404).json({ error: 'NPC not found for this location' });
      return;
    }

    const npcMonster = await prisma.nPCMonster.findUnique({ where: { npcId: npc.id } });
    if (!npcMonster) {
      res.status(409).json({ error: 'NPC combat profile missing' });
      return;
    }
    res.json({ ...npc, npcMonster });
  } catch (error) {
    console.error('Error fetching NPC:', error);
    res.status(500).json({ error: 'Failed to fetch NPC' });
  }
};

export const getAllNPCs = async (req: Request, res: Response): Promise<void> => {
  try {
    const npcs = await prisma.nPC.findMany();
    res.json(npcs);
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    res.status(500).json({ error: 'Failed to fetch NPCs' });
  }
};

export const createNPC = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, personality, greeting, buildingId, locationId, npcType } = req.body;

    const monsterTemplateId = getMonsterTemplateForNpcType(npcType);

    const monsterTemplate = await prisma.monsterTemplate.findUnique({
      where: { id: monsterTemplateId }
    });

    if (!monsterTemplate) {
      res.status(500).json({ error: 'Monster template not found for NPC combat profile' });
      return;
    }

    const { npc, npcMonster } = await prisma.$transaction(async (tx) => {
      const createdNpc = await tx.nPC.create({
        data: {
          name,
          description,
          personality,
          greeting,
          buildingId,
          locationId,
          npcType
        }
      });

      const createdNpcMonster = await tx.nPCMonster.create({
        data: {
          npcId: createdNpc.id,
          monsterId: monsterTemplateId,
          essenceBonus: 0,
          protectionBonus: 0,
          accuracyBonus: 0,
          evasionBonus: 0,
          initiativeBonus: 0
        }
      });

      return { npc: createdNpc, npcMonster: createdNpcMonster };
    });

    res.json({ ...npc, npcMonster });
  } catch (error) {
    console.error('Error creating NPC:', error);
    res.status(500).json({ error: 'Failed to create NPC' });
  }
};

export const updateNPC = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, personality, greeting, npcType } = req.body;

    const existingNpc = await prisma.nPC.findUnique({
      where: { id }
    });

    if (!existingNpc) {
      res.status(404).json({ error: 'NPC not found' });
      return;
    }

    const npcTypeChanged = npcType && npcType !== existingNpc.npcType;

    const npc = await prisma.nPC.update({
      where: { id },
      data: {
        name,
        description,
        personality,
        greeting,
        npcType
      }
    });

    const existingMonsterProfile = await prisma.nPCMonster.findUnique({ where: { npcId: npc.id } });
    const resolvedNpcType = npc.npcType || existingNpc.npcType;
    const targetMonsterTemplateId = npcTypeChanged
      ? getMonsterTemplateForNpcType(resolvedNpcType)
      : (existingMonsterProfile?.monsterId || getMonsterTemplateForNpcType(resolvedNpcType));
    const targetMonsterTemplate = await prisma.monsterTemplate.findUnique({
      where: { id: targetMonsterTemplateId }
    });
    if (!targetMonsterTemplate) {
      res.status(500).json({ error: 'Monster template not found for NPC combat profile' });
      return;
    }

    await prisma.nPCMonster.upsert({
      where: { npcId: npc.id },
      update: npcTypeChanged ? { monsterId: targetMonsterTemplateId } : {},
      create: {
        npcId: npc.id,
        monsterId: targetMonsterTemplateId,
        essenceBonus: 0,
        protectionBonus: 0,
        accuracyBonus: 0,
        evasionBonus: 0,
        initiativeBonus: 0
      }
    });

    const refreshedNpcMonster = await prisma.nPCMonster.findUnique({ where: { npcId: npc.id } });
    res.json({ ...npc, npcMonster: refreshedNpcMonster });
  } catch (error) {
    console.error('Error updating NPC:', error);
    res.status(500).json({ error: 'Failed to update NPC' });
  }
};

export const deleteNPC = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.nPC.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting NPC:', error);
    res.status(500).json({ error: 'Failed to delete NPC' });
  }
};
