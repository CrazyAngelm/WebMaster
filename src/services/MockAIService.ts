// 📁 src/services/MockAIService.ts - Mock AI Service
// 🎯 Core function: Mock implementation for development/testing
// 🔗 Key dependencies: src/types/game.ts, src/services/AIService.ts
// 💡 Usage: Used as a placeholder for real AI services

import { AIService, GameContext } from './AIService';

export class MockAIService implements AIService {
  /**
   * Mock NPC response generation
   */
  async generateResponse(
    npcName: string,
    playerMessage: string,
    context: GameContext
  ): Promise<string> {
    console.log(`[MockAI] Generating response for ${npcName}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const responses = [
      `Traveler ${context.character.name}, your words in ${context.location.name} carry weight.`,
      `I have heard of your exploits, ${npcName} is at your service.`,
      `Hmm... "${playerMessage}"? An interesting thought for these parts.`,
      `The air in ${context.location.name} is heavy today. Be careful, ${context.character.name}.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Mock situation description
   */
  async describeSituation(context: GameContext): Promise<string> {
    return `You are in ${context.location.name}. ${context.location.description}. You feel the essence of the world flowing around you.`;
  }

  /**
   * Mock quest generation
   */
  async generateQuestIdea(context: GameContext): Promise<{ title: string; description: string }> {
    return {
      title: "The Mystery of the Essence",
      description: `Help the inhabitants of ${context.location.name} deal with an anomaly that is draining the protection of travelers.`
    };
  }
}
