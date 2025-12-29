// 📁 server/src/controllers/characterController.ts - Character controller
// 🎯 Core function: Handles character creation, listing, and deletion
// 🔗 Key dependencies: prisma
// 💡 Usage: Called by characterRoutes

import { Request, Response } from 'express';
import prisma from '../db';

export const getCharacters = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const characters = await prisma.character.findMany({
      where: { userId },
      include: { inventory: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // * Deserialize JSON strings back to objects for API response
    const charactersWithParsedJson = characters.map(char => ({
      ...char,
      stats: JSON.parse(char.stats),
      bonuses: JSON.parse(char.bonuses),
      professions: JSON.parse(char.professions),
      location: JSON.parse(char.location),
      inventory: char.inventory ? {
        ...char.inventory,
        items: JSON.parse(char.inventory.items)
      } : null
    }));
    
    res.json(charactersWithParsedJson);
  } catch (error) {
    console.error('Get characters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCharacter = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { name, raceId } = req.body;

    // Validation
    if (!name || name.length < 4) {
      return res.status(400).json({ error: 'Character name must be at least 4 characters' });
    }
    // Simple letters only check (English and Cyrillic)
    if (!/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(name)) {
      return res.status(400).json({ error: 'Character name must contain only letters' });
    }

    const count = await prisma.character.count({ where: { userId } });
    if (count >= 10) {
      return res.status(400).json({ error: 'Maximum 10 characters per account' });
    }

    const existingName = await prisma.character.findUnique({ where: { name } });
    if (existingName) {
      return res.status(400).json({ error: 'Character name already taken' });
    }

    // Fetch defaults from configuration
    const config = await prisma.gameConfig.findUnique({ where: { key: 'CHARACTER_CREATION_DEFAULTS' } });
    const defaults = config ? JSON.parse(config.value) : {
      rankId: 'rank-1',
      stats: {
        essence: { current: 50, max: 100 },
        energy: { current: 100, max: 100 },
        protection: { current: 20, max: 20 },
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
    };

    // * Serialize JSON objects to strings for SQLite
    const newCharacter = await prisma.character.create({
      data: {
        userId,
        name,
        raceId: raceId || 'race-human',
        rankId: defaults.rankId,
        stats: JSON.stringify(defaults.stats),
        bonuses: JSON.stringify(defaults.bonuses),
        professions: JSON.stringify(defaults.professions),
        location: JSON.stringify(defaults.location),
        money: defaults.money,
        inventory: {
          create: {
            baseSlots: defaults.inventory.baseSlots,
            items: JSON.stringify([]) // Start with empty inventory
          }
        }
      },
      include: { inventory: true }
    });

    res.status(201).json(newCharacter);
  } catch (error) {
    console.error('Create character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCharacter = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { id } = req.params;

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    await prisma.character.delete({ where: { id } });
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Delete character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCharacter = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { id } = req.params;
    const { stats, money, professions, location, bonuses } = req.body;

    // * Check ownership
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // * Validate and prepare update data
    const updateData: any = {};

    if (stats !== undefined) {
      // * Validate stats structure
      if (typeof stats !== 'object' || !stats.essence || !stats.energy || !stats.protection) {
        return res.status(400).json({ error: 'Invalid stats structure' });
      }
      // * Prevent cheating: ensure values are within reasonable bounds
      if (stats.essence.current < 0 || stats.essence.max < 0) {
        return res.status(400).json({ error: 'Essence cannot be negative' });
      }
      if (stats.energy.current < 0 || stats.energy.max < 0) {
        return res.status(400).json({ error: 'Energy cannot be negative' });
      }
      if (stats.protection.current < 0 || stats.protection.max < 0) {
        return res.status(400).json({ error: 'Protection cannot be negative' });
      }
      updateData.stats = JSON.stringify(stats);
    }

    if (money !== undefined) {
      // * Prevent negative money
      if (typeof money !== 'number' || money < 0) {
        return res.status(400).json({ error: 'Money cannot be negative' });
      }
      // * Prevent excessive money (anti-cheat: max 1 million)
      if (money > 1000000) {
        return res.status(400).json({ error: 'Money value too high' });
      }
      updateData.money = money;
    }

    if (professions !== undefined) {
      if (!Array.isArray(professions)) {
        return res.status(400).json({ error: 'Professions must be an array' });
      }
      // * Validate profession structure
      for (const prof of professions) {
        if (!prof.type || typeof prof.exp !== 'number' || typeof prof.rank !== 'number') {
          return res.status(400).json({ error: 'Invalid profession structure' });
        }
        if (prof.exp < 0 || prof.rank < 1 || prof.rank > 6) {
          return res.status(400).json({ error: 'Invalid profession values' });
        }
      }
      updateData.professions = JSON.stringify(professions);
    }

    if (location !== undefined) {
      if (typeof location !== 'object' || !location.locationId) {
        return res.status(400).json({ error: 'Invalid location structure' });
      }
      updateData.location = JSON.stringify(location);
    }

    if (bonuses !== undefined) {
      if (typeof bonuses !== 'object') {
        return res.status(400).json({ error: 'Bonuses must be an object' });
      }
      updateData.bonuses = JSON.stringify(bonuses);
    }

    // * Update character
    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: updateData,
      include: { inventory: true }
    });

    // * Deserialize JSON strings for response
    const response = {
      ...updatedCharacter,
      stats: JSON.parse(updatedCharacter.stats),
      bonuses: JSON.parse(updatedCharacter.bonuses),
      professions: JSON.parse(updatedCharacter.professions),
      location: JSON.parse(updatedCharacter.location),
      inventory: updatedCharacter.inventory ? {
        ...updatedCharacter.inventory,
        items: JSON.parse(updatedCharacter.inventory.items)
      } : null
    };

    res.json(response);
  } catch (error) {
    console.error('Update character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { id } = req.params;
    const { items, baseSlots } = req.body;

    // * Check ownership
    const character = await prisma.character.findUnique({ 
      where: { id },
      include: { inventory: true }
    });
    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // * Validate items
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    // * Validate each item structure
    for (const item of items) {
      if (!item.id || !item.templateId || typeof item.quantity !== 'number') {
        return res.status(400).json({ error: 'Invalid item structure' });
      }
      if (item.quantity < 0) {
        return res.status(400).json({ error: 'Item quantity cannot be negative' });
      }
      if (typeof item.currentEssence !== 'number' && item.currentEssence !== undefined) {
        return res.status(400).json({ error: 'Invalid currentEssence' });
      }
      if (typeof item.currentDurability !== 'number' && item.currentDurability !== undefined) {
        return res.status(400).json({ error: 'Invalid currentDurability' });
      }
    }

    // * Validate baseSlots if provided
    if (baseSlots !== undefined) {
      if (typeof baseSlots !== 'number' || baseSlots < 0) {
        return res.status(400).json({ error: 'Invalid baseSlots' });
      }
    }

    // * Update or create inventory
    const inventoryData: any = {
      items: JSON.stringify(items)
    };
    if (baseSlots !== undefined) {
      inventoryData.baseSlots = baseSlots;
    }

    let updatedInventory;
    if (character.inventory) {
      updatedInventory = await prisma.inventory.update({
        where: { characterId: id },
        data: inventoryData
      });
    } else {
      updatedInventory = await prisma.inventory.create({
        data: {
          characterId: id,
          baseSlots: baseSlots || 10,
          items: JSON.stringify(items)
        }
      });
    }

    // * Deserialize items for response
    const response = {
      ...updatedInventory,
      items: JSON.parse(updatedInventory.items)
    };

    res.json(response);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

