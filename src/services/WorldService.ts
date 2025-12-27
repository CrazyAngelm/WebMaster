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
  canMoveTo(character: Character, targetLocationId: UUID): { allowed: boolean; reason?: string } {
    const currentLocId = character.location.locationId;
    
    if (currentLocId === targetLocationId) {
      return { allowed: false, reason: "You are already there." };
    }

    const connections = StaticDataService.getConnections(currentLocId);
    const isConnected = connections.some(c => c.toLocationId === targetLocationId);

    if (!isConnected) {
      return { allowed: false, reason: "There is no direct path to that location." };
    }

    // You can add more complex rules here (e.g., rank requirements, item requirements)
    const targetLoc = StaticDataService.getLocation(targetLocationId);
    if (!targetLoc) {
      return { allowed: false, reason: "Target location does not exist." };
    }

    return { allowed: true };
  },

  /**
   * * Updates character's location state
   */
  moveCharacter(character: Character, targetLocationId: UUID): Character {
    return {
      ...character,
      location: {
        ...character.location,
        locationId: targetLocationId,
        buildingId: undefined, // Always exit building when moving to a new location
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



