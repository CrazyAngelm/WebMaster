// 📁 src/services/NPCService.ts - NPC Management Service
// 🎯 Core function: Manages NPC retrieval, generation and caching
// 🔗 Key dependencies: types/ai, DeepSeekAIService, MockAIService
// 💡 Usage: Used by WorldNavigation to get NPCs for buildings

import { NPCData } from '../types/ai';
import { Location, Building } from '../types/game';
import { aiService } from './DeepSeekAIService';
import { mockAIService } from './MockAIService';

const NPC_CACHE_KEY = 'hornygrad_npc_cache';
const CACHE_EXPIRY_HOURS = 24;

interface CacheEntry {
  npc: NPCData;
  timestamp: number;
}

class NPCServiceClass {
  private getCache(): Record<string, CacheEntry> {
    try {
      const cached = localStorage.getItem(NPC_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private setCache(cache: Record<string, CacheEntry>): void {
    try {
      localStorage.setItem(NPC_CACHE_KEY, JSON.stringify(cache));
    } catch {
      console.warn('[NPCService] Failed to save to localStorage');
    }
  }

  private getCachedNPC(id: string): NPCData | null {
    const cache = this.getCache();
    const entry = cache[id];
    
    if (!entry) return null;
    
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    if (now - entry.timestamp > expiryMs) {
      delete cache[id];
      this.setCache(cache);
      return null;
    }
    
    return entry.npc;
  }

  private cacheNPC(id: string, npc: NPCData): void {
    const cache = this.getCache();
    cache[id] = {
      npc,
      timestamp: Date.now()
    };
    this.setCache(cache);
  }

  async getNPCForBuilding(building: Building, location: Location): Promise<NPCData> {
    const cacheKey = `building_${building.id}`;
    
    // 1. Check cache first
    const cached = this.getCachedNPC(cacheKey);
    if (cached) {
      console.log('[NPCService] Returning cached NPC for building:', building.name);
      return cached;
    }

    // 2. Try to get from API (static NPCs from DB)
    try {
      const staticNPC = await this.fetchStaticNPC(building.id);
      if (staticNPC) {
        this.cacheNPC(cacheKey, staticNPC);
        return staticNPC;
      }
    } catch (error) {
      console.log('[NPCService] No static NPC found, will generate');
    }

    // 3. Generate via LLM
    const generatedNPC = await this.generateNPC(location, building.id);
    this.cacheNPC(cacheKey, generatedNPC);
    return generatedNPC;
  }

  async getNPCForLocation(location: Location): Promise<NPCData> {
    const cacheKey = `location_${location.id}`;
    
    // Check cache
    const cached = this.getCachedNPC(cacheKey);
    if (cached) return cached;

    // Generate via LLM
    const generatedNPC = await this.generateNPC(location);
    this.cacheNPC(cacheKey, generatedNPC);
    return generatedNPC;
  }

  private async fetchStaticNPC(buildingId: string): Promise<NPCData | null> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/npcs/building/${buildingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      
      if (!data || !data.name) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        personality: data.personality,
        dialogueGreeting: data.greeting,
        locationId: data.locationId,
        buildingId: data.buildingId,
        npcType: data.npcType
      };
    } catch (error) {
      console.log('[NPCService] Error fetching static NPC:', error);
      return null;
    }
  }

  private async generateNPC(location: Location, buildingId?: string): Promise<NPCData> {
    // Determine NPC type based on building
    let npcType: NPCData['npcType'] = 'villager';
    
    // Try to use real AI service
    const service = aiService.isAvailable() ? aiService : mockAIService;

    try {
      const npc = await service.generateNPC(location, npcType);
      
      return {
        ...npc,
        buildingId,
        locationId: location.id
      };
    } catch (error) {
      console.error('[NPCService] Error generating NPC:', error);
      
      // Fallback to default NPC
      return {
        id: `generated-${Date.now()}`,
        name: 'Незнакомец',
        description: 'Странник, появившийся из ниоткуда',
        personality: 'Нейтральный, наблюдательный',
        dialogueGreeting: 'Привет, путник.',
        locationId: location.id,
        buildingId,
        npcType: 'mysterious'
      };
    }
  }

  // Clear all cached NPCs
  clearCache(): void {
    localStorage.removeItem(NPC_CACHE_KEY);
    console.log('[NPCService] Cache cleared');
  }

  // Get all cached NPCs (for debugging)
  getAllCachedNPCs(): NPCData[] {
    const cache = this.getCache();
    return Object.values(cache).map(entry => entry.npc);
  }
}

export const NPCService = new NPCServiceClass();
