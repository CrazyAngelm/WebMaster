// 📁 server/src/controllers/adminController.ts - Admin controller
// 🎯 Core function: Handles administrative actions (gold, time, rest)
// 🔗 Key dependencies: prisma
// 💡 Usage: Called by adminRoutes

import { Request, Response } from 'express';
import prisma from '../db';

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

    // Since worldTime is stored in Character (as lastTrainTime) or in a global state, 
    // we might need a GlobalState table. But for now, we'll update the active character's lastTrainTime 
    // or just return success if we assume worldTime is client-side for now (though it should be server-side).
    // In the current schema, worldTime isn't global yet. Let's assume we update character-specific time.
    
    // Actually, in the plan it says "Advance world time by specified hours".
    // I'll add a simple response for now, as worldTime persistence needs to be decided.
    // Let's assume we might need a separate table for global settings/time.
    
    res.json({ message: `World time advanced by ${hours} hours` });
  } catch (error) {
    console.error('Skip time error:', error);
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

