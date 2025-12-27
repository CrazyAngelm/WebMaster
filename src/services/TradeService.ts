// 📁 src/services/TradeService.ts - Economic system
// 🎯 Core function: Handles buying and selling logic, price calculations
// 🔗 Key dependencies: src/types/game.ts, src/services/StaticDataService.ts
// 💡 Usage: Called by GameStore shop actions

import { Character, Inventory, ExistingItem, ItemTemplate, UUID } from '../types/game';
import { StaticDataService } from './StaticDataService';

export const TradeService = {
  /**
   * * Calculates the buying price for an item
   */
  getBuyPrice(template: ItemTemplate): number {
    return template.basePrice || 0;
  },

  /**
   * * Calculates the selling price for an item (usually 50% of buy price)
   */
  getSellPrice(template: ItemTemplate): number {
    return Math.floor((template.basePrice || 0) * 0.5);
  },

  /**
   * * Logic for buying an item
   */
  buyItem(
    character: Character, 
    inventory: Inventory, 
    templateId: UUID, 
    quantity: number = 1
  ): { success: boolean; character?: Character; inventory?: Inventory; reason?: string } {
    const template = StaticDataService.getItemTemplate(templateId);
    if (!template) return { success: false, reason: "Item not found." };

    const totalPrice = this.getBuyPrice(template) * quantity;
    if (character.money < totalPrice) {
      return { success: false, reason: "Not enough money." };
    }

    // * Update character money
    const updatedCharacter = {
      ...character,
      money: character.money - totalPrice
    };

    // * Update inventory
    const updatedInventory = { ...inventory };
    
    // Check if item is stackable and already exists
    const existingItemIndex = updatedInventory.items.findIndex(
      i => i.templateId === templateId && i.quantity < template.stackSize
    );

    if (existingItemIndex !== -1 && template.stackSize > 1) {
      const existingItem = updatedInventory.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity <= template.stackSize) {
        updatedInventory.items[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
      } else {
        // Need to create a new stack (simplified: just add new item for now)
        updatedInventory.items.push(this.createNewItem(templateId, quantity));
      }
    } else {
      updatedInventory.items.push(this.createNewItem(templateId, quantity));
    }

    return { success: true, character: updatedCharacter, inventory: updatedInventory };
  },

  /**
   * * Logic for selling an item
   */
  sellItem(
    character: Character, 
    inventory: Inventory, 
    itemId: UUID, 
    quantity: number = 1
  ): { success: boolean; character?: Character; inventory?: Inventory; reason?: string } {
    const itemIndex = inventory.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return { success: false, reason: "Item not found in inventory." };

    const item = inventory.items[itemIndex];
    const template = StaticDataService.getItemTemplate(item.templateId);
    if (!template) return { success: false, reason: "Item template not found." };

    if (item.quantity < quantity) {
      return { success: false, reason: "Not enough items to sell." };
    }

    const totalGain = this.getSellPrice(template) * quantity;

    // * Update character money
    const updatedCharacter = {
      ...character,
      money: character.money + totalGain
    };

    // * Update inventory
    const updatedInventory = { ...inventory };
    if (item.quantity === quantity) {
      updatedInventory.items.splice(itemIndex, 1);
    } else {
      updatedInventory.items[itemIndex] = {
        ...item,
        quantity: item.quantity - quantity
      };
    }

    return { success: true, character: updatedCharacter, inventory: updatedInventory };
  },

  /**
   * * Creates a new instance of an item from template
   */
  createNewItem(templateId: UUID, quantity: number = 1): ExistingItem {
    const template = StaticDataService.getItemTemplate(templateId);
    return {
      id: crypto.randomUUID(),
      templateId,
      quantity,
      currentEssence: template?.baseEssence || 0,
      currentDurability: template?.baseDurability || 0,
      isEquipped: false,
      buffs: []
    };
  }
};

