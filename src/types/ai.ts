// 📁 src/types/ai.ts - AI/LLM Type Definitions
// 🎯 Core function: Type definitions for AI services and responses
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Used by AI services and components

import { Character, Location, UUID } from './game';

export interface GameContext {
  character: Character;
  location: Location;
  currentEventId?: UUID;
  worldState?: Record<string, any>;
}

export interface ConversationMessage {
  role: 'player' | 'npc' | 'system';
  content: string;
}

export type NPCEmotion = 'happy' | 'sad' | 'angry' | 'neutral' | 'surprised' | 'scared' | 'excited';
export type NPCAction = 'attack' | 'flee' | 'trade' | 'talk' | 'idle' | 'offer_quest' | 'gift' | 'inspect' | 'negotiate';

export interface NPCResponse {
  text: string;
  emotion?: NPCEmotion;
  action?: NPCAction;
  questSuggestion?: QuestSuggestion;
  itemOffer?: { templateId: string; quantity: number };
}

export interface QuestSuggestion {
  title: string;
  description: string;
  objectives: QuestObjectiveSuggestion[];
  rewards: {
    money?: number;
    essence?: number;
    items?: { templateId: string; quantity: number }[];
  };
}

export interface QuestObjectiveSuggestion {
  type: 'KILL' | 'COLLECT' | 'VISIT' | 'TALK';
  target: string;
  amount: number;
}

export interface NPCData {
  id: string;
  name: string;
  description: string;
  personality: string;
  dialogueGreeting?: string;
  locationId: string;
  buildingId?: string;
  shopId?: string;
  npcType?: 'merchant' | 'guard' | 'questgiver' | 'villager' | 'mysterious';
}

export interface GeneratedQuest {
  id: string;
  title: string;
  description: string;
  objectives: {
    id: string;
    type: 'KILL' | 'COLLECT' | 'VISIT' | 'TALK';
    targetId: string;
    description: string;
    requiredAmount: number;
    currentAmount: number;
    isCompleted: boolean;
  }[];
  rewards: {
    money?: number;
    essence?: number;
    items?: { templateId: string; quantity: number }[];
  };
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  rankRequired: number;
}

export interface AIServiceConfig {
  apiEndpoint: string;
  timeout?: number;
}

export interface LLMRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse {
  content: string;
}

export interface SessionMetrics {
  sessionId: string;
  characterId: string;
  startTime: number;
  endTime?: number;
  playTimeMinutes: number;
  totalActions: number;
  combatActions: number;
  dialogueActions: number;
  dialogueCount: number;
  uniqueDialogues: number;
  craftingActions: number;
  questsStarted: number;
  questsCompleted: number;
  npcInteractions: number;
  uniqueNPCsTalked: string[];
}
