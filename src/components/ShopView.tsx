// 📁 src/components/ShopView.tsx - Trading interface
// 🎯 Core function: UI for buying items from buildings and selling character items
// 🔗 Key dependencies: src/store/gameStore.ts, src/services/TradeService.ts
// 💡 Usage: Displayed when character enters a building with a shop

import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { StaticDataService } from '../services/StaticDataService';
import { TradeService } from '../services/TradeService';
import { InventoryService } from '../services/InventoryService';
import { ItemTemplate, Rarity, ItemType } from '../types/game';

export const ShopView: React.FC = () => {
  const { character, inventory, buyItem, sellItem, itemTemplates } = useGameStore();
  // * Stores quantity input for each item template ID
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const building = character?.location.buildingId 
    ? StaticDataService.getBuilding(character.location.buildingId) 
    : null;

  // * Mock items for the shop based on building or just general templates
  const shopItems = useMemo(() => {
    return StaticDataService.getAllItemTemplates().filter(t => t.basePrice !== undefined);
  }, []);

  const translateRarity = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.COMMON: return 'Обычное';
      case Rarity.RARE: return 'Редкое';
      case Rarity.EPIC: return 'Эпическое';
      case Rarity.MYTHIC: return 'Мифическое';
      case Rarity.LEGENDARY: return 'Легендарное';
      case Rarity.DIVINE: return 'Божественное';
      default: return rarity;
    }
  };

  const translateItemType = (type: ItemType): string => {
    switch (type) {
      case ItemType.WEAPON: return 'Оружие';
      case ItemType.ARMOR: return 'Броня';
      case ItemType.ARTIFACT: return 'Артефакт';
      case ItemType.CONSUMABLE: return 'Расходник';
      case ItemType.MATERIAL: return 'Материал';
      case ItemType.BAG: return 'Сумка';
      case ItemType.SHIELD: return 'Щит';
      default: return type;
    }
  };

  // * Handles quantity input change for an item
  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      setQuantities(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }
    setQuantities(prev => ({ ...prev, [itemId]: numValue }));
  };

  // * Handles buying an item with specified quantity
  const handleBuy = (item: ItemTemplate) => {
    const quantity = quantities[item.id] || 1;
    buyItem(item.id, quantity);
    // * Clear quantity input after purchase
    setQuantities(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  // * Calculates maximum affordable quantity for an item
  const getMaxAffordable = (item: ItemTemplate): number => {
    if (!character) return 0;
    const price = TradeService.getBuyPrice(item);
    if (price === 0) return 999;
    return Math.floor(character.money / price);
  };

  // * Checks if adding items would exceed weight limit
  const wouldExceedWeight = (item: ItemTemplate, quantity: number): boolean => {
    if (!inventory || !itemTemplates) return false;
    const currentWeight = InventoryService.calculateTotalWeight(inventory, itemTemplates);
    const addedWeight = item.weight * quantity;
    return (currentWeight + addedWeight) > inventory.maxWeight;
  };

  if (!building || !building.hasShop) {
    return <div className="text-gray-500 italic">В этом здании нет магазина.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
      {/* BUY SECTION */}
      <div className="flex flex-col h-full overflow-hidden">
        <h3 className="text-fantasy-accent font-serif mb-4 uppercase flex justify-between">
          <span>{building.name} - Товары</span>
          <span className="text-white text-xs">Ваши деньги: {character?.money ?? 0}</span>
        </h3>
        <div className="fantasy-panel flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-3">
            {shopItems.map(item => {
              const price = TradeService.getBuyPrice(item);
              const quantity = quantities[item.id] || 1;
              const totalPrice = price * quantity;
              const maxAffordable = getMaxAffordable(item);
              const canAfford = (character?.money ?? 0) >= totalPrice;
              const maxStack = item.stackSize || 1;
              const exceedsWeight = wouldExceedWeight(item, quantity);
              const canBuy = canAfford && quantity >= 1 && !exceedsWeight;
              
              return (
                <div key={item.id} className="flex flex-col p-2 border-b border-fantasy-border/30 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{translateItemType(item.type)} • {translateRarity(item.rarity)}</div>
                    </div>
                    <div className="text-fantasy-accent font-bold text-right">
                      <div>{price} за шт.</div>
                      {quantity > 1 && (
                        <div className="text-xs text-gray-400">Всего: {totalPrice}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      Кол-во:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={Math.min(maxAffordable, maxStack > 1 ? maxStack : 999)}
                      value={quantities[item.id] || ''}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val < 1) {
                          handleQuantityChange(item.id, '1');
                        }
                      }}
                      className="quantity-input w-16 px-2 py-1 text-xs bg-fantasy-surface border border-fantasy-border rounded placeholder:text-gray-500 focus:outline-none focus:border-fantasy-accent focus:ring-1 focus:ring-fantasy-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                      placeholder="1"
                      style={{ 
                        caretColor: '#ffffff'
                      }}
                    />
                    <button 
                      onClick={() => handleBuy(item)}
                      disabled={!canBuy}
                      className="fantasy-button text-[10px] py-1 px-3 disabled:opacity-50 disabled:grayscale flex-1"
                    >
                      КУПИТЬ {quantity > 1 && `(${quantity})`}
                    </button>
                  </div>
                  {!canAfford && quantity > 1 && (
                    <div className="text-[10px] text-red-500 mt-1">
                      Недостаточно денег (нужно {totalPrice}, есть {character?.money ?? 0})
                    </div>
                  )}
                  {exceedsWeight && (
                    <div className="text-[10px] text-red-500 mt-1">
                      Инвентарь переполнен. Покупка добавит {item.weight * quantity}kg, превысив лимит {inventory?.maxWeight}kg
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SELL SECTION */}
      <div className="flex flex-col h-full overflow-hidden">
        <h3 className="text-gray-400 font-serif mb-4 uppercase">Ваш инвентарь</h3>
        <div className="fantasy-panel flex-1 overflow-y-auto p-4 custom-scrollbar">
          {inventory?.items.length === 0 ? (
            <div className="text-gray-600 text-center py-8 italic">Инвентарь пуст.</div>
          ) : (
            <div className="space-y-3">
              {inventory?.items.map(item => {
                const template = itemTemplates.get(item.templateId);
                if (!template) return null;
                return (
                  <div key={item.id} className="flex items-center justify-between p-2 border-b border-fantasy-border/30 hover:bg-white/5 transition-colors group">
                    <div>
                      <div className="font-bold text-sm">
                        {template.name} {item.quantity > 1 && `(x${item.quantity})`}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{translateRarity(template.rarity)}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-green-600/70 font-bold">{TradeService.getSellPrice(template)}</div>
                      <button 
                        onClick={() => sellItem(item.id)}
                        className="fantasy-button bg-red-900/20 border-red-900/50 hover:bg-red-900/40 text-[10px] py-1 px-3"
                      >
                        ПРОДАТЬ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



