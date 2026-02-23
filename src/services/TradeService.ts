// 📁 src/services/TradeService.ts - Economic system
// 🎯 Core function: Handles buying and selling logic, price calculations
// 🔗 Key dependencies: src/types/game.ts, src/services/StaticDataService.ts
// 💡 Usage: Called by GameStore shop actions

import { Character, Inventory, ExistingItem, ItemTemplate, UUID } from '../types/game';
import { StaticDataService } from './StaticDataService';
import { InventoryService } from './InventoryService';

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
    const config = StaticDataService.getConfig<{ sellMultiplier: number }>('TRADE_CONFIG');
    const multiplier = config?.sellMultiplier || 0.5;
    return Math.floor((template.basePrice || 0) * multiplier);
  },

  /**
   * * Logic for buying an item
   */
  buyItem(
    character: Character, 
    inventory: Inventory, 
    templateId: UUID, 
    quantity: number = 1,
    itemTemplates?: Map<string, ItemTemplate>
  ): { success: boolean; character?: Character; inventory?: Inventory; message?: string; reason?: string } {
    const template = StaticDataService.getItemTemplate(templateId);
    if (!template) return { success: false, reason: "Item not found." };

    const totalPrice = this.getBuyPrice(template) * quantity;
    if (character.money < totalPrice) {
      return { success: false, reason: "Not enough money." };
    }

    // * Check inventory slots before purchase
    if (itemTemplates) {
      const currentUsedSlots = InventoryService.getUsedSlots(inventory);
      const maxSlots = InventoryService.getMaxSlots(inventory, inventory.items, itemTemplates);

      const existingItem = inventory.items.find(
        i => i.templateId === templateId && i.quantity < template.stackSize
      );
      const needsNewSlot = !existingItem || (existingItem.quantity + quantity > template.stackSize);

      if (needsNewSlot && currentUsedSlots + 1 > maxSlots) {
        return { 
          success: false, 
          reason: `Инвентарь переполнен. Слоты: ${currentUsedSlots} / ${maxSlots}.` 
        };
      }
    }

    // * Update character money
    const updatedCharacter = {
      ...character,
      money: character.money - totalPrice
    };

    // * Update inventory
    const updatedInventory = { 
      ...inventory,
      items: [...inventory.items] // * Create a deep copy of the items array
    };
    
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
        // Need to create a new stack
        updatedInventory.items.push(this.createNewItem(templateId, quantity));
      }
    } else {
      updatedInventory.items.push(this.createNewItem(templateId, quantity));
    }

    return { success: true, character: updatedCharacter, inventory: updatedInventory, message: `Куплено: ${template.name} x${quantity}` };
  },

  /**
   * * Logic for selling an item
   */
  sellItem(
    character: Character, 
    inventory: Inventory, 
    itemId: UUID, 
    quantity: number = 1
  ): { success: boolean; character?: Character; inventory?: Inventory; message?: string; reason?: string } {
    const itemIndex = inventory.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return { success: false, reason: "Item not found in inventory.", message: "Item not found in inventory." };

    const item = inventory.items[itemIndex];
    const template = StaticDataService.getItemTemplate(item.templateId);
    if (!template) return { success: false, reason: "Item template not found.", message: "Item template not found." };

    if (item.quantity < quantity) {
      return { success: false, reason: "Not enough items to sell.", message: "Not enough items to sell." };
    }

    const totalGain = this.getSellPrice(template) * quantity;

    // * Update character money
    const updatedCharacter = {
      ...character,
      money: character.money + totalGain
    };

    // * Update inventory - create a new items array to maintain immutability
    const updatedItems = [...inventory.items];
    if (item.quantity === quantity) {
      // * Remove item completely
      updatedItems.splice(itemIndex, 1);
    } else {
      // * Reduce quantity
      updatedItems[itemIndex] = {
        ...item,
        quantity: item.quantity - quantity
      };
    }
    const updatedInventory = {
      ...inventory,
      items: updatedItems
    };

    return { success: true, character: updatedCharacter, inventory: updatedInventory, message: `Продано: ${template.name} x${quantity}` };
  },

  /**
   * * Adds item to inventory without cost (e.g. NPC gift).
   * * Returns updated inventory or failure reason.
   */
  addItemToInventory(
    inventory: Inventory,
    templateId: UUID,
    quantity: number = 1,
    itemTemplates?: Map<string, ItemTemplate>
  ): { success: boolean; inventory?: Inventory; reason?: string } {
    const template = StaticDataService.getItemTemplate(templateId);
    if (!template) return { success: false, reason: "Item not found." };

    if (itemTemplates) {
      const currentUsedSlots = InventoryService.getUsedSlots(inventory);
      const maxSlots = InventoryService.getMaxSlots(inventory, inventory.items, itemTemplates);

      const existingItem = inventory.items.find(
        i => i.templateId === templateId && i.quantity < template.stackSize
      );
      const needsNewSlot = !existingItem || (existingItem.quantity + quantity > template.stackSize);

      if (needsNewSlot && currentUsedSlots + 1 > maxSlots) {
        return {
          success: false,
          reason: `Инвентарь переполнен. Слоты: ${currentUsedSlots} / ${maxSlots}.`
        };
      }
    }

    const updatedInventory = {
      ...inventory,
      items: [...inventory.items]
    };

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
        updatedInventory.items.push(this.createNewItem(templateId, quantity));
      }
    } else {
      updatedInventory.items.push(this.createNewItem(templateId, quantity));
    }

    return { success: true, inventory: updatedInventory };
  },

  /**
   * * Creates a new instance of an item from template
   */
  createNewItem(templateId: UUID, quantity: number = 1): ExistingItem {
    const template = StaticDataService.getItemTemplate(templateId);
    const item: ExistingItem = {
      id: crypto.randomUUID(),
      templateId,
      quantity,
      currentEssence: template?.baseEssence || 0,
      currentDurability: template?.baseDurability || 0,
      isEquipped: false,
      buffs: []
    };
    
    // * Initialize spell slots for magic stabilizers
    if (template?.category === 'MAGIC_STABILIZER' && template.slotCount) {
      item.spellSlots = {
        used: 0,
        max: template.slotCount
      };
    }
    
    return item;
  }
};

