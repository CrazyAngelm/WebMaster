// 📁 src/services/AIService.ts - AI Service Interface
// 🎯 Core function: Define the contract for LLM (AI) integration
// 🔗 Key dependencies: src/types/ai.ts
// 💡 Usage: Implemented by MockAIService or DeepSeekAIService

import { Character, Location, UUID } from '../types/game';
import { 
  ConversationMessage, 
  NPCResponse, 
  QuestSuggestion, 
  NPCData, 
  GeneratedQuest 
} from '../types/ai';

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
    npcData: NPCData,
    playerMessage: string,
    context: GameContext,
    conversationHistory: ConversationMessage[]
  ): Promise<NPCResponse>;

  /**
   * Generates a descriptive narrative for a situation or location.
   */
  describeSituation(
    context: GameContext
  ): Promise<string>;

  /**
   * Generates a quest based on current context.
   */
  generateQuest(
    context: GameContext
  ): Promise<QuestSuggestion | null>;

  /**
   * Generates NPC data for a location.
   */
  generateNPC(
    location: Location,
    npcType?: NPCData['npcType']
  ): Promise<NPCData>;

  /**
   * Check if the service is available (real API vs mock)
   */
  isAvailable(): boolean;

  /**
   * Set authentication token for API calls
   */
  setAuthToken(token: string): void;
}
