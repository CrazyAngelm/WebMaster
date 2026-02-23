// 📁 server/src/controllers/npcController.ts
// 🎯 Core function: Handles NPC CRUD operations
// 🔗 Key dependencies: Prisma, express
// 💡 Usage: API for static NPCs

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    res.json(npc);
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

    res.json(npc);
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

    const npc = await prisma.nPC.create({
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

    res.json(npc);
  } catch (error) {
    console.error('Error creating NPC:', error);
    res.status(500).json({ error: 'Failed to create NPC' });
  }
};

export const updateNPC = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, personality, greeting, npcType } = req.body;

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

    res.json(npc);
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
