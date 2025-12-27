// 📁 src/components/ShopView.tsx - Trading interface
// 🎯 Core function: UI for buying items from buildings and selling character items
// 🔗 Key dependencies: src/store/gameStore.ts, src/services/TradeService.ts
// 💡 Usage: Displayed when character enters a building with a shop

import React, { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { StaticDataService } from '../services/StaticDataService';
import { TradeService } from '../services/TradeService';
import { ItemTemplate, Rarity } from '../types/game';

export const ShopView: React.FC = () => {
  const { character, inventory, buyItem, sellItem, itemTemplates } = useGameStore();
  
  const building = character?.location.buildingId 
    ? StaticDataService.getBuilding(character.location.buildingId) 
    : null;

  // * Mock items for the shop based on building or just general templates
  const shopItems = useMemo(() => {
    return StaticDataService.getAllItemTemplates().filter(t => t.basePrice !== undefined);
  }, []);

  if (!building || !building.hasShop) {
    return <div className="text-gray-500 italic">This building does not have a shop.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
      {/* BUY SECTION */}
      <div className="flex flex-col h-full overflow-hidden">
        <h3 className="text-fantasy-accent font-serif mb-4 uppercase flex justify-between">
          <span>{building.name} - Wares</span>
          <span className="text-white text-xs">Your Money: {character?.money ?? 0}</span>
        </h3>
        <div className="fantasy-panel flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-3">
            {shopItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 border-b border-fantasy-border/30 hover:bg-white/5 transition-colors group">
                <div>
                  <div className="font-bold text-sm">{item.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">{item.type} • {item.rarity}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-fantasy-accent font-bold">{TradeService.getBuyPrice(item)}</div>
                  <button 
                    onClick={() => buyItem(item.id)}
                    disabled={(character?.money ?? 0) < TradeService.getBuyPrice(item)}
                    className="fantasy-button text-[10px] py-1 px-3 disabled:opacity-50 disabled:grayscale"
                  >
                    BUY
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SELL SECTION */}
      <div className="flex flex-col h-full overflow-hidden">
        <h3 className="text-gray-400 font-serif mb-4 uppercase">Your Inventory</h3>
        <div className="fantasy-panel flex-1 overflow-y-auto p-4 custom-scrollbar">
          {inventory?.items.length === 0 ? (
            <div className="text-gray-600 text-center py-8 italic">Inventory is empty.</div>
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
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{template.rarity}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-green-600/70 font-bold">{TradeService.getSellPrice(template)}</div>
                      <button 
                        onClick={() => sellItem(item.id)}
                        className="fantasy-button bg-red-900/20 border-red-900/50 hover:bg-red-900/40 text-[10px] py-1 px-3"
                      >
                        SELL
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



