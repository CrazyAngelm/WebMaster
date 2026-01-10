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
    const characters = await (prisma as any).character.findMany({
      where: { userId },
      include: { 
        inventory: true,
        characterSkills: { include: { skillTemplate: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // * Deserialize JSON strings back to objects for API response
    const charactersWithParsedJson = characters.map((char: any) => {
      const charData = char as any;
      const skillsCount = charData.characterSkills?.length || 0;
      console.log(`✅ API Response: Character ${charData.name} has ${skillsCount} skills in characterSkills`);
      
      const result = {
        ...charData,
        stats: JSON.parse(charData.stats),
        bonuses: JSON.parse(charData.bonuses),
        professions: JSON.parse(charData.professions),
        location: JSON.parse(charData.location),
        activeQuests: JSON.parse(charData.activeQuests || '[]'),
        skills: JSON.parse(charData.skills || '[]'),
        inventory: charData.inventory ? {
          ...charData.inventory,
          items: JSON.parse(charData.inventory.items)
        } : null,
        activeSkills: charData.characterSkills || []
      };
      
      console.log(`📤 Sending activeSkills count: ${result.activeSkills.length}`);
      return result;
    });
    
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

    const count = await (prisma as any).character.count({ where: { userId } });
    if (count >= 10) {
      return res.status(400).json({ error: 'Maximum 10 characters per account' });
    }

    const existingName = await (prisma as any).character.findUnique({ where: { name } });
    if (existingName) {
      return res.status(400).json({ error: 'Character name already taken' });
    }

    // Fetch defaults from configuration
    const config = await (prisma as any).gameConfig.findUnique({ where: { key: 'CHARACTER_CREATION_DEFAULTS' } });
    const defaults = config ? JSON.parse(config.value) : {
      rankId: 'rank-1',
      stats: {
        essence: { current: 100, max: 100 },
        energy: { current: 100, max: 100 },
        protection: { current: 100, max: 100 },
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

    // * Get starter skills
    const starterSkills = await (prisma as any).skillTemplate.findMany({
      where: { isStarter: true }
    });

    // * Serialize JSON objects to strings for SQLite
    const newCharacter = await (prisma as any).character.create({
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
        activeQuests: JSON.stringify([]),
        inventory: {
          create: {
            baseSlots: defaults.inventory.baseSlots,
            items: JSON.stringify([]) // Start with empty inventory
          }
        },
        characterSkills: {
          create: starterSkills.map((skill: any) => ({
            skillTemplateId: skill.id,
            currentCooldown: 0,
            castTimeRemaining: null,
            isItemSkill: false,
            baseEssence: 0
          }))
        }
      } as any,
      include: { 
        inventory: true,
        characterSkills: { include: { skillTemplate: true } }
      } as any
    });

    // * Deserialize for response to keep frontend consistent
    const response = {
      ...newCharacter,
      stats: JSON.parse(newCharacter.stats),
      bonuses: JSON.parse(newCharacter.bonuses),
      professions: JSON.parse(newCharacter.professions),
      location: JSON.parse(newCharacter.location),
      activeQuests: JSON.parse((newCharacter as any).activeQuests || '[]'),
      skills: JSON.parse((newCharacter as any).skills || '[]'),
      inventory: (newCharacter as any).inventory ? {
        ...(newCharacter as any).inventory,
        items: JSON.parse((newCharacter as any).inventory.items)
      } : null,
      activeSkills: (newCharacter as any).characterSkills || []
    };

    res.status(201).json(response);
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

    const character = await (prisma as any).character.findUnique({ where: { id } });
    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    await (prisma as any).character.delete({ where: { id } });
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
    const { stats, money, professions, location, bonuses, activeQuests, lastTrainTime, lastRestTime, inventory } = req.body;

    console.log(`Updating character ${id}: Money=${money}, Items Count=${inventory?.items?.length || 0}`);

    // * Check ownership
    const character = await (prisma as any).character.findUnique({ 
      where: { id },
      include: { inventory: true }
    });
    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // * Validate and prepare update data
    const updateData: any = {};
    // * Store modified items array from character inventory for spell slot restoration merge
    let modifiedItemsFromCharacter: any[] | null = null;

    if (lastTrainTime !== undefined && lastTrainTime !== null) {
      if (typeof lastTrainTime !== 'number' || lastTrainTime < 0) {
        return res.status(400).json({ error: 'Invalid lastTrainTime' });
      }
      updateData.lastTrainTime = lastTrainTime;
    } else if (lastTrainTime === null) {
      updateData.lastTrainTime = null;
    }

    if (lastRestTime !== undefined && lastRestTime !== null) {
      if (typeof lastRestTime !== 'number' || lastRestTime < 0) {
        return res.status(400).json({ error: 'Invalid lastRestTime' });
      }
      updateData.lastRestTime = lastRestTime;
      
      // * Restore spell slots in magic stabilizers when resting
      if (character.inventory) {
        const items = JSON.parse(character.inventory.items);
        let updatedItems = false;
        
        for (const item of items) {
          if (item.isEquipped && item.spellSlots) {
            const template = await (prisma as any).itemTemplate.findUnique({ where: { id: item.templateId } });
            if (template && template.category === 'MAGIC_STABILIZER') {
              // * Restore all spell slots
              item.spellSlots.used = 0;
              updatedItems = true;
            }
          }
        }
        
        // * Store modified items array for potential merge with request body inventory
        if (updatedItems) {
          modifiedItemsFromCharacter = items;
          // * Update inventory with restored spell slots only if no request body inventory will overwrite it
          if (!updateData.inventory && (inventory === undefined || !inventory || !inventory.items)) {
            updateData.inventory = {
              update: {
                items: JSON.stringify(items),
                baseSlots: character.inventory.baseSlots || 10
              }
            };
          }
        }
      }
    } else if (lastRestTime === null) {
      updateData.lastRestTime = null;
    }

    if (activeQuests !== undefined) {
      if (!Array.isArray(activeQuests)) {
        return res.status(400).json({ error: 'activeQuests must be an array' });
      }
      updateData.activeQuests = JSON.stringify(activeQuests);
    }

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
      // * Allow higher cap to avoid false positives when large legitimate sums are processed
      const MONEY_CAP = 1000000000; // 1000M hard cap
      if (money > MONEY_CAP) {
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

    if (inventory !== undefined && inventory !== null) {
      if (typeof inventory === 'object' && Array.isArray(inventory.items)) {
        // * Validate each item structure
        for (const item of inventory.items) {
          if (!item.id || !item.templateId || typeof item.quantity !== 'number') {
            return res.status(400).json({ error: 'Invalid inventory item structure' });
          }
        }
        
        // * Start with request body inventory items
        const itemsToSave = [...inventory.items];
        
        // * Merge spell slot modifications from character inventory if available
        // * This preserves spell slot restoration made to locally-parsed items array
        if (modifiedItemsFromCharacter) {
          const modifiedItemsMap = new Map(modifiedItemsFromCharacter.map(item => [item.id, item]));
          for (const item of itemsToSave) {
            const modifiedItem = modifiedItemsMap.get(item.id);
            // * Merge spell slot modifications if item exists in modified character inventory
            if (modifiedItem && item.isEquipped && item.spellSlots && modifiedItem.spellSlots) {
              item.spellSlots = { ...modifiedItem.spellSlots };
            }
          }
        }
        
        // * Apply spell slot restoration if resting (lastRestTime was set) and not already merged
        if (lastRestTime !== undefined && lastRestTime !== null && !modifiedItemsFromCharacter) {
          for (const item of itemsToSave) {
            if (item.isEquipped && item.spellSlots) {
              const template = await (prisma as any).itemTemplate.findUnique({ where: { id: item.templateId } });
              if (template && template.category === 'MAGIC_STABILIZER') {
                // * Restore all spell slots
                item.spellSlots.used = 0;
              }
            }
          }
        }
        
        updateData.inventory = {
          update: {
            items: JSON.stringify(itemsToSave),
            baseSlots: inventory.baseSlots || 10
          }
        };
      }
    }

    // * Update character
    const updatedCharacter = await (prisma as any).character.update({
      where: { id },
      data: updateData,
      include: { 
        inventory: true,
        characterSkills: { include: { skillTemplate: true } }
      } as any
    });

    console.log(`Character ${id} updated. Money in DB: ${updatedCharacter.money}`);
    const inventoryData = (updatedCharacter as any).inventory;
    if (inventoryData) {
      const items = JSON.parse(inventoryData.items);
      console.log(`Inventory in DB has ${items.length} items`);
    }

    // * Deserialize JSON strings for response
    const response = {
      ...updatedCharacter,
      stats: JSON.parse(updatedCharacter.stats),
      bonuses: JSON.parse(updatedCharacter.bonuses),
      professions: JSON.parse(updatedCharacter.professions),
      location: JSON.parse(updatedCharacter.location),
      activeQuests: JSON.parse((updatedCharacter as any).activeQuests || '[]'),
      skills: JSON.parse((updatedCharacter as any).skills || '[]'),
      inventory: (updatedCharacter as any).inventory ? {
        ...(updatedCharacter as any).inventory,
        items: JSON.parse((updatedCharacter as any).inventory.items)
      } : null,
      activeSkills: (updatedCharacter as any).characterSkills || []
    };

    res.json(response);
  } catch (error) {
    console.error('Update character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const tickSkillCooldowns = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const { id } = req.params;

    // * Check ownership
    const character = await (prisma as any).character.findUnique({ 
      where: { id },
      include: { characterSkills: true }
    } as any);
    
    if (!character || character.userId !== userId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // * Decrement all cooldowns by 1 (minimum 0)
    const skills = (character as any).characterSkills || [];
    for (const skill of skills) {
      if (skill.currentCooldown > 0) {
        await (prisma as any).characterSkill.update({
          where: { id: skill.id },
          data: { currentCooldown: skill.currentCooldown - 1 }
        });
      }
    }

    // * Fetch updated character with skills
    const updatedCharacter = await (prisma as any).character.findUnique({
      where: { id },
      include: { 
        inventory: true,
        characterSkills: { include: { skillTemplate: true } }
      } as any
    });

    // * Deserialize for response
    const response = {
      ...updatedCharacter,
      stats: JSON.parse(updatedCharacter!.stats),
      bonuses: JSON.parse(updatedCharacter!.bonuses),
      professions: JSON.parse(updatedCharacter!.professions),
      location: JSON.parse(updatedCharacter!.location),
      activeQuests: JSON.parse((updatedCharacter as any).activeQuests || '[]'),
      skills: JSON.parse((updatedCharacter as any).skills || '[]'),
      inventory: (updatedCharacter as any).inventory ? {
        ...(updatedCharacter as any).inventory,
        items: JSON.parse((updatedCharacter as any).inventory.items)
      } : null,
      activeSkills: (updatedCharacter as any).characterSkills || []
    };

    res.json(response);
  } catch (error) {
    console.error('Tick cooldowns error:', error);
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
    const character = await (prisma as any).character.findUnique({ 
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
      updatedInventory = await (prisma as any).inventory.update({
        where: { characterId: id },
        data: inventoryData
      });
    } else {
      updatedInventory = await (prisma as any).inventory.create({
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
