// 📁 src/services/InventoryService.ts - Inventory management
// 🎯 Core function: Handles slots, equipment limits, and item state
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Used by game engine and UI for item operations

import { 
  Inventory, 
  ExistingItem, 
  ItemTemplate, 
  Character, 
  Rank,
  ItemType,
  MAX_EQUIPPED_BAGS
} from '../types/game';
import { StaticDataService } from './StaticDataService';

export class InventoryService {
  /**
   * * Calculates used slots in inventory.
   * * Each entry in items array (stack) occupies 1 slot.
   */
  public static getUsedSlots(inventory: Inventory): number {
    return inventory.items.length;
  }

  /**
   * * Calculates total max slots of inventory including equipped bags.
   */
  public static getMaxSlots(
    inventory: Inventory, 
    items: ExistingItem[], 
    templates: Map<string, ItemTemplate>
  ): number {
    const equippedBags = items.filter(item => {
      if (!item.isEquipped) return false;
      const template = templates.get(item.templateId);
      return template?.type === ItemType.BAG;
    });

    const bagsSlots = equippedBags.reduce((total, item) => {
      const template = templates.get(item.templateId);
      return total + (template?.slotCount || 0);
    }, 0);

    return inventory.baseSlots + bagsSlots;
  }

  /**
   * * Validates if a character can equip an item based on Rank limits.
   */
  public static canEquip(
    character: Character, 
    rank: Rank, 
    item: ExistingItem, 
    template: ItemTemplate,
    currentInventory: Inventory,
    itemTemplates: Map<string, ItemTemplate>
  ): { allowed: boolean; reason?: string } {
    // * Check if item type is equippable
    const equippableTypes = [ItemType.WEAPON, ItemType.ARMOR, ItemType.SHIELD, ItemType.ARTIFACT, ItemType.BAG];
    if (!equippableTypes.includes(template.type)) {
      return { allowed: false, reason: 'Этот предмет нельзя экипировать.' };
    }

    // * Check Rank limits for Artifacts
    if (template.type === ItemType.ARTIFACT) {
      const equippedArtifacts = currentInventory.items.filter(i => {
        if (!i.isEquipped) return false;
        const t = itemTemplates.get(i.templateId);
        return t?.type === ItemType.ARTIFACT;
      }).length;

      if (equippedArtifacts >= rank.maxArtifacts) {
        return { allowed: false, reason: `Ранг ${rank.name} позволяет носить не более ${rank.maxArtifacts} артефактов.` };
      }
    }

    // * Check limit for Bags
    if (template.type === ItemType.BAG) {
      const equippedBags = currentInventory.items.filter(i => {
        if (!i.isEquipped) return false;
        const t = itemTemplates.get(i.templateId);
        return t?.type === ItemType.BAG;
      }).length;

      if (equippedBags >= MAX_EQUIPPED_BAGS) {
        return { allowed: false, reason: `Вы не можете носить более ${MAX_EQUIPPED_BAGS} сумок одновременно.` };
      }
    }

    return { allowed: true };
  }

  /**
   * * Increases weapon mastery (essence).
   * * Docs: Mastery increases through battle or training until maxEssence of template.
   */
  public static trainWeapon(item: ExistingItem, template: ItemTemplate): number {
    if (template.type !== ItemType.WEAPON || !template.maxEssence) return 0;
    
    if (item.currentEssence >= template.maxEssence) return 0;

    const config = StaticDataService.getConfig<{ weaponTrainingGainRoll: number }>('CRAFTING_CONFIG');
    const maxGain = config?.weaponTrainingGainRoll || 5;
    const gain = Math.floor(Math.random() * maxGain) + 1; // Simplified gain
    item.currentEssence = Math.min(template.maxEssence, item.currentEssence + gain);
    return gain;
  }

  /**
   * * Reduces durability of an item and returns the updated item.
   */
  public static reduceDurability(item: ExistingItem): ExistingItem {
    if (item.currentDurability !== undefined && item.currentDurability > 0) {
      return { ...item, currentDurability: item.currentDurability - 1 };
    }
    return item;
  }
}
