// 📁 src/services/EventService.ts - Random encounters and story triggers
// 🎯 Core function: Determines when events trigger and processes outcomes
// 🔗 Key dependencies: src/types/game.ts, src/services/StaticDataService.ts
// 💡 Usage: Called during movement or exploration

import { Character, GameEvent, UUID } from '../types/game';
import { StaticDataService } from './StaticDataService';

export const EventService = {
  /**
   * * Roll for a random event during travel
   */
  rollForTravelEvent(): GameEvent | null {
    const config = StaticDataService.getConfig<{ travelEventChance: number }>('EVENT_CONFIG');
    const chance = Math.random();
    if (chance < (config?.travelEventChance || 0.2)) { // 20% chance of an event
      const allEvents = StaticDataService.getAllEvents();
      const randomIndex = Math.floor(Math.random() * allEvents.length);
      return allEvents[randomIndex];
    }
    return null;
  },

  /**
   * * Processes the outcome of a choice in an event
   */
  processChoice(
    character: Character, 
    choiceId: UUID
  ): { character: Character; nextEventId?: UUID; message?: string } {
    // This would typically involve a look-up table or hardcoded logic for specific choice IDs
    // For now, let's mock some logic
    const updatedCharacter = { ...character };
    let message = "";

    if (choiceId === 'choice-buy-fruit') {
      if (updatedCharacter.money >= 10) {
        updatedCharacter.money -= 10;
        updatedCharacter.stats.essence.current = Math.min(
          updatedCharacter.stats.essence.max, 
          updatedCharacter.stats.essence.current + 5
        );
        message = "The fruit tastes like pure essence. You feel refreshed!";
      } else {
        message = "You don't have enough coins. The traveler sighs and leaves.";
      }
    }

    if (choiceId === 'choice-meditate') {
      const ENERGY_COST = 30;
      if (updatedCharacter.stats.energy.current >= ENERGY_COST) {
        updatedCharacter.stats.energy.current -= ENERGY_COST;
        const gain = 10;
        updatedCharacter.stats.essence.current = Math.min(
          updatedCharacter.stats.essence.max,
          updatedCharacter.stats.essence.current + gain
        );
        message = "You meditate and feel your inner essence stabilize. (Essence +10, Energy -30)";
      } else {
        message = "You are too exhausted to meditate effectively.";
      }
    }

    return { character: updatedCharacter, message };
  }
};



