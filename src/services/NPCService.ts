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
  private isTransientNPCId(id: string): boolean {
    return id.startsWith('npc-mock-') || id.startsWith('generated-') || /^npc-\d{10,}$/.test(id);
  }

  private deleteCachedNPC(cacheKey: string): void {
    const cache = this.getCache();
    if (cache[cacheKey]) {
      delete cache[cacheKey];
      this.setCache(cache);
    }
  }

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

    // 1. Always prefer authoritative DB NPC for this building.
    // This prevents stale local cache IDs after DB recreate/reset.
    try {
      const staticNPC = await this.fetchStaticNPC(building.id);
      if (staticNPC) {
        this.cacheNPC(cacheKey, staticNPC);
        return staticNPC;
      }
    } catch (error) {
      console.log('[NPCService] Static NPC lookup failed, fallback to cache/generation');
    }
    
    // 2. Check cache only when no static NPC exists
    const cached = this.getCachedNPC(cacheKey);
    if (cached) {
      console.log('[NPCService] Returning cached NPC for building:', building.name);
      const needsPersist = this.isTransientNPCId(cached.id);
      if (needsPersist) {
        try {
          const persisted = await this.persistNPC({ ...cached, locationId: location.id, buildingId: building.id }, building.id);
          this.cacheNPC(cacheKey, persisted);
          return persisted;
        } catch (error) {
          this.deleteCachedNPC(cacheKey);
          console.warn('[NPCService] Removed transient NPC from cache after persist failure:', error);
        }
      } else {
        return cached;
      }
    }

    // 3. Generate via LLM
    const generatedNPC = await this.generateNPC(location, building.id);
    this.cacheNPC(cacheKey, generatedNPC);
    return generatedNPC;
  }

  async getNPCForLocation(location: Location): Promise<NPCData> {
    const cacheKey = `location_${location.id}`;

    // 1. Always prefer authoritative DB NPC for this location.
    try {
      const staticNPC = await this.fetchStaticNPCByLocation(location.id);
      if (staticNPC) {
        this.cacheNPC(cacheKey, staticNPC);
        return staticNPC;
      }
    } catch (error) {
      console.log('[NPCService] Static location NPC lookup failed, fallback to cache/generation');
    }
    
    // 2. Check cache only when no static NPC exists
    const cached = this.getCachedNPC(cacheKey);
    if (cached) {
      const needsPersist = this.isTransientNPCId(cached.id);
      if (needsPersist) {
        try {
          const persisted = await this.persistNPC({ ...cached, locationId: location.id });
          this.cacheNPC(cacheKey, persisted);
          return persisted;
        } catch (error) {
          this.deleteCachedNPC(cacheKey);
          console.warn('[NPCService] Removed transient location NPC from cache after persist failure:', error);
        }
      } else {
        return cached;
      }
    }

    // 3. Generate via LLM
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
        templateId: data.templateId || undefined,
        npcType: data.npcType,
        merchantInventory: data.merchantInventory?.map((inv: any) => ({
          itemId: inv.itemId,
          quantity: inv.quantity,
          item: inv.item ? {
            name: inv.item.name,
            type: inv.item.type,
            basePrice: inv.item.basePrice,
            rarity: inv.item.rarity,
            description: inv.item.description
          } : undefined
        })) || undefined
      };
    } catch (error) {
      console.log('[NPCService] Error fetching static NPC:', error);
      return null;
    }
  }

  private async fetchStaticNPCByLocation(locationId: string): Promise<NPCData | null> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/npcs/location/${locationId}`, {
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
        templateId: data.templateId || undefined,
        npcType: data.npcType,
        merchantInventory: data.merchantInventory?.map((inv: any) => ({
          itemId: inv.itemId,
          quantity: inv.quantity,
          item: inv.item ? {
            name: inv.item.name,
            type: inv.item.type,
            basePrice: inv.item.basePrice,
            rarity: inv.item.rarity,
            description: inv.item.description
          } : undefined
        })) || undefined
      };
    } catch (error) {
      console.log('[NPCService] Error fetching NPC by location:', error);
      return null;
    }
  }

  private async persistNPC(npc: NPCData, buildingId?: string): Promise<NPCData> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Missing auth token. Cannot persist NPC to server.');
    }

    try {
      const response = await fetch('/api/npcs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: npc.name,
          description: npc.description,
          personality: npc.personality,
          greeting: npc.dialogueGreeting,
          buildingId,
          locationId: npc.locationId,
          npcType: npc.npcType || 'villager'
        })
      });

      if (!response.ok) {
        const details = await response.json().catch(() => null);
        const message = details?.error || `HTTP ${response.status}`;
        throw new Error(`Failed to persist NPC: ${message}`);
      }
      const data = await response.json();

      if (!data?.id) {
        throw new Error('Failed to persist NPC: server returned empty id');
      }
      return {
        ...npc,
        id: data.id,
        templateId: data.templateId || undefined
      };
    } catch (error) {
      console.warn('[NPCService] Failed to persist NPC:', error);
      throw error instanceof Error ? error : new Error('Failed to persist NPC');
    }
  }

  private async generateNPC(location: Location, buildingId?: string): Promise<NPCData> {
    // Determine NPC type based on building
    let npcType: NPCData['npcType'] = 'villager';
    
    // Try to use real AI service
    const service = aiService.isAvailable() ? aiService : mockAIService;

    try {
      const npc = await service.generateNPC(location, npcType);
      const generated: NPCData = {
        ...npc,
        buildingId,
        locationId: location.id
      };

      // Persist so server-side systems (e.g. battle) can reference NPC by id.
      return await this.persistNPC(generated, buildingId);
    } catch (error) {
      console.error('[NPCService] Error generating NPC:', error);
      
      // Fallback to default NPC
      const fallback: NPCData = {
        id: `generated-${Date.now()}`,
        name: 'Незнакомец',
        description: 'Странник, появившийся из ниоткуда',
        personality: 'Нейтральный, наблюдательный',
        dialogueGreeting: 'Привет, путник.',
        locationId: location.id,
        buildingId,
        npcType: 'mysterious'
      };

      return await this.persistNPC(fallback, buildingId);
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
