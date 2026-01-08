// 📁 server/src/utils/diceEngine.ts - Randomness management (Server-side)
// 🎯 Core function: Handles all dice rolls (1d100, 1dX) and modifiers
// 💡 Usage: Used by server-side CombatEngine

export class DiceEngine {
  /**
   * * Rolls a single die with specified sides.
   * @param sides Number of sides (e.g., 100 for 1d100)
   * @param min Optional minimum value (for Champion Ranks)
   * @returns A random number between min and sides
   */
  public static roll(sides: number, min: number = 1): number {
    if (sides <= 0) return 0;
    const result = Math.floor(Math.random() * sides) + 1;
    return Math.max(result, min);
  }

  /**
   * * Standard 1d100 roll for Hornygrad mechanics.
   */
  public static d100(): number {
    return this.roll(100);
  }
}


