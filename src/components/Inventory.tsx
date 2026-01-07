import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ExistingItem, ItemTemplate, Rarity, ItemType } from '../types/game';
import { 
  Package, Shield, Sword, Anchor, Hammer, Trash2, 
  Search, Filter, ArrowUpDown, CheckSquare, Square, Coins, Layers, Tag, Sparkles, Info
} from 'lucide-react';
import { clsx } from 'clsx';
import { InventoryService } from '../services/InventoryService';
import { TradeService } from '../services/TradeService';
import { StaticDataService } from '../services/StaticDataService';

type SortBy = 'recent' | 'name' | 'rarity' | 'quantity' | 'value';
type SlotFilter = 'all' | 'equipped' | 'unequipped' | 'sellable';
type CategoryFilter = ItemType | 'ALL';
type RarityFilter = Rarity | 'ALL';

export const Inventory: React.FC = () => {
  const { 
    character,
    inventory, 
    itemTemplates, 
    equipItem, 
    unequipItem, 
    repairItem, 
    discardItem,
    sellItem
  } = useGameStore();

  // * Shop detection
  const building = character?.location.buildingId 
    ? StaticDataService.getBuilding(character.location.buildingId) 
    : null;
  const isInShop = building?.hasShop === true;

  // * Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  // * Selection & details
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [discardQuantity, setDiscardQuantity] = useState<Record<string, number>>({});
  const [sellQuantity, setSellQuantity] = useState<Record<string, number>>({});

  if (!inventory) return null;

  const usedSlots = InventoryService.getUsedSlots(inventory);
  const maxSlots = InventoryService.getMaxSlots(inventory, inventory.items, itemTemplates);

  const rarityOrder = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.MYTHIC, Rarity.LEGENDARY, Rarity.DIVINE];

  const rarityTone: Record<Rarity, string> = {
    [Rarity.COMMON]: 'border-gray-600/60 bg-gray-900/40 text-gray-300',
    [Rarity.RARE]: 'border-blue-500/50 bg-blue-900/20 text-blue-200',
    [Rarity.EPIC]: 'border-purple-500/50 bg-purple-900/20 text-purple-200',
    [Rarity.MYTHIC]: 'border-emerald-500/50 bg-emerald-900/20 text-emerald-200',
    [Rarity.LEGENDARY]: 'border-orange-500/60 bg-orange-900/20 text-orange-200',
    [Rarity.DIVINE]: 'border-yellow-400/70 bg-yellow-900/20 text-yellow-200'
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case ItemType.WEAPON: return <Sword size={18} className="text-gray-200" />;
      case ItemType.ARMOR: return <Shield size={18} className="text-gray-200" />;
      case ItemType.SHIELD: return <Shield size={18} className="text-blue-300" />;
      case ItemType.ARTIFACT: return <Anchor size={18} className="text-purple-300" />;
      case ItemType.BAG: return <Package size={18} className="text-orange-300" />;
      default: return <Package size={18} className="text-gray-200" />;
    }
  };

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

  const isEquippable = (type: ItemType): boolean => {
    return [ItemType.WEAPON, ItemType.ARMOR, ItemType.SHIELD, ItemType.ARTIFACT, ItemType.BAG].includes(type);
  };

  // * Build enriched items
  const itemsWithTemplates = useMemo(() => {
    return inventory.items.map((item) => {
      const template = itemTemplates.get(item.templateId);
      return { item, template };
    }).filter(it => it.template);
  }, [inventory.items, itemTemplates]);

  // * Filters
  const filteredItems = useMemo(() => {
    return itemsWithTemplates
      .filter(({ item, template }) => {
        if (!template) return false;
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || template.type === categoryFilter;
        const matchesRarity = rarityFilter === 'ALL' || template.rarity === rarityFilter;
        const matchesSlot = (() => {
          switch (slotFilter) {
            case 'equipped': return item.isEquipped;
            case 'unequipped': return !item.isEquipped;
            case 'sellable': return Boolean(template.basePrice);
            default: return true;
          }
        })();
        return matchesSearch && matchesCategory && matchesRarity && matchesSlot;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.template!.name.localeCompare(b.template!.name);
        if (sortBy === 'rarity') return rarityOrder.indexOf(b.template!.rarity) - rarityOrder.indexOf(a.template!.rarity);
        if (sortBy === 'quantity') return b.item.quantity - a.item.quantity;
        if (sortBy === 'value') {
          const av = TradeService.getSellPrice(a.template!);
          const bv = TradeService.getSellPrice(b.template!);
          return bv - av;
        }
        // recent: keep existing order
        return 0;
      });
  }, [itemsWithTemplates, searchQuery, categoryFilter, rarityFilter, slotFilter, sortBy, rarityOrder]);

  // * Selected item
  const selectedItem = selectedItemId 
    ? filteredItems.find(({ item }) => item.id === selectedItemId) 
      || itemsWithTemplates.find(({ item }) => item.id === selectedItemId)
    : null;

  // * Comparison vs equipped of same type
  const getComparison = (template: ItemTemplate | undefined) => {
    if (!template) return null;
    const equippedSameType = inventory.items.find(it => {
      if (!it.isEquipped) return false;
      const t = itemTemplates.get(it.templateId);
      return t?.type === template.type;
    });
    if (!equippedSameType) return null;
    const equippedTemplate = itemTemplates.get(equippedSameType.templateId);
    if (!equippedTemplate) return null;

    const currentValue = (template.basePrice || 0) + (template.baseDurability || 0) * 0.1 + (template.baseEssence || 0);
    const equippedValue = (equippedTemplate.basePrice || 0) + (equippedTemplate.baseDurability || 0) * 0.1 + (equippedTemplate.baseEssence || 0);

    if (Math.abs(currentValue - equippedValue) < 0.01) {
      return { label: 'На уровне', tone: 'text-gray-300' };
    }
    return currentValue > equippedValue 
      ? { label: 'Лучше', tone: 'text-green-400' }
      : { label: 'Хуже', tone: 'text-red-400' };
  };

  // * Bulk helpers
  const toggleBulk = (id: string) => {
    setBulkSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearBulk = () => setBulkSelection(new Set());

  const bulkSelectedItems = itemsWithTemplates.filter(({ item }) => bulkSelection.has(item.id));
  const bulkValue = bulkSelectedItems.reduce((acc, curr) => acc + (curr.template ? TradeService.getSellPrice(curr.template) * curr.item.quantity : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif text-fantasy-accent uppercase tracking-widest flex items-center gap-2">
            <Package size={22} /> Инвентарь
          </h2>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest bg-black/30 border border-fantasy-border/50 px-3 py-1 rounded-full">
            Слоты {usedSlots}/{maxSlots}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold">
          <Layers size={12} /> {inventory.items.length} предметов
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full bg-fantasy-surface border border-fantasy-border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-fantasy-accent"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold">
            <ArrowUpDown size={12} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-fantasy-surface border border-fantasy-border rounded px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
            >
              <option value="recent">Недавно</option>
              <option value="name">Имя</option>
              <option value="rarity">Редкость</option>
              <option value="quantity">Количество</option>
              <option value="value">Ценность (продажа)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill 
            active={categoryFilter === 'ALL'} 
            onClick={() => setCategoryFilter('ALL')}
            label="Все"
          />
          {Object.values(ItemType).map(type => (
            <FilterPill 
              key={type}
              active={categoryFilter === type}
              onClick={() => setCategoryFilter(type)}
              label={translateItemType(type)}
            />
          ))}
          <div className="w-px h-6 bg-fantasy-border/40 mx-1" />
          <FilterPill 
            active={rarityFilter === 'ALL'}
            onClick={() => setRarityFilter('ALL')}
            label="Любая редкость"
          />
          {rarityOrder.map(r => (
            <FilterPill 
              key={r}
              active={rarityFilter === r}
              onClick={() => setRarityFilter(r)}
              label={translateRarity(r)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold text-gray-500">
          <ToggleButton 
            active={slotFilter === 'all'} 
            onClick={() => setSlotFilter('all')} 
            label="Все" 
            icon={<Filter size={11} />} 
          />
          <ToggleButton 
            active={slotFilter === 'equipped'} 
            onClick={() => setSlotFilter('equipped')} 
            label="Надето" 
            icon={<Sparkles size={11} />} 
          />
          <ToggleButton 
            active={slotFilter === 'unequipped'} 
            onClick={() => setSlotFilter('unequipped')} 
            label="Свободно" 
            icon={<Square size={11} />} 
          />
          <ToggleButton 
            active={slotFilter === 'sellable'} 
            onClick={() => setSlotFilter('sellable')} 
            label="Продаваемое" 
            icon={<Coins size={11} />} 
          />
        </div>
      </div>

      {/* Bulk actions */}
      {bulkSelection.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-fantasy-surface border border-fantasy-accent/30 rounded">
          <div className="text-[10px] uppercase font-bold text-fantasy-accent flex items-center gap-2">
            <CheckSquare size={12} /> Выбрано: {bulkSelection.size}
          </div>
          {isInShop && (
            <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
              <Coins size={12} /> Потенц. золото: {bulkValue}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {isInShop && (
              <button
                onClick={async () => {
                  // * Await all sell operations sequentially to prevent race conditions
                  for (const { item } of bulkSelectedItems) {
                    await sellItem(item.id, item.quantity);
                  }
                  clearBulk();
                }}
                className="px-3 py-1 text-[10px] uppercase font-bold bg-green-900/20 border border-green-700/50 rounded text-green-300 hover:bg-green-900/40"
              >
                Продать выбранное
              </button>
            )}
            <button
              onClick={async () => {
                // * Await all unequip operations sequentially to prevent race conditions
                const equippedItems = bulkSelectedItems.filter(({ item }) => item.isEquipped);
                for (const { item } of equippedItems) {
                  await unequipItem(item.id);
                }
                clearBulk();
              }}
              className="px-3 py-1 text-[10px] uppercase font-bold bg-blue-900/20 border border-blue-700/50 rounded text-blue-200 hover:bg-blue-900/40"
            >
              Снять выбранное
            </button>
            <button
              onClick={async () => {
                // * Await all discard operations sequentially to prevent race conditions
                for (const { item } of bulkSelectedItems) {
                  await discardItem(item.id, item.quantity);
                }
                clearBulk();
                setSelectedItemId(null);
              }}
              className="px-3 py-1 text-[10px] uppercase font-bold bg-red-900/20 border border-red-700/50 rounded text-red-300 hover:bg-red-900/40"
            >
              Выбросить
            </button>
            <button
              onClick={clearBulk}
              className="px-3 py-1 text-[10px] uppercase font-bold bg-black/30 border border-fantasy-border rounded text-gray-300 hover:bg-black/50"
            >
              Очистить
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12 bg-black/20 border border-fantasy-border/40 rounded">
            Нет предметов по выбранным фильтрам.
          </div>
        )}

        {filteredItems.map(({ item, template }) => {
          if (!template) return null;
          const comparison = getComparison(template);
          const isSelected = bulkSelection.has(item.id);
          const isFocused = selectedItemId === item.id;
          const sellPrice = TradeService.getSellPrice(template) * item.quantity;

          return (
            <div
              key={item.id}
              className={clsx(
                "relative p-3 rounded border shadow-sm transition-all bg-fantasy-surface/40 hover:bg-fantasy-surface/70 cursor-pointer",
                rarityTone[template.rarity],
                isFocused && "ring-2 ring-fantasy-accent",
                item.isEquipped && "shadow-[0_0_10px_rgba(197,160,89,0.25)]"
              )}
              onClick={() => setSelectedItemId(item.id)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-black/30 border border-fantasy-border/50 flex items-center justify-center">
                    {getItemIcon(template.type)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight line-clamp-1">{template.name}</div>
                    <div className="text-[9px] uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <Tag size={10} /> {translateItemType(template.type)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBulk(item.id);
                  }}
                  className="text-fantasy-accent hover:text-white transition-colors"
                  title="Выбрать для групповых действий"
                >
                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase font-bold text-gray-300">{translateRarity(template.rarity)}</div>
                {item.quantity > 1 && (
                  <div className="text-[10px] text-fantasy-accent font-bold bg-black/30 px-2 py-0.5 rounded">x{item.quantity}</div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-200 mb-2">
                <div className="flex items-center gap-1">
                  <Hammer size={12} className="text-gray-400" />
                  {template.baseDurability !== undefined ? `${item.currentDurability}/${template.baseDurability}` : '∞'}
                </div>
                <div className="flex items-center gap-1 text-green-300">
                  <Coins size={12} /> {sellPrice}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold">
                {item.isEquipped && (
                  <Badge label="Надето" tone="bg-fantasy-accent/20 text-fantasy-accent border-fantasy-accent/40" />
                )}
                {comparison && (
                  <Badge label={comparison.label} tone={`${comparison.tone} bg-black/20 border-fantasy-border/40`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Details Panel */}
      {selectedItem?.item && selectedItem.template && (
        <div className="p-4 bg-fantasy-surface border border-fantasy-accent/30 rounded shadow-2xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-fantasy-accent font-serif text-lg leading-tight uppercase tracking-wider">{selectedItem.template.name}</h3>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1">
                <Tag size={10} /> {translateRarity(selectedItem.template.rarity)} • {translateItemType(selectedItem.template.type)}
              </div>
            </div>
            <button
              onClick={() => setSelectedItemId(null)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
            {selectedItem.template.type === ItemType.BAG && selectedItem.template.slotCount && (
              <InfoRow label="Доп. слоты" value={`+${selectedItem.template.slotCount}`} accent="text-fantasy-accent" />
            )}
            {selectedItem.template.baseEssence && selectedItem.template.type !== ItemType.BAG && (
              <InfoRow label="Сущность" value={`${selectedItem.item.currentEssence} / ${selectedItem.template.maxEssence}`} accent="text-fantasy-essence" />
            )}
            
            {/* Бонусы и штрафы */}
            {((selectedItem.template.accuracyBonus || 0) - (selectedItem.template.hitPenalty || 0)) !== 0 && (
              <InfoRow 
                label="Точность" 
                value={`${(selectedItem.template.accuracyBonus || 0) - (selectedItem.template.hitPenalty || 0) > 0 ? '+' : ''}${(selectedItem.template.accuracyBonus || 0) - (selectedItem.template.hitPenalty || 0)}`} 
                accent={(selectedItem.template.accuracyBonus || 0) - (selectedItem.template.hitPenalty || 0) >= 0 ? "text-green-400" : "text-red-400"} 
              />
            )}
            {((selectedItem.template.evasionBonus || 0) - (selectedItem.template.evasionPenalty || 0)) !== 0 && (
              <InfoRow 
                label="Уклонение" 
                value={`${(selectedItem.template.evasionBonus || 0) - (selectedItem.template.evasionPenalty || 0) > 0 ? '+' : ''}${(selectedItem.template.evasionBonus || 0) - (selectedItem.template.evasionPenalty || 0)}`} 
                accent={(selectedItem.template.evasionBonus || 0) - (selectedItem.template.evasionPenalty || 0) >= 0 ? "text-green-400" : "text-red-400"} 
              />
            )}
            {selectedItem.template.initiativeBonus !== undefined && selectedItem.template.initiativeBonus !== 0 && (
              <InfoRow 
                label="Инициатива" 
                value={`${selectedItem.template.initiativeBonus > 0 ? '+' : ''}${selectedItem.template.initiativeBonus}`} 
                accent={selectedItem.template.initiativeBonus > 0 ? "text-blue-400" : "text-red-400"} 
              />
            )}
            {((selectedItem.template.resistanceBonus || 0) + (selectedItem.template.ignoreDamage || 0)) !== 0 && (
              <InfoRow 
                label="Снижение урона" 
                value={`${(selectedItem.template.resistanceBonus || 0) + (selectedItem.template.ignoreDamage || 0) > 0 ? '+' : ''}${(selectedItem.template.resistanceBonus || 0) + (selectedItem.template.ignoreDamage || 0)}`} 
                accent="text-fantasy-protection" 
              />
            )}
            {selectedItem.template.speedPenalty !== undefined && selectedItem.template.speedPenalty !== 0 && (
              <InfoRow 
                label="Штраф к скорости" 
                value={`-${selectedItem.template.speedPenalty}`} 
                accent="text-red-400" 
              />
            )}
            <InfoRow 
              label="Прочность" 
              value={`${selectedItem.item.currentDurability} / ${selectedItem.template.baseDurability ?? '∞'}`} 
            />
            <InfoRow 
              label="Ценность (продажа)" 
              value={`${TradeService.getSellPrice(selectedItem.template) * selectedItem.item.quantity}`} 
              accent="text-green-400"
            />
          </div>

          {/* Action Buttons */}
          <div className={clsx(
            "grid gap-2 pt-3 border-t border-fantasy-border/30 text-[11px] uppercase font-bold",
            isInShop ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
          )}>
            {isEquippable(selectedItem.template.type) && (
              <ActionButton
                onClick={() => {
                  if (selectedItem.item.isEquipped) {
                    unequipItem(selectedItem.item.id);
                  } else {
                    equipItem(selectedItem.item.id);
                  }
                }}
                label={selectedItem.item.isEquipped ? 'Снять' : 'Экипировать'}
              />
            )}

            {(selectedItem.template.type === ItemType.ARMOR || selectedItem.template.type === ItemType.SHIELD || selectedItem.template.type === ItemType.WEAPON) && (
              <ActionButton onClick={() => repairItem(selectedItem.item.id)} label="Починить (10)" />
            )}
          </div>

          {/* Sell section (only in shop) */}
          {isInShop && selectedItem.template.basePrice !== undefined && (
            <div className="flex items-center gap-2 pt-2 border-t border-fantasy-border/30">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">
                Продать:
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem.item.quantity}
                value={sellQuantity[selectedItem.item.id] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= selectedItem.item.quantity) {
                    setSellQuantity(prev => ({ ...prev, [selectedItem.item.id]: val }));
                  } else if (e.target.value === '') {
                    setSellQuantity(prev => {
                      const next = { ...prev };
                      delete next[selectedItem.item.id];
                      return next;
                    });
                  }
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) {
                    setSellQuantity(prev => {
                      const next = { ...prev };
                      delete next[selectedItem.item.id];
                      return next;
                    });
                  }
                }}
                className="flex-1 px-2 py-1 text-xs bg-fantasy-surface border border-fantasy-border rounded placeholder:text-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="1"
                style={{ caretColor: '#ffffff' }}
              />
              <button
                onClick={() => {
                  const qty = sellQuantity[selectedItem.item.id] || selectedItem.item.quantity;
                  sellItem(selectedItem.item.id, qty);
                  setSellQuantity(prev => {
                    const next = { ...prev };
                    delete next[selectedItem.item.id];
                    return next;
                  });
                  if (qty >= selectedItem.item.quantity) {
                    setSelectedItemId(null);
                  }
                }}
                disabled={selectedItem.item.quantity === 0}
                className="px-3 py-1 bg-green-900/20 border border-green-700/50 rounded text-[10px] uppercase font-bold text-green-300 hover:bg-green-900/40 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-1"
              >
                <Coins size={12} /> Продать {sellQuantity[selectedItem.item.id] ? `(${sellQuantity[selectedItem.item.id]})` : 'всё'}
              </button>
            </div>
          )}

          {/* Discard */}
          <div className="flex items-center gap-2 pt-2 border-t border-fantasy-border/30">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Выбросить:
            </label>
            <input
              type="number"
              min="1"
              max={selectedItem.item.quantity}
              value={discardQuantity[selectedItem.item.id] || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= selectedItem.item.quantity) {
                  setDiscardQuantity(prev => ({ ...prev, [selectedItem.item.id]: val }));
                } else if (e.target.value === '') {
                  setDiscardQuantity(prev => {
                    const next = { ...prev };
                    delete next[selectedItem.item.id];
                    return next;
                  });
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) {
                  setDiscardQuantity(prev => {
                    const next = { ...prev };
                    delete next[selectedItem.item.id];
                    return next;
                  });
                }
              }}
              className="flex-1 px-2 py-1 text-xs bg-fantasy-surface border border-fantasy-border rounded placeholder:text-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              placeholder="1"
              style={{ caretColor: '#ffffff' }}
            />
            <button
              onClick={() => {
                const qty = discardQuantity[selectedItem.item.id] || 1;
                discardItem(selectedItem.item.id, qty);
                setDiscardQuantity(prev => {
                  const next = { ...prev };
                  delete next[selectedItem.item.id];
                  return next;
                });
                if (qty >= selectedItem.item.quantity) {
                  setSelectedItemId(null);
                }
              }}
              disabled={!discardQuantity[selectedItem.item.id] || discardQuantity[selectedItem.item.id] < 1 || discardQuantity[selectedItem.item.id] > selectedItem.item.quantity}
              className="px-3 py-1 bg-red-900/20 border border-red-900/50 rounded text-[10px] uppercase font-bold text-red-400 hover:bg-red-900/40 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-1"
            >
              <Trash2 size={12} /> Выбросить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterPill: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={clsx(
      "px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all border",
      active 
        ? "bg-fantasy-accent text-fantasy-dark border-fantasy-accent shadow-[0_0_12px_rgba(197,160,89,0.3)]" 
        : "bg-black/30 border-fantasy-border text-gray-400 hover:border-gray-500"
    )}
  >
    {label}
  </button>
);

const ToggleButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={clsx(
      "px-3 py-1 rounded text-[10px] font-bold tracking-widest border flex items-center gap-1",
      active 
        ? "bg-fantasy-accent/20 text-fantasy-accent border-fantasy-accent/40" 
        : "bg-black/30 text-gray-400 border-fantasy-border hover:text-gray-200"
    )}
  >
    {icon}{label}
  </button>
);

const Badge: React.FC<{ label: string; tone: string }> = ({ label, tone }) => (
  <span className={clsx("px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest", tone)}>
    {label}
  </span>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode; accent?: string }> = ({ label, value, accent }) => (
  <div className="flex items-center justify-between border-b border-fantasy-border/30 pb-1">
    <span className="text-gray-500 text-[11px] uppercase tracking-widest">{label}</span>
    <span className={clsx("font-bold", accent)}>{value}</span>
  </div>
);

const ActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-2 bg-fantasy-accent/20 border border-fantasy-accent/40 rounded text-[11px] uppercase font-bold text-fantasy-accent hover:bg-fantasy-accent/30 transition-all"
  >
    {label}
  </button>
);



