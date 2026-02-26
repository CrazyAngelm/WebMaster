// 📁 src/services/DeepSeekAIService.ts - DeepSeek AI Service Implementation
// 🎯 Core function: Real AI service using server-side LLM proxy
// 🔗 Key dependencies: AIService interface, types/ai
// 💡 Usage: Production implementation that calls backend API

import { AIService, GameContext } from './AIService';
import { Location } from '../types/game';
import {
  ConversationMessage,
  NPCResponse,
  NPCData,
  QuestSuggestion
} from '../types/ai';
import { NPC_PROMPTS } from './prompts/npcPrompts';
import { mockAIService } from './MockAIService';

const API_BASE = '/api/ai';

export class DeepSeekAIService implements AIService {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async fetch<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  private buildNPCSystemPrompt(
    npcData: NPCData,
    reputation: number = 0
  ): string {
    return NPC_PROMPTS.systemPrompt({
      name: npcData.name,
      description: npcData.description,
      personality: npcData.personality,
      npcType: npcData.npcType,
      merchantInventory: npcData.merchantInventory
    }, reputation);
  }

  private buildNPCUserPrompt(
    playerMessage: string,
    context: GameContext & { reputation?: number },
    conversationHistory: ConversationMessage[]
  ): string {
    return NPC_PROMPTS.contextPrompt(context) + 
           NPC_PROMPTS.historyPrompt(conversationHistory) +
           NPC_PROMPTS.userMessagePrompt(playerMessage);
  }

  async generateResponse(
    npcData: NPCData,
    playerMessage: string,
    context: GameContext & { reputation?: number },
    conversationHistory: ConversationMessage[]
  ): Promise<NPCResponse> {
    const reputation = context.reputation || 0;
    const systemPrompt = this.buildNPCSystemPrompt(npcData, reputation);
    const userPrompt = this.buildNPCUserPrompt(playerMessage, context, conversationHistory);

    try {
      const result = await this.fetch<{ content: string }>('/generate', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return this.parseNPCResponse(result.content);
    } catch (error) {
      console.error('AI generateResponse error:', error);
      return {
        text: 'Извини, сейчас я не могу ответить. Попробуй позже.',
        emotion: 'neutral',
        action: 'idle'
      };
    }
  }

  async describeSituation(context: GameContext): Promise<string> {
    try {
      const result = await this.fetch<{ description: string }>('/describe-location', {
        locationName: context.location.name,
        locationDescription: context.location.description,
        timeOfDay: 'день'
      });

      return result.description;
    } catch (error) {
      console.error('AI describeSituation error:', error);
      return context.location.description;
    }
  }

  async generateQuest(context: GameContext): Promise<QuestSuggestion | null> {
    // * Always use MockAIService for quests to ensure real IDs from database
    // * DeepSeek AI may return abstract targets like "rat" which don't exist in DB
    return mockAIService.generateQuest(context);
  }

  async generateNPC(
    location: Location,
    npcType?: NPCData['npcType']
  ): Promise<NPCData> {
    try {
      const result = await this.fetch<{
        name: string;
        description: string;
        personality: string;
        dialogueGreeting: string;
      }>('/npc', {
        locationName: location.name,
        locationDescription: location.description,
        npcType
      });

      return {
        id: `npc-${Date.now()}`,
        name: result.name,
        description: result.description,
        personality: result.personality,
        dialogueGreeting: result.dialogueGreeting,
        locationId: location.id,
        npcType: npcType || 'villager'
      };
    } catch (error) {
      console.error('AI generateNPC error:', error);
      return {
        id: `npc-${Date.now()}`,
        name: 'Незнакомец',
        description: 'Таинственный путник',
        personality: 'Нейтральный',
        dialogueGreeting: 'Привет, путник.',
        locationId: location.id,
        npcType: 'villager'
      };
    }
  }

  isAvailable(): boolean {
    // Check if API is configured by testing a minimal request
    // For now, we'll check if we can access the environment
    // This is a client-side check - the real validation happens server-side
    try {
      // Simple check: if we have auth token and can make basic requests
      return !!this.authToken;
    } catch {
      return false;
    }
  }

  private parseNPCResponse(content: string): NPCResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          text: parsed.text || content,
          emotion: parsed.emotion || 'neutral',
          action: parsed.action || 'talk',
          // Note: questSuggestion is now handled by QuestGenerationService, not LLM response
          itemOffer: parsed.itemOffer && parsed.itemOffer.templateId
            ? { templateId: parsed.itemOffer.templateId, quantity: parsed.itemOffer.quantity || 1 }
            : undefined
        };
      }
    } catch (error) {
      console.warn('Failed to parse NPC response:', error);
    }

    return {
      text: content,
      emotion: 'neutral',
      action: 'talk'
    };
  }
}

export const aiService = new DeepSeekAIService();
