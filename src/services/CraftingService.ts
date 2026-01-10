// 📁 src/services/CraftingService.ts - Item creation and repair logic
// 🎯 Core function: Handles recipe validation, quality variance, and item generation
// 🔗 Key dependencies: src/types/game.ts, src/services/ProfessionService.ts, src/engine/DiceEngine.ts
// 💡 Usage: Called by gameStore for crafting and repair actions

import { 
  Character, 
  Recipe, 
  Inventory, 
  ExistingItem, 
  ItemTemplate, 
  ItemType, 
  Rarity,
  WeaponCategory,
  ConsumableCategory,
  UUID
} from '../types/game';
import { ProfessionService } from './ProfessionService';
import { DiceEngine } from '../engine/DiceEngine';
import { InventoryService } from './InventoryService';
import { StaticDataService } from './StaticDataService';

export interface CraftingResult {
  success: boolean;
  item?: ExistingItem;
  character?: Character;
  inventory?: Inventory;
  message: string;
}

export class CraftingService {

  /**
   * * Performs crafting logic
   */
  public static craft(
    character: Character,
    inventory: Inventory,
    recipe: Recipe,
    templates: Map<string, ItemTemplate>,
    currentBuildingWorkstations: string[] = []
  ): CraftingResult {
    // 1. Check Profession Rank
    const charProf = character.professions.find(p => p.type === recipe.profession);
    const charRank = charProf ? charProf.rank : 1;
    
    if (charRank < recipe.rankRequired) {
      return { 
        success: false, 
        message: `Требуется ранг ${ProfessionService.getRankName(recipe.rankRequired)} в профессии ${recipe.profession}.` 
      };
    }

    // 2. Check Ingredients
    for (const ing of recipe.ingredients) {
      const invItem = inventory.items.find(i => i.templateId === ing.templateId);
      if (!invItem || invItem.quantity < ing.quantity) {
        const template = templates.get(ing.templateId);
        return { 
          success: false, 
          message: `Недостаточно ингредиентов: ${template?.name || ing.templateId}.` 
        };
      }
    }

    // 3. Check Workstation
    if (recipe.stationRequired && !currentBuildingWorkstations.includes(recipe.stationRequired)) {
      return { 
        success: false, 
        message: `Для этого рецепта требуется: ${recipe.stationRequired}.` 
      };
    }

    // 4. Consume Ingredients
    const updatedItems = [...inventory.items];
    for (const ing of recipe.ingredients) {
      const index = updatedItems.findIndex(i => i.templateId === ing.templateId);
      if (index !== -1) {
        if (updatedItems[index].quantity > ing.quantity) {
          updatedItems[index] = { ...updatedItems[index], quantity: updatedItems[index].quantity - ing.quantity };
        } else {
          updatedItems.splice(index, 1);
        }
      }
    }

    // 5. Create Item Template Reference
    const resultTemplate = templates.get(recipe.resultTemplateId);
    if (!resultTemplate) {
      return { success: false, message: "Ошибка шаблона предмета." };
    }

    // 6. Calculate Quality (Quality Variance)
    let essence = 0;
    let durability = 0;

    const rarityOrder = {
      [Rarity.COMMON]: 1,
      [Rarity.RARE]: 2,
      [Rarity.EPIC]: 3,
      [Rarity.MYTHIC]: 4,
      [Rarity.LEGENDARY]: 5,
      [Rarity.DIVINE]: 6,
    };

    const itemRarityRank = rarityOrder[resultTemplate.rarity];

    const config = StaticDataService.getConfig<any>('CRAFTING_CONFIG');

    if (resultTemplate.type === ItemType.WEAPON) {
      const ranges = config?.weaponEssenceRanges?.[resultTemplate.rarity];
      const is2H = resultTemplate.category === WeaponCategory.TWO_HANDED;
      const min = is2H ? (ranges?.min2H || 0) : (ranges?.min1H || 0);
      // * New weapon starts at minimal essence for its rarity.
      essence = min;
      durability = 10; // Default durability for weapons if any
    } else if (resultTemplate.type === ItemType.ARMOR || resultTemplate.type === ItemType.SHIELD) {
      const maxDur = config?.armorDurability?.[resultTemplate.rarity] || 2;
      durability = maxDur; // Durability usually fixed for rarity but could have variance
      essence = 0;
    } else if (resultTemplate.type === ItemType.CONSUMABLE) {
      // * Determine minimal essence based on consumable subtype.
      if (resultTemplate.category === ConsumableCategory.POTION) {
        essence = config?.potionEssenceMin?.[resultTemplate.rarity] || 0;
      } else if (resultTemplate.category === ConsumableCategory.SCROLL) {
        essence = config?.scrollEssenceMin?.[resultTemplate.rarity] || 0;
      } else {
        // * For other consumables (food, etc.), use baseEssence or default to 0
        essence = resultTemplate.baseEssence || 0;
      }
      durability = 0;
    } else {
      // * For other item types (BAG, ARTIFACT, etc.), use defaults
      essence = resultTemplate.baseEssence || 0;
      durability = resultTemplate.baseDurability || 0;
    }

    const newItem: ExistingItem = {
      id: crypto.randomUUID(),
      templateId: resultTemplate.id,
      quantity: 1,
      currentEssence: essence,
      currentDurability: durability,
      isEquipped: false,
      buffs: []
    };
    
    // * Initialize spell slots for magic stabilizers
    if (resultTemplate.category === 'MAGIC_STABILIZER' && resultTemplate.slotCount) {
      newItem.spellSlots = {
        used: 0,
        max: resultTemplate.slotCount
      };
    }

    // 7. Check inventory slots before adding the item
    const currentUsedSlots = InventoryService.getUsedSlots({ ...inventory, items: updatedItems });
    const maxSlots = InventoryService.getMaxSlots(inventory, updatedItems, templates);

    if (currentUsedSlots + 1 > maxSlots) {
      return {
        success: false,
        message: `Инвентарь переполнен. Слоты: ${currentUsedSlots} / ${maxSlots}.`,
      };
    }

    updatedItems.push(newItem);

    // 8. Grant XP only if item rarity rank matches profession rank.
    let updatedCharacter = character;
    if (charRank === itemRarityRank) {
      const expGain = resultTemplate.rarity === Rarity.COMMON ? 1 : 2;
      updatedCharacter = ProfessionService.addExp(character, recipe.profession, expGain);
    }

    return {
      success: true,
      item: newItem,
      character: updatedCharacter,
      inventory: { ...inventory, items: updatedItems },
      message: `Вы успешно создали: ${resultTemplate.name}!`
    };
  }

  /**
   * * Repairs an item using materials or kits
   */
  public static repair(
    character: Character,
    inventory: Inventory,
    itemId: UUID,
    templates: Map<string, ItemTemplate>
  ): { success: boolean; inventory?: Inventory; message: string } {
    const item = inventory.items.find(i => i.id === itemId);
    if (!item) return { success: false, message: "Предмет не найден." };

    const template = templates.get(item.templateId);
    if (!template) return { success: false, message: "Шаблон не найден." };

    const config = StaticDataService.getConfig<any>('CRAFTING_CONFIG');

    const maxDur = (template.type === ItemType.ARMOR || template.type === ItemType.SHIELD) 
      ? (config?.armorDurability?.[template.rarity] || 2) 
      : 10;

    if (item.currentDurability >= maxDur) {
      return { success: false, message: "Предмет не нуждается в ремонте." };
    }

    // Simple repair cost from config
    const REPAIR_COST = config?.repairCost || 10;
    if (character.money < REPAIR_COST) {
      return { success: false, message: "Недостаточно денег для ремонта." };
    }

    const updatedItems = inventory.items.map(i => {
      if (i.id === itemId) {
        return { ...i, currentDurability: maxDur };
      }
      return i;
    });

    return {
      success: true,
      inventory: { ...inventory, items: updatedItems },
      message: `Предмет ${template.name} отремонтирован!`
    };
  }
}

