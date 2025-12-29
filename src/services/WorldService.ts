// 📁 src/services/WorldService.ts - Movement and world logic
// 🎯 Core function: Handles player movement between locations and buildings
// 🔗 Key dependencies: src/types/game.ts, src/services/StaticDataService.ts
// 💡 Usage: Called by GameStore actions

import { Character, Location, UUID } from '../types/game';
import { StaticDataService } from './StaticDataService';

export const WorldService = {
  /**
   * * Checks if a character can move from their current location to a target location
   */
  canMoveTo(character: Character, targetLocationId: UUID): { allowed: boolean; reason?: string; energyCost?: number; timeCost?: number } {
    const currentLocId = character.location.locationId;
    
    if (currentLocId === targetLocationId) {
      return { allowed: false, reason: "You are already there." };
    }

    const config = StaticDataService.getConfig<{ energyCostPerMove: number; hoursPerMove: number }>('MOVEMENT_CONFIG');
    const ENERGY_COST = config?.energyCostPerMove || 10;
    const TIME_COST = config?.hoursPerMove || 1; // 1 hour per movement

    if (character.stats.energy.current < ENERGY_COST) {
      return { allowed: false, reason: "You are too tired to travel. Rest first." };
    }

    const connections = StaticDataService.getConnections(currentLocId);
    const isConnected = connections.some(c => c.toLocationId === targetLocationId);

    if (!isConnected) {
      return { allowed: false, reason: "There is no direct path to that location." };
    }

    const targetLoc = StaticDataService.getLocation(targetLocationId);
    if (!targetLoc) {
      return { allowed: false, reason: "Target location does not exist." };
    }

    return { allowed: true, energyCost: ENERGY_COST, timeCost: TIME_COST };
  },

  /**
   * * Updates character's location state
   */
  moveCharacter(character: Character, targetLocationId: UUID, energyCost: number = 0): Character {
    return {
      ...character,
      stats: {
        ...character.stats,
        essence: { ...character.stats.essence },
        energy: {
          ...character.stats.energy,
          current: Math.max(0, character.stats.energy.current - energyCost)
        },
        protection: { ...character.stats.protection }
      },
      location: {
        ...character.location,
        locationId: targetLocationId,
        buildingId: undefined, 
        position: 'Center'
      }
    };
  },

  /**
   * * Enters a building in the current location
   */
  enterBuilding(character: Character, buildingId: UUID): { allowed: boolean; character?: Character; reason?: string } {
    const building = StaticDataService.getBuilding(buildingId);
    
    if (!building) {
      return { allowed: false, reason: "Building not found." };
    }

    if (building.locationId !== character.location.locationId) {
      return { allowed: false, reason: "Building is not in your current location." };
    }

    const updatedCharacter = {
      ...character,
      location: {
        ...character.location,
        buildingId: buildingId
      }
    };

    return { allowed: true, character: updatedCharacter };
  },

  /**
   * * Exits the current building
   */
  exitBuilding(character: Character): Character {
    return {
      ...character,
      location: {
        ...character.location,
        buildingId: undefined
      }
    };
  }
};



