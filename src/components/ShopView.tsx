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
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ShoppingCart, 
  Package, 
  ChevronRight,
  TrendingUp,
  Tag,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

export const ShopView: React.FC = () => {
  const { character, inventory, buyItem, sellItem, itemTemplates } = useGameStore();
  
  // * Filter and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ItemType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'rarity'>('rarity');
  
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState<ItemType | 'ALL'>('ALL');

  // * Stores quantity input for each item template ID
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const building = character?.location.buildingId 
    ? StaticDataService.getBuilding(character.location.buildingId) 
    : null;

  // * Mock items for the shop
  const shopItems = useMemo(() => {
    return StaticDataService.getAllItemTemplates().filter(t => t.basePrice !== undefined);
  }, []);

  const rarityColors: Record<Rarity, string> = {
    [Rarity.COMMON]: 'border-gray-500/30 text-gray-400',
    [Rarity.RARE]: 'border-blue-500/30 text-blue-400',
    [Rarity.EPIC]: 'border-purple-500/30 text-purple-400',
    [Rarity.MYTHIC]: 'border-orange-500/30 text-orange-400',
    [Rarity.LEGENDARY]: 'border-red-500/30 text-red-400',
    [Rarity.DIVINE]: 'border-yellow-400/30 text-yellow-400',
  };

  const filteredShopItems = useMemo(() => {
    return shopItems
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || item.type === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') return (a.basePrice || 0) - (b.basePrice || 0);
        if (sortBy === 'price_desc') return (b.basePrice || 0) - (a.basePrice || 0);
        if (sortBy === 'rarity') {
          const order = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.MYTHIC, Rarity.LEGENDARY, Rarity.DIVINE];
          return order.indexOf(b.rarity) - order.indexOf(a.rarity);
        }
        return 0;
      });
  }, [shopItems, searchQuery, categoryFilter, sortBy]);

  const filteredInventoryItems = useMemo(() => {
    if (!inventory) return [];
    return inventory.items
      .map(item => ({ ...item, template: itemTemplates.get(item.templateId) }))
      .filter(item => {
        if (!item.template) return false;
        const matchesSearch = item.template.name.toLowerCase().includes(invSearchQuery.toLowerCase());
        const matchesCategory = invCategoryFilter === 'ALL' || item.template.type === invCategoryFilter;
        return matchesSearch && matchesCategory;
      });
  }, [inventory, itemTemplates, invSearchQuery, invCategoryFilter]);

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

  const handleBuy = (item: ItemTemplate) => {
    const quantity = quantities[item.id] || 1;
    buyItem(item.id, quantity);
    setQuantities(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const getMaxAffordable = (item: ItemTemplate): number => {
    if (!character) return 0;
    const price = TradeService.getBuyPrice(item);
    if (price === 0) return 999;
    return Math.floor(character.money / price);
  };

  const wouldExceedSlots = (item: ItemTemplate, quantity: number): boolean => {
    if (!inventory || !itemTemplates) return false;
    const currentUsedSlots = InventoryService.getUsedSlots(inventory);
    const maxSlots = InventoryService.getMaxSlots(inventory, inventory.items, itemTemplates);

    const existingItem = inventory.items.find(
      i => i.templateId === item.id && i.quantity < item.stackSize
    );
    const needsNewSlot = !existingItem || (existingItem.quantity + quantity > item.stackSize);

    return needsNewSlot && (currentUsedSlots + 1 > maxSlots);
  };

  if (!building || !building.hasShop) {
    return <div className="text-gray-500 italic flex items-center gap-2 p-8 justify-center">
      <AlertCircle size={20} />
      В этом здании нет магазина.
    </div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
      {/* BUY SECTION */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-fantasy-accent font-serif uppercase flex items-center gap-2">
            <ShoppingCart size={18} />
            {building.name} - Покупка
          </h3>
          <div className="bg-black/40 px-3 py-1 border border-fantasy-border rounded-full text-[10px] text-fantasy-accent font-bold">
            Деньги: {character?.money ?? 0}
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-fantasy-surface border border-fantasy-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-fantasy-accent transition-colors"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <FilterButton 
              active={categoryFilter === 'ALL'} 
              onClick={() => setCategoryFilter('ALL')}
              label="Все"
            />
            {Object.values(ItemType).map(type => (
              <FilterButton 
                key={type}
                active={categoryFilter === type} 
                onClick={() => setCategoryFilter(type)}
                label={translateItemType(type)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={12} />
              Сортировка:
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setSortBy('rarity')}
                className={clsx("hover:text-fantasy-accent transition-colors", sortBy === 'rarity' && "text-fantasy-accent")}
              >
                Редкость
              </button>
              <button 
                onClick={() => setSortBy('price_asc')}
                className={clsx("hover:text-fantasy-accent transition-colors", sortBy === 'price_asc' && "text-fantasy-accent")}
              >
                Цена ↑
              </button>
              <button 
                onClick={() => setSortBy('price_desc')}
                className={clsx("hover:text-fantasy-accent transition-colors", sortBy === 'price_desc' && "text-fantasy-accent")}
              >
                Цена ↓
              </button>
              <button 
                onClick={() => setSortBy('name')}
                className={clsx("hover:text-fantasy-accent transition-colors", sortBy === 'name' && "text-fantasy-accent")}
              >
                Имя
              </button>
            </div>
          </div>
        </div>

        <div className="fantasy-panel flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
          <div className="grid grid-cols-1 gap-3">
            {filteredShopItems.length === 0 ? (
              <div className="text-gray-600 text-center py-12 italic text-sm">
                Ничего не найдено по вашему запросу.
              </div>
            ) : (
              filteredShopItems.map(item => {
                const price = TradeService.getBuyPrice(item);
                const quantity = quantities[item.id] || 1;
                const totalPrice = price * quantity;
                const maxAffordable = getMaxAffordable(item);
                const canAfford = (character?.money ?? 0) >= totalPrice;
                const maxStack = item.stackSize || 1;
                const exceedsSlots = wouldExceedSlots(item, quantity);
                const canBuy = canAfford && quantity >= 1 && !exceedsSlots;
                
                return (
                  <div 
                    key={item.id} 
                    className={clsx(
                      "flex flex-col p-3 border rounded-lg bg-fantasy-surface/40 hover:bg-fantasy-surface/60 transition-all group",
                      rarityColors[item.rarity].split(' ')[0] // Get border color only
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-3">
                        <div className={clsx(
                          "w-10 h-10 rounded bg-black/40 border flex items-center justify-center text-xl font-serif",
                          rarityColors[item.rarity]
                        )}>
                          {item.name[0]}
                        </div>
                        <div>
                          <div className={clsx("font-bold text-sm", rarityColors[item.rarity].split(' ')[1])}>
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                            <Tag size={10} />
                            {translateItemType(item.type)}
                            <span>•</span>
                            <span className={rarityColors[item.rarity].split(' ')[1]}>{translateRarity(item.rarity)}</span>
                          </div>

                          {/* Item Description */}
                          {item.description && (
                            <div className="mt-2 text-[10px] text-gray-300 italic leading-relaxed border-l-2 border-fantasy-accent/30 pl-2">
                              {item.description}
                            </div>
                          )}

                          {/* Item Effects */}
                          {(() => {
                            try {
                              if (!item.effects) return null;
                              const effectsArray = Array.isArray(item.effects) 
                                ? item.effects 
                                : (typeof item.effects === 'string' && item.effects.trim() ? JSON.parse(item.effects) : []);
                              if (!Array.isArray(effectsArray) || effectsArray.length === 0) return null;
                              
                              const validEffects = effectsArray
                                .map((effectId: string) => {
                                  if (!effectId || typeof effectId !== 'string') return null;
                                  const effect = StaticDataService.getEffectTemplate(effectId);
                                  return effect ? { id: effectId, effect } : null;
                                })
                                .filter((e: any) => e !== null);
                              
                              if (validEffects.length === 0) return null;
                              
                              return (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {validEffects.map(({ id, effect }: { id: string; effect: any }) => (
                                    <div 
                                      key={id}
                                      className={clsx(
                                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border flex items-center gap-1",
                                        effect.isNegative ? "bg-red-900/20 border-red-500/30 text-red-400" : "bg-green-900/20 border-green-500/30 text-green-400"
                                      )}
                                      title={effect.description || effect.name}
                                    >
                                      <span className="text-[10px]">✨</span>
                                      <span>{effect.name}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            } catch (e) {
                              // Silently fail if effects can't be rendered
                              return null;
                            }
                          })()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-fantasy-accent font-bold text-sm">{price}</div>
                        <div className="text-[9px] text-gray-500 uppercase">монет / шт.</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-auto">
                      <div className="flex items-center bg-black/30 rounded border border-fantasy-border/50 px-2 py-1 flex-1">
                        <span className="text-[9px] text-gray-500 uppercase font-bold mr-2">Кол-во:</span>
                        <input
                          type="number"
                          min="1"
                          max={Math.min(maxAffordable, maxStack > 1 ? maxStack : 999)}
                          value={quantities[item.id] || ''}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="bg-transparent w-full text-xs focus:outline-none quantity-input text-white"
                          placeholder="1"
                        />
                        <button 
                          onClick={() => handleQuantityChange(item.id, Math.min(maxAffordable, maxStack).toString())}
                          className="text-[9px] text-fantasy-accent hover:underline uppercase font-bold ml-2"
                        >
                          Max
                        </button>
                      </div>
                      <button 
                        onClick={() => handleBuy(item)}
                        disabled={!canBuy}
                        className={clsx(
                          "fantasy-button py-1 px-4 text-xs font-bold flex items-center gap-2 min-w-[100px] justify-center",
                          !canBuy && "opacity-50 grayscale cursor-not-allowed"
                        )}
                      >
                        {quantity > 1 ? `КУПИТЬ (${totalPrice})` : 'КУПИТЬ'}
                      </button>
                    </div>
                    
                    {/* Error Messages */}
                    <div className="flex flex-col gap-0.5 mt-2">
                      {!canAfford && (
                        <div className="text-[9px] text-red-500 flex items-center gap-1">
                          <AlertCircle size={10} /> Недостаточно денег (нужно {totalPrice})
                        </div>
                      )}
                      {exceedsSlots && (
                        <div className="text-[9px] text-red-500 flex items-center gap-1">
                          <AlertCircle size={10} /> Инвентарь переполнен
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SELL SECTION */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-400 font-serif uppercase flex items-center gap-2">
            <Package size={18} />
            Ваш инвентарь - Продажа
          </h3>
          <div className="text-[10px] text-gray-500 uppercase font-bold">
            Предметов: {inventory?.items.length || 0}
          </div>
        </div>

        {/* Inventory Search */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text"
              placeholder="Поиск в инвентаре..."
              value={invSearchQuery}
              onChange={(e) => setInvSearchQuery(e.target.value)}
              className="w-full bg-fantasy-surface border border-fantasy-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-fantasy-accent transition-colors"
            />
          </div>
          <select 
            value={invCategoryFilter}
            onChange={(e) => setInvCategoryFilter(e.target.value as any)}
            className="bg-fantasy-surface border border-fantasy-border rounded-lg px-2 text-[10px] text-gray-400 focus:outline-none"
          >
            <option value="ALL">Все типы</option>
            {Object.values(ItemType).map(t => (
              <option key={t} value={t}>{translateItemType(t)}</option>
            ))}
          </select>
        </div>

        <div className="fantasy-panel flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
          {filteredInventoryItems.length === 0 ? (
            <div className="text-gray-600 text-center py-12 italic text-sm">
              {invSearchQuery || invCategoryFilter !== 'ALL' ? 'Ничего не найдено.' : 'Инвентарь пуст.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredInventoryItems.map(item => {
                if (!item.template) return null;
                const sellPrice = TradeService.getSellPrice(item.template);
                
                return (
                  <div 
                    key={item.id} 
                    className={clsx(
                      "flex items-center justify-between p-2 border rounded bg-fantasy-surface/30 hover:bg-fantasy-surface/50 transition-colors group",
                      rarityColors[item.template.rarity].split(' ')[0]
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-8 h-8 rounded bg-black/40 border flex items-center justify-center text-sm font-serif",
                        rarityColors[item.template.rarity]
                      )}>
                        {item.template.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">
                          {item.template.name} {item.quantity > 1 && <span className="text-fantasy-accent">x{item.quantity}</span>}
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase font-bold">{translateRarity(item.template.rarity)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-green-600/70 font-bold text-xs">+{sellPrice * item.quantity}</div>
                        <div className="text-[8px] text-gray-500 uppercase">монет</div>
                      </div>
                      <button 
                        onClick={() => sellItem(item.id)}
                        className="p-2 bg-red-900/10 border border-red-900/30 hover:bg-red-900/30 rounded text-red-500 transition-colors"
                        title="Продать всё"
                      >
                        <ChevronRight size={16} />
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

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all whitespace-nowrap border",
      active 
        ? "bg-fantasy-accent border-fantasy-accent text-fantasy-dark shadow-[0_0_10px_rgba(197,160,89,0.3)]" 
        : "bg-black/40 border-fantasy-border text-gray-500 hover:border-gray-600"
    )}
  >
    {label}
  </button>
);




