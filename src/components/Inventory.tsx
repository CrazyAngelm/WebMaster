import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ExistingItem, ItemTemplate, Rarity, ItemType } from '../types/game';
import { Package, Shield, Sword, Anchor, Info } from 'lucide-react';
import { clsx } from 'clsx';

export const Inventory: React.FC = () => {
  const { inventory, itemTemplates, equipItem, unequipItem } = useGameStore();
  const [hoveredItem, setHoveredItem] = useState<{ item: ExistingItem; template: ItemTemplate } | null>(null);

  if (!inventory) return null;

  // Fill up to 10 slots for the grid view
  const slots = [...inventory.items];
  while (slots.length < 10) {
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
      case ItemType.ARTIFACT: return <Anchor size={20} className="text-gray-400" />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-fantasy-accent uppercase tracking-widest flex items-center gap-2">
          <Package size={24} /> Инвентарь
        </h2>
        <div className="text-xs text-gray-500 uppercase font-bold tracking-tighter">
          Вес: {slots.filter(s => s).reduce((acc, s) => acc + (itemTemplates.get(s.templateId)?.weight || 0), 0)} / {inventory.maxWeight}
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

          return (
            <div 
              key={item.id}
              className={clsx(
                "aspect-square border-2 rounded relative cursor-pointer transition-all hover:scale-105 group",
                getRarityColor(template.rarity),
                item.isEquipped && "ring-2 ring-fantasy-accent ring-offset-2 ring-offset-fantasy-dark"
              )}
              onMouseEnter={() => setHoveredItem({ item, template })}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => item.isEquipped ? unequipItem(item.id) : equipItem(item.id)}
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

      {/* Tooltip (Simplified Inline for now) */}
      {hoveredItem && (
        <div className="p-4 bg-fantasy-surface border border-fantasy-accent/30 rounded shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-fantasy-accent font-serif text-lg leading-tight uppercase tracking-wider">{hoveredItem.template.name}</h3>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{translateRarity(hoveredItem.template.rarity)} {translateItemType(hoveredItem.template.type)}</div>
            </div>
            <div className="text-xs bg-black/30 px-2 py-1 rounded border border-fantasy-border text-gray-400">
              {hoveredItem.template.weight}kg
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-300">
            {hoveredItem.template.baseEssence && (
              <div className="flex justify-between border-b border-fantasy-border/30 pb-1">
                <span className="text-gray-500">Сущность оружия:</span>
                <span className="text-fantasy-essence font-bold">{hoveredItem.item.currentEssence} / {hoveredItem.template.maxEssence}</span>
              </div>
            )}
            {hoveredItem.template.ignoreDamage && (
              <div className="flex justify-between border-b border-fantasy-border/30 pb-1">
                <span className="text-gray-500">Снижение урона:</span>
                <span className="text-fantasy-protection font-bold">{hoveredItem.template.ignoreDamage}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-fantasy-border/30 pb-1">
              <span className="text-gray-500">Прочность:</span>
              <span>{hoveredItem.item.currentDurability} / {hoveredItem.template.baseDurability || '∞'}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500 italic">
            <Info size={12} />
            Нажмите, чтобы {hoveredItem.item.isEquipped ? 'снять' : 'экипировать'}
          </div>
        </div>
      )}
    </div>
  );
};



