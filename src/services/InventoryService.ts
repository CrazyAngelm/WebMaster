// 📁 src/services/InventoryService.ts - Inventory management
// 🎯 Core function: Handles weight, equipment limits, and item state
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: Used by game engine and UI for item operations

import { 
  Inventory, 
  ExistingItem, 
  ItemTemplate, 
  Character, 
  Rank,
  ItemType,
  WeaponCategory
} from '../types/game';

export class InventoryService {
  /**
   * * Calculates total weight of all items in inventory.
   */
  public static calculateTotalWeight(inventory: Inventory, templates: Map<string, ItemTemplate>): number {
    return inventory.items.reduce((total, item) => {
      const template = templates.get(item.templateId);
      return total + (template ? template.weight * item.quantity : 0);
    }, 0);
  }

  /**
   * * Validates if a character can equip an item based on Rank limits.
   */
  public static canEquip(
    character: Character, 
    rank: Rank, 
    item: ExistingItem, 
    template: ItemTemplate,
    currentInventory: Inventory
  ): { allowed: boolean; reason?: string } {
    // * Check if item type is equippable
    const equippableTypes = [ItemType.WEAPON, ItemType.ARMOR, ItemType.SHIELD, ItemType.ARTIFACT];
    if (!equippableTypes.includes(template.type)) {
      return { allowed: false, reason: 'Этот предмет нельзя экипировать.' };
    }

    // * Check weight limit
    // (Weight calculation would normally happen here or before calling this)

    // * Check Rank limits for Artifacts
    if (template.type === ItemType.ARTIFACT) {
      const equippedArtifacts = currentInventory.items.filter(i => {
        const t = i.isEquipped;
        if (!t) return false;
        // In real app, we'd need to check template type here too
        return true; // Simplified for this example
      }).length;

      if (equippedArtifacts >= rank.maxArtifacts) {
        return { allowed: false, reason: `Rank ${rank.name} limits you to ${rank.maxArtifacts} artifact(s).` };
      }
    }

    // * Check Rank limits for Skills (if skills were items)
    // ... logic for skills ...

    return { allowed: true };
  }

  /**
   * * Increases weapon mastery (essence).
   * * Docs: Mastery increases through battle or training until maxEssence of template.
   */
  public static trainWeapon(item: ExistingItem, template: ItemTemplate): number {
    if (template.type !== ItemType.WEAPON || !template.maxEssence) return 0;
    
    if (item.currentEssence >= template.maxEssence) return 0;

    const gain = Math.floor(Math.random() * 5) + 1; // Simplified gain
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





