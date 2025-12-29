import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ExistingItem, ItemTemplate, Rarity, ItemType } from '../types/game';
import { Package, Shield, Sword, Anchor, Info, Hammer, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { InventoryService } from '../services/InventoryService';

export const Inventory: React.FC = () => {
  const { inventory, itemTemplates, equipItem, unequipItem, repairItem, discardItem } = useGameStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [discardQuantity, setDiscardQuantity] = useState<Record<string, number>>({});

  if (!inventory) return null;

  const usedSlots = InventoryService.getUsedSlots(inventory);
  const maxSlots = InventoryService.getMaxSlots(inventory, inventory.items, itemTemplates);

  const selectedItem = selectedItemId ? inventory.items.find(i => i.id === selectedItemId) : null;
  const selectedTemplate = selectedItem ? itemTemplates.get(selectedItem.templateId) : null;

  // Fill up to maxSlots for the grid view
  const slots = [...inventory.items];
  while (slots.length < maxSlots) {
    slots.push(null as any);
  }

  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON: return 'border-gray-600 bg-gray-900/50';
      case Rarity.RARE: return 'border-blue-600 bg-blue-900/20';
      case Rarity.EPIC: return 'border-purple-600 bg-purple-900/20';
      case Rarity.MYTHIC: return 'border-emerald-600 bg-emerald-900/20';
      case Rarity.LEGENDARY: return 'border-orange-600 bg-orange-900/20';
      case Rarity.DIVINE: return 'border-yellow-400 bg-yellow-900/30';
      default: return 'border-gray-600';
    }
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case ItemType.WEAPON: return <Sword size={20} className="text-gray-400" />;
      case ItemType.ARMOR: return <Shield size={20} className="text-gray-400" />;
      case ItemType.SHIELD: return <Shield size={20} className="text-blue-400" />;
      case ItemType.ARTIFACT: return <Anchor size={20} className="text-purple-400" />;
      case ItemType.BAG: return <Package size={20} className="text-orange-400" />;
      default: return <Package size={20} className="text-gray-400" />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-fantasy-accent uppercase tracking-widest flex items-center gap-2">
          <Package size={24} /> Инвентарь
        </h2>
        <div className="text-xs text-gray-500 uppercase font-bold tracking-tighter">
          Слоты: {usedSlots} / {maxSlots}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {slots.map((item, index) => {
          if (!item) {
            return (
              <div key={`empty-${index}`} className="aspect-square bg-black/20 border border-fantasy-border/30 rounded flex items-center justify-center opacity-50">
                <div className="w-4 h-4 rounded-full border border-fantasy-border/50" />
              </div>
            );
          }

          const template = itemTemplates.get(item.templateId);
          if (!template) return null;

          const canEquip = isEquippable(template.type);

          const isSelected = selectedItemId === item.id;

          return (
            <div 
              key={item.id}
              className={clsx(
                "aspect-square border-2 rounded relative transition-all cursor-pointer hover:scale-105",
                getRarityColor(template.rarity),
                item.isEquipped && "ring-2 ring-fantasy-accent ring-offset-2 ring-offset-fantasy-dark",
                isSelected && "ring-2 ring-fantasy-accent ring-offset-2 ring-offset-fantasy-dark"
              )}
              onClick={() => setSelectedItemId(item.id)}
            >
              <div className="w-full h-full flex items-center justify-center">
                {getItemIcon(template.type)}
              </div>
              
              {item.quantity > 1 && (
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 px-1 rounded text-white font-bold">
                  x{item.quantity}
                </span>
              )}

              {item.isEquipped && (
                <div className="absolute top-0 left-0 w-full h-full border-2 border-fantasy-accent pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Item Details Panel */}
      {selectedItem && selectedTemplate && (
        <div className="p-4 bg-fantasy-surface border border-fantasy-accent/30 rounded shadow-2xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-fantasy-accent font-serif text-lg leading-tight uppercase tracking-wider">{selectedTemplate.name}</h3>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{translateRarity(selectedTemplate.rarity)} {translateItemType(selectedTemplate.type)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedItemId(null)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="Закрыть"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-300 mb-4">
            {selectedTemplate.type === ItemType.BAG && (
              <div className="flex justify-between border-b border-fantasy-border/30 pb-1">
                <span className="text-gray-500">Доп. слоты:</span>
                <span className="text-fantasy-accent font-bold">+{selectedTemplate.slotCount}</span>
              </div>
            )}
            {selectedTemplate.baseEssence && selectedTemplate.type !== ItemType.BAG && (
              <div className="flex justify-between border-b border-fantasy-border/30 pb-1">
                <span className="text-gray-500">Сущность оружия:</span>
                <span className="text-fantasy-essence font-bold">{selectedItem.currentEssence} / {selectedTemplate.maxEssence}</span>
              </div>
            )}
            {selectedTemplate.ignoreDamage && (
              <div className="flex justify-between border-b border-fantasy-border/30 pb-1">
                <span className="text-gray-500">Снижение урона:</span>
                <span className="text-fantasy-protection font-bold">{selectedTemplate.ignoreDamage}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-fantasy-border/30 pb-1">
              <span className="text-gray-500">Прочность:</span>
              <span>{selectedItem.currentDurability} / {selectedTemplate.baseDurability || '∞'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-fantasy-border/30">
            {/* Equip/Unequip button */}
            {isEquippable(selectedTemplate.type) && (
              <button
                onClick={() => {
                  if (selectedItem.isEquipped) {
                    unequipItem(selectedItem.id);
                  } else {
                    equipItem(selectedItem.id);
                  }
                }}
                className="w-full py-2 bg-fantasy-accent/20 border border-fantasy-accent/50 rounded text-xs uppercase font-bold text-fantasy-accent hover:bg-fantasy-accent/30 flex items-center justify-center gap-2"
              >
                {selectedItem.isEquipped ? 'Снять' : 'Экипировать'}
              </button>
            )}

            {/* Repair button */}
            {(selectedTemplate.type === ItemType.ARMOR || selectedTemplate.type === ItemType.SHIELD || selectedTemplate.type === ItemType.WEAPON) && (
              <button
                onClick={() => repairItem(selectedItem.id)}
                className="w-full py-2 bg-fantasy-accent/20 border border-fantasy-accent/50 rounded text-xs uppercase font-bold text-fantasy-accent hover:bg-fantasy-accent/30 flex items-center justify-center gap-2"
              >
                <Hammer size={14} /> Починить (10 монет)
              </button>
            )}

            {/* Discard section */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">
                Выбросить:
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem.quantity}
                value={discardQuantity[selectedItem.id] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= selectedItem.quantity) {
                    setDiscardQuantity(prev => ({ ...prev, [selectedItem.id]: val }));
                  } else if (e.target.value === '') {
                    setDiscardQuantity(prev => {
                      const next = { ...prev };
                      delete next[selectedItem.id!];
                      return next;
                    });
                  }
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) {
                    setDiscardQuantity(prev => {
                      const next = { ...prev };
                      delete next[selectedItem.id!];
                      return next;
                    });
                  }
                }}
                className="flex-1 px-2 py-1 text-xs bg-fantasy-surface border border-fantasy-border rounded placeholder:text-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="1"
                style={{ 
                  caretColor: '#ffffff'
                }}
              />
              <button
                onClick={() => {
                  const qty = discardQuantity[selectedItem.id] || 1;
                  discardItem(selectedItem.id, qty);
                  setDiscardQuantity(prev => {
                    const next = { ...prev };
                    delete next[selectedItem.id];
                    return next;
                  });
                  // * If all items discarded, close the panel
                  if (qty >= selectedItem.quantity) {
                    setSelectedItemId(null);
                  }
                }}
                disabled={!discardQuantity[selectedItem.id] || discardQuantity[selectedItem.id] < 1 || discardQuantity[selectedItem.id] > selectedItem.quantity}
                className="px-3 py-1 bg-red-900/20 border border-red-900/50 rounded text-[10px] uppercase font-bold text-red-400 hover:bg-red-900/40 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-1"
              >
                <Trash2 size={12} /> Выбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



