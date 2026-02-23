// 📁 src/services/MetricsService.ts - Game Session Metrics Collection
// 🎯 Core function: Collects and tracks player session metrics
// 🔗 Key dependencies: types/ai
// 💡 Usage: Used for analyzing player experience and generating research data

import { SessionMetrics } from '../types/ai';

type ActionType = 'combat' | 'dialogue' | 'crafting' | 'movement' | 'quest' | 'trade';

class MetricsServiceClass {
  private sessionStart: number = 0;
  private metrics: SessionMetrics;
  private dialogueHashes: Set<string> = new Set();
  private npcInteractions: Set<string> = new Set();

  constructor() {
    this.metrics = this.initMetrics();
  }

  private initMetrics(): SessionMetrics {
    return {
      sessionId: `session-${Date.now()}`,
      characterId: '',
      startTime: Date.now(),
      playTimeMinutes: 0,
      totalActions: 0,
      combatActions: 0,
      dialogueActions: 0,
      dialogueCount: 0,
      uniqueDialogues: 0,
      questsStarted: 0,
      questsCompleted: 0,
      npcInteractions: 0,
      uniqueNPCsTalked: []
    };
  }

  startSession(characterId: string) {
    this.sessionStart = Date.now();
    this.metrics = this.initMetrics();
    this.metrics.characterId = characterId;
    this.dialogueHashes.clear();
    this.npcInteractions.clear();
    console.log('[Metrics] Session started:', this.metrics.sessionId);
  }

  endSession(): SessionMetrics {
    this.metrics.endTime = Date.now();
    this.metrics.playTimeMinutes = Math.floor((Date.now() - this.sessionStart) / 60000);
    console.log('[Metrics] Session ended:', this.metrics);
    return this.metrics;
  }

  recordAction(actionType: ActionType) {
    this.metrics.totalActions++;
    
    switch (actionType) {
      case 'combat':
        this.metrics.combatActions++;
        break;
      case 'dialogue':
        this.metrics.dialogueActions++;
        break;
      case 'crafting':
        this.metrics.craftingActions++;
        break;
      case 'movement':
        break;
      case 'quest':
        break;
      case 'trade':
        break;
    }
  }

  recordDialogue(npcId: string, playerMessage: string, npcResponse: string) {
    this.metrics.dialogueCount++;
    this.metrics.dialogueActions++;
    
    // Track unique dialogues
    const dialogueHash = this.hashString(playerMessage.toLowerCase().trim());
    if (!this.dialogueHashes.has(dialogueHash)) {
      this.dialogueHashes.add(dialogueHash);
      this.metrics.uniqueDialogues++;
    }

    // Track unique NPCs
    if (!this.npcInteractions.has(npcId)) {
      this.npcInteractions.add(npcId);
      this.metrics.uniqueNPCsTalked.push(npcId);
      this.metrics.npcInteractions++;
    }
  }

  recordQuestStart() {
    this.metrics.questsStarted++;
  }

  recordQuestComplete() {
    this.metrics.questsCompleted++;
  }

  getMetrics(): SessionMetrics {
    return {
      ...this.metrics,
      playTimeMinutes: this.sessionStart > 0 
        ? Math.floor((Date.now() - this.sessionStart) / 60000) 
        : 0
    };
  }

  reset() {
    this.metrics = this.initMetrics();
    this.dialogueHashes.clear();
    this.npcInteractions.clear();
    this.sessionStart = 0;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Calculate derived metrics
  getEngagementScore(): number {
    const { playTimeMinutes, totalActions, dialogueCount, questsCompleted } = this.metrics;
    
    // Simple engagement formula
    const timeScore = Math.min(playTimeMinutes / 60, 1) * 40; // Max 40 points for 60+ min
    const actionScore = Math.min(totalActions / 50, 1) * 30; // Max 30 points for 50+ actions
    const dialogueScore = Math.min(dialogueCount / 10, 1) * 20; // Max 20 points for 10+ dialogues
    const questScore = questsCompleted * 10; // 10 points per quest

    return Math.min(100, timeScore + actionScore + dialogueScore + questScore);
  }

  // Export metrics for research
  exportForResearch(): object {
    const metrics = this.getMetrics();
    return {
      sessionId: metrics.sessionId,
      characterId: metrics.characterId,
      playTimeMinutes: metrics.playTimeMinutes,
      totalActions: metrics.totalActions,
      actionsPerMinute: metrics.playTimeMinutes > 0 
        ? (metrics.totalActions / metrics.playTimeMinutes).toFixed(2) 
        : 0,
      dialogueEngagement: {
        total: metrics.dialogueCount,
        unique: metrics.uniqueDialogues,
        uniqueRate: metrics.dialogueCount > 0 
          ? (metrics.uniqueDialogues / metrics.dialogueCount * 100).toFixed(1) + '%'
          : '0%'
      },
      npcInteractions: {
        total: metrics.npcInteractions,
        uniqueNPCs: metrics.uniqueNPCsTalked.length
      },
      quests: {
        started: metrics.questsStarted,
        completed: metrics.questsCompleted,
        completionRate: metrics.questsStarted > 0 
          ? (metrics.questsCompleted / metrics.questsStarted * 100).toFixed(1) + '%'
          : '0%'
      },
      engagementScore: this.getEngagementScore()
    };
  }
}

export const MetricsService = new MetricsServiceClass();
