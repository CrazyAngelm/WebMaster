// 📁 server/src/controllers/adminController.ts - Admin controller
// 🎯 Core function: Handles administrative actions (gold, time, rest)
// 🔗 Key dependencies: prisma
// 💡 Usage: Called by adminRoutes

import { Request, Response } from 'express';
import prisma from '../db';
import { TimeService } from '../utils/timeService';

export const addGold = async (req: Request, res: Response) => {
  try {
    const { characterId, amount } = req.body;
    if (!characterId || typeof amount !== 'number') {
      return res.status(400).json({ error: 'characterId and numeric amount are required' });
    }

    const character = await prisma.character.update({
      where: { id: characterId },
      data: { money: { increment: amount } }
    });

    res.json({ message: `Added ${amount} gold to ${character.name}`, money: character.money });
  } catch (error) {
    console.error('Add gold error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const skipTime = async (req: Request, res: Response) => {
  try {
    const { hours } = req.body;
    if (typeof hours !== 'number') {
      return res.status(400).json({ error: 'Numeric hours are required' });
    }

    await TimeService.skipTime(hours);
    
    res.json({ 
      message: `World time advanced by ${hours} hours`,
      timeData: await TimeService.getTimeMetadata()
    });
  } catch (error) {
    console.error('Skip time error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setTimeMultiplier = async (req: Request, res: Response) => {
  try {
    const { multiplier } = req.body;
    if (typeof multiplier !== 'number' || multiplier <= 0) {
      return res.status(400).json({ error: 'Positive numeric multiplier is required' });
    }

    await TimeService.setMultiplier(multiplier);
    
    res.json({ 
      message: `Time multiplier set to ${multiplier}`,
      timeData: await TimeService.getTimeMetadata()
    });
  } catch (error) {
    console.error('Set multiplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forceRest = async (req: Request, res: Response) => {
  try {
    const { characterId } = req.body;
    if (!characterId) {
      return res.status(400).json({ error: 'characterId is required' });
    }

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // * Parse JSON string to object, update, then serialize back
    const stats = JSON.parse(character.stats);
    const updatedStats = {
      ...stats,
      essence: { ...stats.essence, current: stats.essence.max },
      energy: { ...stats.energy, current: stats.energy.max },
      protection: { ...stats.protection, current: stats.protection.max }
    };

    await prisma.character.update({
      where: { id: characterId },
      data: { stats: JSON.stringify(updatedStats) }
    });

    res.json({ message: `Character ${character.name} has been fully restored` });
  } catch (error) {
    console.error('Force rest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

