// 📁 src/engine/DiceEngine.ts - Randomness management
// 🎯 Core function: Handles all dice rolls (1d100, 1dX) and modifiers
// 🔗 Key dependencies: None
// 💡 Usage: Used by CombatEngine and event handlers

/**
 * * Dice Engine for Hornygrad
 * * Handles standard RPG dice notation and custom range rolls.
 */
export class DiceEngine {
  private static onRollListener: ((sides: number, result: number, label?: string) => void) | null = null;
  private static onRollAnimatedListener: ((sides: number, result: number, label?: string) => Promise<void>) | null = null;

  /**
   * * Sets a listener that will be called on every roll.
   * * Useful for triggering global animations (fire and forget).
   */
  public static setListener(listener: (sides: number, result: number, label?: string) => void) {
    this.onRollListener = listener;
  }

  /**
   * * Sets a listener for animated rolls that must be awaited.
   */
  public static setAnimatedListener(listener: (sides: number, result: number, label?: string) => Promise<void>) {
    this.onRollAnimatedListener = listener;
  }

  /**
   * * Rolls a single die and waits for the animation to complete.
   */
  public static async rollAnimated(sides: number, label?: string, min: number = 1): Promise<number> {
    if (sides <= 0) return 0;
    let result = Math.floor(Math.random() * sides) + 1;
    result = Math.max(result, min);
    
    if (this.onRollAnimatedListener) {
      await this.onRollAnimatedListener(sides, result, label);
    } else if (this.onRollListener) {
      this.onRollListener(sides, result, label);
    }
    
    return result;
  }

  /**
   * * Rolls a single die with specified sides.
   * @param sides Number of sides (e.g., 100 for 1d100)
   * @param label Optional label for the roll
   * @returns A random number between 1 and sides
   */
  public static roll(sides: number, label?: string): number {
    if (sides <= 0) return 0;
    const result = Math.floor(Math.random() * sides) + 1;
    
    if (this.onRollListener) {
      this.onRollListener(sides, result, label);
    }
    
    return result;
  }

  /**
   * * Rolls multiple dice of the same type.
   * @param count Number of dice to roll
   * @param sides Number of sides per die
   * @returns Total sum of the rolls
   */
  public static rollMultiple(count: number, sides: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += this.roll(sides);
    }
    return total;
  }

  /**
   * * Performs a check against a threshold.
   * @param threshold The value to beat or meet
   * @param sides The die to roll (default 100)
   * @returns True if roll >= threshold
   */
  public static check(threshold: number, sides: number = 100): boolean {
    return this.roll(sides) >= threshold;
  }

  /**
   * * Standard 1d100 roll for Hornygrad mechanics.
   */
  public static d100(): number {
    return this.roll(100);
  }

  /**
   * * Special roll that respects a minimum value (used in Champion Ranks).
   */
  public static rollWithMin(sides: number, min: number): number {
    const value = this.roll(sides);
    return Math.max(value, min);
  }
}

