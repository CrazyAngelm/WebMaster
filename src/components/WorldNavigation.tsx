// 📁 src/components/WorldNavigation.tsx - World map and travel
// 🎯 Core function: Interface for moving between locations and entering buildings
// 🔗 Key dependencies: src/store/gameStore.ts, src/services/StaticDataService.ts
// 💡 Usage: Main view for world exploration

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { StaticDataService } from '../services/StaticDataService';
import { WorldService } from '../services/WorldService';
import { NPCService } from '../services/NPCService';
import { ShopView } from './ShopView';
import { NPCDialog } from './NPCDialog';
import { clsx } from 'clsx';
import { MessageCircle, Loader2, Sword, Skull, MapPin, Search, Hand } from 'lucide-react';
import { NPCData } from '../types/ai';

export const WorldNavigation: React.FC = () => {
  const { character, moveToLocation, enterBuilding, exitBuilding, activeQuests } = useGameStore();
  const [showDialog, setShowDialog] = useState(false);
  const [currentNPC, setCurrentNPC] = useState<NPCData | null>(null);
  const [isLoadingNPC, setIsLoadingNPC] = useState(false);
  const [locationAction, setLocationAction] = useState<'search' | 'interact' | 'hunt' | null>(null);

  const handleNavigateToCombat = () => {
    const event = new CustomEvent('navigateToCombat');
    window.dispatchEvent(event);
  };

  const handleTradeRequest = (buildingId: string) => {
    enterBuilding(buildingId);
    setShowDialog(false);
    setCurrentNPC(null);
  };

  const handleTalkToNPC = async (building: any) => {
    const currentCharacter = character;
    if (!currentCharacter || isLoadingNPC) {
      return;
    }

    const currentLoc = StaticDataService.getLocation(currentCharacter.location.locationId);
    if (!currentLoc) {
      return;
    }
    
    setIsLoadingNPC(true);
    try {
      const npc = await NPCService.getNPCForBuilding(building, currentLoc);
      setCurrentNPC(npc);
      setShowDialog(true);
    } catch (error) {
      console.error('Error loading NPC:', error);
    } finally {
      setIsLoadingNPC(false);
    }
  };

  const handleLocationAction = (action: 'search' | 'interact' | 'hunt') => {
    setLocationAction(action);
    
    if (action === 'hunt') {
      handleNavigateToCombat();
    }
    // For search/interact, show dialog or update UI
  };

  if (!character) return null;

  const currentLoc = StaticDataService.getLocation(character.location.locationId);
  const connections = StaticDataService.getConnections(character.location.locationId);
  const buildings = StaticDataService.getAllBuildings().filter(
    b => b.locationId === character.location.locationId
  );
  const currentBuilding = character.location.buildingId 
    ? StaticDataService.getBuilding(character.location.buildingId)
    : null;

  // * Safety check: if location not found, show error message
  if (!currentLoc) {
    return (
      <div className="fantasy-panel p-8 text-center">
        <div className="text-red-500 text-lg font-bold mb-2">Ошибка локации</div>
        <div className="text-gray-400 text-sm">
          Локация с ID "{character.location.locationId}" не найдена.
        </div>
      </div>
    );
  }

  if (currentBuilding) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-serif text-fantasy-accent uppercase tracking-tight">
              {currentBuilding.name}
            </h2>
            <p className="text-gray-400 italic text-sm">{currentBuilding.description}</p>
            {currentBuilding.canRest && (
              <p className="text-xs text-fantasy-accent mt-2 flex items-center gap-1">
                <span>🌙</span> Здесь можно отдохнуть (кнопка в боковой панели)
              </p>
            )}
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
                <div key={b.id} className="flex gap-2">
                  <button
                    onClick={() => enterBuilding(b.id)}
                    className="fantasy-panel p-4 text-left hover:border-fantasy-accent/50 transition-all group flex-1"
                  >
                    <div className="text-sm font-bold group-hover:text-fantasy-accent">{b.name}</div>
                    <div className="text-[10px] text-gray-500 uppercase mt-1">{b.hasShop ? 'Магазин' : 'Точка интереса'}</div>
                  </button>
                  <button
                    onClick={() => handleTalkToNPC(b)}
                    disabled={isLoadingNPC}
                    className="fantasy-panel p-4 hover:border-fantasy-accent/50 transition-all group flex-shrink-0"
                    title="Поговорить с NPC"
                  >
                    {isLoadingNPC ? (
                      <Loader2 className="animate-spin text-gray-500" size={20} />
                    ) : (
                      <MessageCircle className="text-fantasy-accent" size={20} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Пути перемещения</h3>
            {connections.length === 0 ? (
              <div className="text-[10px] text-gray-600 italic px-2">Нет доступных путей.</div>
            ) : (
              connections.map(c => {
                const target = StaticDataService.getLocation(c.toLocationId);
                const canMove = WorldService.canMoveTo(character, c.toLocationId);
                const isDisabled = !canMove.allowed;
                
                return (
                  <button
                    key={c.id}
                    onClick={() => moveToLocation(c.toLocationId)}
                    disabled={isDisabled}
                    className={clsx(
                      "fantasy-panel p-4 text-left border-dashed transition-all group",
                      isDisabled 
                        ? "opacity-50 cursor-not-allowed grayscale" 
                        : "hover:border-solid hover:border-fantasy-accent/50"
                    )}
                    title={isDisabled ? canMove.reason : undefined}
                  >
                    <div className="text-sm font-bold group-hover:text-fantasy-accent">{target?.name}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-gray-500 uppercase mt-1">
                        {target?.zoneType === 'GREEN' ? 'Зелёная' : target?.zoneType === 'YELLOW' ? 'Жёлтая' : 'Красная'} зона
                      </div>
                      {isDisabled && (
                        <span className="text-[9px] text-red-500 italic ml-2">
                          {canMove.reason}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Location Actions Sidebar */}
      <div className="hidden md:flex flex-col gap-6 overflow-hidden">
        <div className="fantasy-panel p-4 flex-1 flex flex-col">
          <div className="text-[10px] text-fantasy-accent uppercase tracking-[0.2em] mb-4">Действия в локации</div>
          
          {/* Active Quests in this location */}
          {activeQuests.filter(q => 
            q.status === 'IN_PROGRESS' && 
            q.objectives.some(o => o.type === 'VISIT' && o.targetId === character?.location.locationId)
          ).length > 0 && (
            <div className="mb-4 p-3 bg-fantasy-accent/10 border border-fantasy-accent/30 rounded">
              <div className="text-[10px] text-fantasy-accent uppercase mb-2 flex items-center gap-1">
                <MapPin size={10} /> Активные задания
              </div>
              {activeQuests.filter(q => 
                q.status === 'IN_PROGRESS' && 
                q.objectives.some(o => o.type === 'VISIT' && o.targetId === character?.location.locationId)
              ).map(q => (
                <div key={q.id} className="text-[10px] text-gray-300 mb-1">
                  • {q.title}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleLocationAction('search')}
              className="w-full fantasy-panel p-3 hover:border-fantasy-accent/50 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded bg-fantasy-accent/20 flex items-center justify-center">
                <Search size={16} className="text-fantasy-accent" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-200 group-hover:text-fantasy-accent">Исследовать</div>
                <div className="text-[9px] text-gray-500">Найти скрытое</div>
              </div>
            </button>

            <button
              onClick={() => handleLocationAction('interact')}
              className="w-full fantasy-panel p-3 hover:border-fantasy-accent/50 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded bg-fantasy-accent/20 flex items-center justify-center">
                <Hand size={16} className="text-fantasy-accent" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-200 group-hover:text-fantasy-accent">Взаимодействовать</div>
                <div className="text-[9px] text-gray-500">Осмотреть объекты</div>
              </div>
            </button>

            <button
              onClick={() => handleLocationAction('hunt')}
              className="w-full fantasy-panel p-3 hover:border-fantasy-accent/50 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded bg-red-900/30 flex items-center justify-center">
                <Sword size={16} className="text-red-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-200 group-hover:text-red-400">Охота</div>
                <div className="text-[9px] text-gray-500">Вступить в бой</div>
              </div>
            </button>
          </div>

          {/* Location Info */}
          <div className="mt-4 pt-4 border-t border-fantasy-border/30">
            <div className="text-[9px] text-gray-500 uppercase mb-2">Информация о локации</div>
            <div className="text-[10px] text-gray-400">
              {currentLoc?.zoneType === 'GREEN' && '🟢 Безопасная зона'}
              {currentLoc?.zoneType === 'YELLOW' && '🟡 Опасная зона'}
              {currentLoc?.zoneType === 'RED' && '🔴 Смертельно опасная зона'}
            </div>
          </div>
        </div>
      </div>

      {/* NPC Dialog */}
      {showDialog && currentNPC && (
        <NPCDialog
          npc={currentNPC}
          onClose={() => {
            setShowDialog(false);
            setCurrentNPC(null);
          }}
          onNavigateToCombat={handleNavigateToCombat}
          onTradeRequest={handleTradeRequest}
        />
      )}
    </div>
  );
};



