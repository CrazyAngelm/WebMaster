// 📁 server/src/utils/effectsEngine.ts - Effects and Buffs logic
// 🎯 Core function: Manages ticks, bonuses, and application of battle effects
// 🔗 Key dependencies: server/src/types/game.ts
// 💡 Usage: Used by battleController to handle combat effects

import { 
  BattleParticipant, 
  ActiveEffect, 
  EffectType, 
  CharacterBonuses
} from '../types/game';

export class EffectsEngine {
  /**
   * * Processes one tick of effects for a participant.
   * * Called at the start of their turn.
   */
  public static processTicks(participant: BattleParticipant): { 
    updatedParticipant: BattleParticipant, 
    logs: string[] 
  } {
    if (participant.status && participant.status !== 'ALIVE') {
      return { updatedParticipant: { ...participant }, logs: [] };
    }

    const effects: ActiveEffect[] = participant.activeEffects ? JSON.parse(participant.activeEffects) : [];
    const logs: string[] = [];
    const updatedParticipant = { ...participant };

    if (effects.length === 0) {
        return { updatedParticipant, logs };
    }

    // * 1. Process Periodic Effects
    effects.forEach(effect => {
      if (effect.type === EffectType.PERIODIC_DAMAGE) {
        const damage = effect.value;
        this.applyDamage(updatedParticipant, damage);
        logs.push(`${participant.name} получает ${damage} урона от эффекта "${effect.name}".`);
      } else if (effect.type === EffectType.PERIODIC_HEAL) {
        const heal = effect.value;
        updatedParticipant.currentHp = Math.min(updatedParticipant.maxHp, updatedParticipant.currentHp + heal);
        logs.push(`${participant.name} восстанавливает ${heal} HP от эффекта "${effect.name}".`);
      }

      // * 2. Decrement duration
      effect.remainingTurns--;
    });

    // * 3. Remove expired effects
    const remainingEffects = effects.filter(e => e.remainingTurns > 0);
    updatedParticipant.activeEffects = JSON.stringify(remainingEffects);

    // * 4. Recalculate bonuses
    this.recalculateBonuses(updatedParticipant);

    return { updatedParticipant, logs };
  }

  /**
   * * Recalculates CharacterBonuses based on current active effects.
   */
  public static recalculateBonuses(participant: BattleParticipant): void {
    const effects: ActiveEffect[] = participant.activeEffects ? JSON.parse(participant.activeEffects) : [];
    const bonuses: CharacterBonuses = {
      evasion: 0,
      accuracy: 0,
      damageResistance: 0,
      initiative: 0
    };

    effects.forEach(effect => {
      if ((effect.type === EffectType.BUFF || effect.type === EffectType.DEBUFF) && effect.parameter) {
        const param = effect.parameter as keyof CharacterBonuses;
        if (bonuses[param] !== undefined) {
          // * Buffs add, debuffs subtract (assuming value is negative for debuffs or logic handled here)
          // * According to roadmap, value is absolute strength, so we use isNegative to determine sign
          const sign = effect.isNegative ? -1 : 1;
          bonuses[param] += (effect.value * sign);
        }
      }
    });

    participant.bonuses = JSON.stringify(bonuses);
  }

  /**
   * * Adds a new effect to a participant.
   */
  public static applyEffect(participant: BattleParticipant, effect: ActiveEffect): void {
    const effects: ActiveEffect[] = participant.activeEffects ? JSON.parse(participant.activeEffects) : [];
    
    // * Check if effect already exists (by templateId) to refresh duration or stack
    const existingIndex = effects.findIndex(e => e.templateId === effect.templateId);
    
    if (existingIndex !== -1) {
      // * Strategy: Refresh duration and take the higher value
      effects[existingIndex].remainingTurns = Math.max(effects[existingIndex].remainingTurns, effect.remainingTurns);
      effects[existingIndex].value = Math.max(effects[existingIndex].value, effect.value);
    } else {
      effects.push(effect);
    }

    participant.activeEffects = JSON.stringify(effects);
    this.recalculateBonuses(participant);
  }

  /**
   * * Checks if a participant is stunned.
   */
  public static isStunned(participant: BattleParticipant): boolean {
    const effects: ActiveEffect[] = participant.activeEffects ? JSON.parse(participant.activeEffects) : [];
    return effects.some(e => e.type === EffectType.STUN);
  }

  /**
   * * Helper to apply damage to Protection first, then HP.
   */
  private static applyDamage(participant: BattleParticipant, amount: number): void {
    if (participant.currentProtection >= amount) {
      participant.currentProtection -= amount;
    } else {
      const remaining = amount - participant.currentProtection;
      participant.currentProtection = 0;
      participant.currentHp = Math.max(0, participant.currentHp - remaining);
    }
  }
}
