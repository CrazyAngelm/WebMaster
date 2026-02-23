// 📁 src/services/DeepSeekAIService.ts - DeepSeek AI Service Implementation
// 🎯 Core function: Real AI service using server-side LLM proxy
// 🔗 Key dependencies: AIService interface, types/ai
// 💡 Usage: Production implementation that calls backend API

import { AIService, GameContext } from './AIService';
import { 
  ConversationMessage, 
  NPCResponse, 
  NPCData, 
  QuestSuggestion 
} from '../types/ai';

const API_BASE = '/api/ai';

export class DeepSeekAIService implements AIService {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async fetch<T>(endpoint: string, data: any): Promise<T> {
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
    npcName: string,
    npcDescription: string,
    personality: string
  ): string {
    return `Ты — ${npcName}. ${npcDescription}

Твой характер: ${personality}.

Правила:
1. Отвечай от первого лица, сохраняя характер персонажа
2. Не раскрывай игровую механику напрямую (HP, опыт и т.д.)
3. Если игрок пытается обмануть/убить тебя — реагируй соответственно
4. Можешь предлагать квесты, если это уместно
5. Отвечай на русском языке

Верни JSON:
{
  "text": "твой ответ игроку",
  "emotion": "happy|sad|angry|neutral|surprised|scared|excited",
  "action": "talk|trade|offer_quest|idle",
  "questSuggestion": { ... } // опционально
}`;
  }

  private buildNPCUserPrompt(
    playerMessage: string,
    context: GameContext,
    conversationHistory: ConversationMessage[]
  ): string {
    let prompt = `Текущая локация: ${context.location.name}\n`;
    prompt += `Описание: ${context.location.description}\n\n`;

    if (context.character) {
      prompt += `Игрок: ${context.character.name}\n`;
    }

    const activeQuests = context.character?.activeQuests || [];
    if (activeQuests.length > 0) {
      prompt += `\nАктивные квесты:\n`;
      activeQuests.forEach(q => {
        prompt += `- ${q.title}: ${q.objectives.map(o => o.description).join(', ')}\n`;
      });
    }

    if (conversationHistory.length > 0) {
      prompt += `\nИстория разговора:\n`;
      conversationHistory.forEach(msg => {
        prompt += `${msg.role === 'player' ? 'Игрок' : 'Ты'}: ${msg.content}\n`;
      });
    }

    prompt += `\nИгрок говорит: "${playerMessage}"\n`;
    prompt += `\nОтветь от лица персонажа в JSON формате.`;

    return prompt;
  }

  async generateResponse(
    npcName: string,
    npcDescription: string,
    personality: string,
    playerMessage: string,
    context: GameContext,
    conversationHistory: ConversationMessage[]
  ): Promise<NPCResponse> {
    const systemPrompt = this.buildNPCSystemPrompt(npcName, npcDescription, personality);
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
    try {
      const result = await this.fetch<QuestSuggestion>('/quest', {
        locationName: context.location.name,
        locationDescription: context.location.description,
        playerName: context.character.name,
        playerLevel: context.character.rankId ? parseInt(context.character.rankId) : 1
      });

      return result;
    } catch (error) {
      console.error('AI generateQuest error:', error);
      return null;
    }
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
    return true;
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
          questSuggestion: parsed.questSuggestion || undefined
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
