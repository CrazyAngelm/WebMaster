// 📁 server/src/utils/timeService.ts - Server time management
// 🎯 Core function: Calculates and manages autonomous global server time
// 🔗 Key dependencies: prisma, GameConfig
// 💡 Usage: Used by controllers to get current time and update settings

import prisma from '../db';

interface TimeData {
  baseServerTime: number; // in hours
  baseRealTime: number;   // Date.now() timestamp
  multiplier: number;     // 1.0 means 1:1 real-time seconds to game-time seconds
}

export class TimeService {
  private static data: TimeData | null = null;
  private static readonly CONFIG_KEY = 'SERVER_TIME_DATA';

  /**
   * * Initializes the TimeService by loading settings from DB.
   */
  public static async init() {
    const config = await prisma.gameConfig.findUnique({
      where: { key: this.CONFIG_KEY }
    });

    if (config) {
      this.data = JSON.parse(config.value);
    } else {
      // Fallback if seed didn't run
      this.data = {
        baseServerTime: 0,
        baseRealTime: Date.now(),
        multiplier: 1.0
      };
      await this.save();
    }
    console.log('TimeService initialized:', this.data);
  }

  /**
   * * Returns current server time in hours.
   */
  public static getCurrentTime(): number {
    if (!this.data) return 0;

    const realElapsedMs = Date.now() - this.data.baseRealTime;
    const realElapsedHours = realElapsedMs / (1000 * 3600);
    const serverElapsedHours = realElapsedHours * this.data.multiplier;

    return this.data.baseServerTime + serverElapsedHours;
  }

  /**
   * * Returns full time metadata for synchronization.
   */
  public static getTimeMetadata() {
    return {
      currentTime: this.getCurrentTime(),
      multiplier: this.data?.multiplier || 1.0,
      baseRealTime: this.data?.baseRealTime || Date.now(),
      baseServerTime: this.data?.baseServerTime || 0
    };
  }

  /**
   * * Sets a new multiplier. Recalibrates base times to ensure continuity.
   */
  public static async setMultiplier(newMultiplier: number) {
    if (!this.data) await this.init();
    
    // Recalibrate: current server time becomes new baseServerTime
    const now = Date.now();
    const currentServerTime = this.getCurrentTime();

    this.data = {
      baseServerTime: currentServerTime,
      baseRealTime: now,
      multiplier: newMultiplier
    };

    await this.save();
  }

  /**
   * * Jumps time forward by specified hours.
   */
  public static async skipTime(hours: number) {
    if (!this.data) await this.init();
    
    // Recalibrate: current server time + skip becomes new baseServerTime
    const now = Date.now();
    const nextServerTime = this.getCurrentTime() + hours;

    this.data = {
      baseServerTime: nextServerTime,
      baseRealTime: now,
      multiplier: this.data!.multiplier
    };

    await this.save();
  }

  /**
   * * Explicitly sets the current server time.
   */
  public static async setTime(hours: number) {
    if (!this.data) await this.init();
    
    const now = Date.now();
    this.data = {
      baseServerTime: hours,
      baseRealTime: now,
      multiplier: this.data!.multiplier
    };

    await this.save();
  }

  private static async save() {
    if (!this.data) return;
    
    await prisma.gameConfig.upsert({
      where: { key: this.CONFIG_KEY },
      update: { value: JSON.stringify(this.data) },
      create: { 
        key: this.CONFIG_KEY,
        value: JSON.stringify(this.data)
      }
    });
  }
}

