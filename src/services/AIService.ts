// 📁 src/services/AIService.ts - AI Service Interface
// 🎯 Core function: Define the contract for LLM (AI) integration
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Implemented by MockAIService or real LLM providers

import { Character, Location, UUID } from '../types/game';

export interface GameContext {
  character: Character;
  location: Location;
  currentEventId?: UUID;
  worldState?: Record<string, any>;
}

export interface AIService {
  /**
   * Generates an NPC response to a player message.
   */
  generateResponse(
    npcName: string,
    playerMessage: string,
    context: GameContext
  ): Promise<string>;

  /**
   * Generates a descriptive narrative for a situation or location.
   */
  describeSituation(
    context: GameContext
  ): Promise<string>;

  /**
   * Generates a random quest idea based on current context.
   */
  generateQuestIdea(
    context: GameContext
  ): Promise<{ title: string; description: string }>;
}
