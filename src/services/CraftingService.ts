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

// * StaticDataService is currently not used here, but may be needed later for extended logic.
// import { StaticDataService } from './StaticDataService';

export interface CraftingResult {
  success: boolean;
  item?: ExistingItem;
  character?: Character;
  inventory?: Inventory;
  message: string;
}

export class CraftingService {

  /**
   * * Essence ranges for weapon quality variance
   * * Based on docs/Боевая система.md
   */
  private static readonly WEAPON_ESSENCE_RANGES: Record<Rarity, { min1H: number; max1H: number; min2H: number; max2H: number }> = {
    [Rarity.COMMON]: { min1H: 0, max1H: 60, min2H: 0, max2H: 100 },
    [Rarity.RARE]: { min1H: 60, max1H: 150, min2H: 100, max2H: 250 },
    [Rarity.EPIC]: { min1H: 150, max1H: 300, min2H: 250, max2H: 500 },
    [Rarity.MYTHIC]: { min1H: 300, max1H: 450, min2H: 500, max2H: 800 },
    [Rarity.LEGENDARY]: { min1H: 450, max1H: 650, min2H: 800, max2H: 1200 },
    [Rarity.DIVINE]: { min1H: 650, max1H: 850, min2H: 1200, max2H: 1500 },
  };

  /**
   * * Durability ranges for armor
   */
  private static readonly ARMOR_DURABILITY: Record<Rarity, number> = {
    [Rarity.COMMON]: 2,
    [Rarity.RARE]: 3,
    [Rarity.EPIC]: 4,
    [Rarity.MYTHIC]: 5,
    [Rarity.LEGENDARY]: 6,
    [Rarity.DIVINE]: 7,
  };

  /**
   * * Essence ranges for potions based on rarity.
   * * Docs/Боевая система.md -> Зелья.
   */
  private static readonly POTION_ESSENCE_MIN: Record<Rarity, number> = {
    [Rarity.COMMON]: 0,
    [Rarity.RARE]: 400,
    [Rarity.EPIC]: 800,
    [Rarity.MYTHIC]: 1200,
    [Rarity.LEGENDARY]: 1600,
    [Rarity.DIVINE]: 2000,
  };

  /**
   * * Essence ranges for scrolls based on rarity.
   * * Docs/Боевая система.md -> Свитки.
   */
  private static readonly SCROLL_ESSENCE_MIN: Record<Rarity, number> = {
    [Rarity.COMMON]: 0,
    [Rarity.RARE]: 300,
    [Rarity.EPIC]: 600,
    [Rarity.MYTHIC]: 900,
    [Rarity.LEGENDARY]: 1200,
    [Rarity.DIVINE]: 1600,
  };

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

    if (resultTemplate.type === ItemType.WEAPON) {
      const ranges = this.WEAPON_ESSENCE_RANGES[resultTemplate.rarity];
      const is2H = resultTemplate.category === WeaponCategory.TWO_HANDED;
      const min = is2H ? ranges.min2H : ranges.min1H;
      // * New weapon starts at minimal essence for its rarity.
      essence = min;
      durability = 10; // Default durability for weapons if any
    } else if (resultTemplate.type === ItemType.ARMOR || resultTemplate.type === ItemType.SHIELD) {
      const maxDur = this.ARMOR_DURABILITY[resultTemplate.rarity];
      durability = maxDur; // Durability usually fixed for rarity but could have variance
      essence = 0;
    } else if (resultTemplate.type === ItemType.CONSUMABLE) {
      // * Determine minimal essence based on consumable subtype.
      if (resultTemplate.category === ConsumableCategory.POTION) {
        essence = this.POTION_ESSENCE_MIN[resultTemplate.rarity];
      } else if (resultTemplate.category === ConsumableCategory.SCROLL) {
        essence = this.SCROLL_ESSENCE_MIN[resultTemplate.rarity];
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

    // 7. Check inventory weight before adding the item
    const currentWeight = InventoryService.calculateTotalWeight(
      { ...inventory, items: updatedItems },
      templates
    );
    const templateWeight = resultTemplate.weight;
    const newTotalWeight = currentWeight + templateWeight;

    if (newTotalWeight > inventory.maxWeight) {
      return {
        success: false,
        message: `Инвентарь переполнен. Текущий вес: ${currentWeight}kg, лимит: ${inventory.maxWeight}kg. Новый предмет добавит ${templateWeight}kg.`,
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

    const maxDur = (template.type === ItemType.ARMOR || template.type === ItemType.SHIELD) 
      ? this.ARMOR_DURABILITY[template.rarity] 
      : 10;

    if (item.currentDurability >= maxDur) {
      return { success: false, message: "Предмет не нуждается в ремонте." };
    }

    // Simple repair cost: 10 coins
    const REPAIR_COST = 10;
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

