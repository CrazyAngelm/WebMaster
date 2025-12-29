// 📁 src/services/StorageService.ts - Database service
// 🎯 Core function: Handles persistence using IndexedDB (Dexie)
// 🔗 Key dependencies: dexie, src/types/game.ts
// 💡 Usage: Used by gameStore to persist and load player progress

import Dexie, { type Table } from 'dexie';
import { Character, Inventory, User } from '../types/game';

export class GameDatabase extends Dexie {
  characters!: Table<Character>;
  inventories!: Table<Inventory>;
  users!: Table<User>;
  gameState!: Table<{ key: string; value: any }>;

  constructor() {
    super('HornygradDB');
    this.version(1).stores({
      characters: 'id, userId',
      inventories: 'id, characterId',
      users: 'id',
      gameState: 'key'
    });
  }
}

export const db = new GameDatabase();

export const StorageService = {
  async saveCharacter(character: Character) {
    return await db.characters.put(character);
  },

  async getCharacter(id: string) {
    return await db.characters.get(id);
  },

  async saveInventory(inventory: Inventory) {
    return await db.inventories.put(inventory);
  },

  async getInventory(characterId: string) {
    return await db.inventories.where('characterId').equals(characterId).first();
  },

  async saveMeta(key: string, value: any) {
    return await db.gameState.put({ key, value });
  },

  async getMeta(key: string) {
    const record = await db.gameState.get(key);
    return record?.value;
  },

  async clearAll() {
    await db.characters.clear();
    await db.inventories.clear();
    await db.users.clear();
    await db.gameState.clear();
  },

  async exportSave() {
    const characters = await db.characters.toArray();
    const inventories = await db.inventories.toArray();
    const gameState = await db.gameState.toArray();
    
    return JSON.stringify({
      characters,
      inventories,
      gameState,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  },

  async importSave(jsonData: string) {
    try {
      const data = JSON.parse(jsonData);
      await this.clearAll();
      
      if (data.characters) await db.characters.bulkPut(data.characters);
      if (data.inventories) await db.inventories.bulkPut(data.inventories);
      if (data.gameState) await db.gameState.bulkPut(data.gameState);
      
      return true;
    } catch (e) {
      console.error('Failed to import save:', e);
      return false;
    }
  }
};





