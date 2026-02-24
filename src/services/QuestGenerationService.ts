// 📁 src/services/QuestGenerationService.ts - Smart LLM Quest Generation
// 🎯 Core function: Generates quests using LLM but only with real IDs from database
// 🔗 Key dependencies: DeepSeekAIService, StaticDataService
// 💡 Usage: NPCs generate contextual quests with valid game objects

import { GameContext, QuestSuggestion, QuestObjectiveSuggestion } from '../types/ai';
import { NPCData } from '../types/ai';
import { StaticDataService } from './StaticDataService';
import { aiService } from './DeepSeekAIService';
import { mockAIService } from './MockAIService';
import { ItemType } from '../types/game';

interface AvailableQuestTarget {
  id: string;
  name: string;
  type: 'MONSTER' | 'ITEM' | 'LOCATION';
  description?: string;
}

interface QuestGenerationContext {
  npc: NPCData;
  location: GameContext['location'];
  character: GameContext['character'];
  availableMonsters: AvailableQuestTarget[];
  availableItems: AvailableQuestTarget[];
  availableLocations: AvailableQuestTarget[];
}

const QUEST_CACHE_KEY = 'npc_quest_cache';

interface CachedQuest {
  npcId: string;
  quest: QuestSuggestion;
  generatedAt: number;
  expiresAt: number;
}

export const QuestGenerationService = {
  /**
   * * Generates a quest for an NPC using LLM with real database IDs
   * * Returns cached quest if available and not expired
   */
  async generateQuestForNPC(
    npc: NPCData,
    context: GameContext,
    forceNew: boolean = false
  ): Promise<QuestSuggestion | null> {
    // * Check cache first
    if (!forceNew) {
      const cached = this.getCachedQuest(npc.id);
      if (cached) {
        console.log('[QuestGeneration] Using cached quest for NPC:', npc.name);
        return cached;
      }
    }

    // * Build generation context with available targets
    const generationContext = this.buildGenerationContext(npc, context);
    
    // * Try LLM generation first
    let quest: QuestSuggestion | null = null;
    
    if (aiService.isAvailable()) {
      try {
        quest = await this.generateWithLLM(generationContext);
      } catch (error) {
        console.error('[QuestGeneration] LLM generation failed:', error);
      }
    }
    
    // * Fallback to mock service if LLM failed
    if (!quest) {
      console.log('[QuestGeneration] Using mock quest generation');
      quest = await mockAIService.generateQuest(context);
    }
    
    // * Cache the generated quest
    if (quest) {
      this.cacheQuest(npc.id, quest);
    }
    
    return quest;
  },

  /**
   * * Builds context with available targets from database
   */
  buildGenerationContext(
    npc: NPCData,
    context: GameContext
  ): QuestGenerationContext {
    const characterRank = context.character.rankId 
      ? parseInt(context.character.rankId) 
      : 1;
    
    // * Get monsters appropriate for player rank (±1 rank)
    const allMonsters = StaticDataService.getAllMonsterTemplates();
    const suitableMonsters = allMonsters
      .filter(m => Math.abs(m.rankOrder - characterRank) <= 1)
      .slice(0, 8); // * Limit to 8 monsters
    
    // * Get items for collection quests
    const allItems = StaticDataService.getAllItemTemplates();
    const consumableItems = allItems
      .filter(t => t.type === ItemType.CONSUMABLE)
      .slice(0, 5);
    const materialItems = allItems
      .filter(t => t.type === ItemType.MATERIAL)
      .slice(0, 5);
    
    // * Get connected locations
    const connections = StaticDataService.getConnections(context.location.id);
    const connectedLocations = connections
      .map(c => StaticDataService.getLocation(c.toLocationId))
      .filter((loc): loc is NonNullable<typeof loc> => loc !== undefined)
      .slice(0, 5);
    
    return {
      npc,
      location: context.location,
      character: context.character,
      availableMonsters: suitableMonsters.map(m => ({
        id: m.id,
        name: m.name,
        type: 'MONSTER' as const,
        description: `Rank ${m.rankOrder}, Essence ${m.baseEssence}`
      })),
      availableItems: [
        ...consumableItems.map(i => ({
          id: i.id,
          name: i.name,
          type: 'ITEM' as const,
          description: i.description || `Type: ${i.type}`
        })),
        ...materialItems.map(i => ({
          id: i.id,
          name: i.name,
          type: 'ITEM' as const,
          description: i.description || `Type: ${i.type}`
        }))
      ],
      availableLocations: connectedLocations.map(l => ({
        id: l.id,
        name: l.name,
        type: 'LOCATION' as const,
        description: l.description.slice(0, 100)
      }))
    };
  },

  /**
   * * Generates quest using LLM with constrained choices
   */
  async generateWithLLM(context: QuestGenerationContext): Promise<QuestSuggestion | null> {
    const prompt = this.buildPrompt(context);
    
    try {
      // * Call LLM with structured prompt
      const response = await aiService.fetch<{
        title: string;
        description: string;
        objectiveType: 'KILL' | 'COLLECT' | 'VISIT';
        targetId: string;
        targetName: string;
        amount: number;
        rewardMoney: number;
        rewardEssence: number;
      }>('/generate-quest', {
        prompt,
        npcName: context.npc.name,
        npcPersonality: context.npc.personality,
        locationName: context.location.name,
        availableMonsters: context.availableMonsters,
        availableItems: context.availableItems,
        availableLocations: context.availableLocations
      });

      // * Validate that targetId exists in our lists
      const validTarget = this.validateTargetId(
        response.targetId,
        response.objectiveType,
        context
      );

      if (!validTarget) {
        console.error('[QuestGeneration] LLM returned invalid targetId:', response.targetId);
        return null;
      }

      return {
        title: response.title,
        description: response.description,
        objectives: [{
          type: response.objectiveType,
          target: response.targetId,
          amount: response.amount
        }],
        rewards: {
          money: response.rewardMoney,
          essence: response.rewardEssence
        }
      };
    } catch (error) {
      console.error('[QuestGeneration] LLM request failed:', error);
      return null;
    }
  },

  /**
   * * Validates that targetId exists in available options
   */
  validateTargetId(
    targetId: string,
    type: string,
    context: QuestGenerationContext
  ): boolean {
    switch (type) {
      case 'KILL':
        return context.availableMonsters.some(m => m.id === targetId);
      case 'COLLECT':
        return context.availableItems.some(i => i.id === targetId);
      case 'VISIT':
        return context.availableLocations.some(l => l.id === targetId);
      default:
        return false;
    }
  },

  /**
   * * Builds detailed prompt for LLM
   */
  buildPrompt(context: QuestGenerationContext): string {
    return `You are ${context.npc.name}, ${context.npc.description}.
Personality: ${context.npc.personality}

You are in ${context.location.name}.

Generate a quest for the player. You MUST choose from the available options below:

AVAILABLE MONSTERS (for KILL quests):
${context.availableMonsters.map(m => `- ID: "${m.id}" | Name: ${m.name} | ${m.description}`).join('\n')}

AVAILABLE ITEMS (for COLLECT quests):
${context.availableItems.map(i => `- ID: "${i.id}" | Name: ${i.name} | ${i.description}`).join('\n')}

AVAILABLE LOCATIONS (for VISIT quests):
${context.availableLocations.map(l => `- ID: "${l.id}" | Name: ${l.name}`).join('\n')}

RULES:
1. Choose ONE objective type: KILL, COLLECT, or VISIT
2. Use EXACTLY the ID from the lists above
3. Create an immersive title and description fitting your personality
4. Amount should be reasonable (3-8 for KILL, 3-10 for COLLECT, 1 for VISIT)
5. Rewards: money (50-200), essence (25-100)

Respond in JSON format:
{
  "title": "Quest Title",
  "description": "Quest description from your perspective...",
  "objectiveType": "KILL|COLLECT|VISIT",
  "targetId": "exact-id-from-list",
  "targetName": "name of target",
  "amount": number,
  "rewardMoney": number,
  "rewardEssence": number
}`;
  },

  /**
   * * Gets cached quest for NPC if valid
   */
  getCachedQuest(npcId: string): QuestSuggestion | null {
    try {
      const cache = localStorage.getItem(QUEST_CACHE_KEY);
      if (!cache) return null;
      
      const parsed: CachedQuest[] = JSON.parse(cache);
      const cached = parsed.find(c => c.npcId === npcId);
      
      if (cached && Date.now() < cached.expiresAt) {
        return cached.quest;
      }
      
      return null;
    } catch {
      return null;
    }
  },

  /**
   * * Caches quest for NPC
   */
  cacheQuest(npcId: string, quest: QuestSuggestion): void {
    try {
      const cache = localStorage.getItem(QUEST_CACHE_KEY);
      const parsed: CachedQuest[] = cache ? JSON.parse(cache) : [];
      
      // * Remove old cache for this NPC
      const filtered = parsed.filter(c => c.npcId !== npcId);
      
      // * Add new cache (valid for 1 hour)
      filtered.push({
        npcId,
        quest,
        generatedAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000
      });
      
      localStorage.setItem(QUEST_CACHE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[QuestGeneration] Failed to cache quest:', error);
    }
  },

  /**
   * * Clears all cached quests
   */
  clearCache(): void {
    localStorage.removeItem(QUEST_CACHE_KEY);
  }
};
