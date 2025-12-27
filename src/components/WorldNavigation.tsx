// 📁 src/components/WorldNavigation.tsx - World map and travel
// 🎯 Core function: Interface for moving between locations and entering buildings
// 🔗 Key dependencies: src/store/gameStore.ts, src/services/StaticDataService.ts
// 💡 Usage: Main view for world exploration

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { StaticDataService } from '../services/StaticDataService';
import { ShopView } from './ShopView';

export const WorldNavigation: React.FC = () => {
  const { character, moveToLocation, enterBuilding, exitBuilding } = useGameStore();

  if (!character) return null;

  const currentLoc = StaticDataService.getLocation(character.location.locationId);
  const connections = StaticDataService.getConnections(character.location.locationId);
  const buildings = StaticDataService.getAllBuildings().filter(
    b => b.locationId === character.location.locationId
  );
  const currentBuilding = character.location.buildingId 
    ? StaticDataService.getBuilding(character.location.buildingId)
    : null;

  if (currentBuilding) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-serif text-fantasy-accent uppercase tracking-tight">
              {currentBuilding.name}
            </h2>
            <p className="text-gray-400 italic text-sm">{currentBuilding.description}</p>
          </div>
          <button 
            onClick={() => exitBuilding()}
            className="fantasy-button px-6"
          >
            Покинуть здание
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {currentBuilding.hasShop ? (
            <ShopView />
          ) : (
            <div className="fantasy-panel p-8 text-center text-gray-500 italic">
              Здесь пока нечего делать.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
      {/* Current Location Info */}
      <div className="md:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
        <div className="fantasy-panel p-6">
          <div className="text-[10px] text-fantasy-accent uppercase tracking-[0.2em] mb-2">Текущая локация</div>
          <h2 className="text-3xl font-serif text-white uppercase mb-4">{currentLoc?.name}</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">{currentLoc?.description}</p>
          <div className="flex gap-2">
            <span className={`text-[10px] px-2 py-1 border rounded uppercase ${
              currentLoc?.zoneType === 'GREEN' ? 'border-green-900/50 text-green-500' : 
              currentLoc?.zoneType === 'YELLOW' ? 'border-yellow-900/50 text-yellow-500' : 
              'border-red-900/50 text-red-500'
            }`}>
              {currentLoc?.zoneType === 'GREEN' ? 'ЗЕЛЁНАЯ' : currentLoc?.zoneType === 'YELLOW' ? 'ЖЁЛТАЯ' : 'КРАСНАЯ'} ЗОНА
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Здания</h3>
            {buildings.length === 0 ? (
              <div className="text-[10px] text-gray-600 italic px-2">Нет доступных зданий.</div>
            ) : (
              buildings.map(b => (
                <button
                  key={b.id}
                  onClick={() => enterBuilding(b.id)}
                  className="fantasy-panel p-4 text-left hover:border-fantasy-accent/50 transition-all group"
                >
                  <div className="text-sm font-bold group-hover:text-fantasy-accent">{b.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase mt-1">{b.hasShop ? 'Магазин' : 'Точка интереса'}</div>
                </button>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Пути перемещения</h3>
            {connections.map(c => {
              const target = StaticDataService.getLocation(c.toLocationId);
              return (
                <button
                  key={c.id}
                  onClick={() => moveToLocation(c.toLocationId)}
                  className="fantasy-panel p-4 text-left border-dashed hover:border-solid hover:border-fantasy-accent/50 transition-all group"
                >
                  <div className="text-sm font-bold group-hover:text-fantasy-accent">{target?.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase mt-1">{target?.zoneType === 'GREEN' ? 'Зелёная' : target?.zoneType === 'YELLOW' ? 'Жёлтая' : 'Красная'} зона</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exploration / Randomness Sidebar */}
      <div className="hidden md:flex flex-col gap-6 overflow-hidden">
        <div className="fantasy-panel p-4 flex-1 flex flex-col items-center justify-center text-center opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
          <div className="w-12 h-12 border border-fantasy-border rounded-full flex items-center justify-center mb-4">
            <span className="text-xl">🔍</span>
          </div>
          <div className="text-sm font-serif uppercase tracking-widest">Поиск области</div>
          <div className="text-[10px] text-gray-500 mt-2">НЕ РЕАЛИЗОВАНО</div>
        </div>
      </div>
    </div>
  );
};



