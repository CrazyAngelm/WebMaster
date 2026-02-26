// 📁 src/components/ThreatPanel.tsx - Panel showing location monsters and chances
// 🎯 Core function: Display possible encounters in current location with probabilities
// 🔗 Key dependencies: StaticDataService, clsx for styling
// 💡 Usage: Integrated into CombatScreen to show dangers before exploring

import React from 'react';
import { StaticDataService } from '../services/StaticDataService';
import { clsx } from 'clsx';

interface ThreatPanelProps {
  encountersData: {
    locationId: string;
    emptyChance: number;
    encounters: {
      monsterId: string;
      chance: number;
    }[];
  } | null;
  loading: boolean;
}

export const ThreatPanel: React.FC<ThreatPanelProps> = ({ encountersData, loading }) => {
  if (loading) {
    return (
      <div className="bg-fantasy-surface/20 border border-fantasy-border/30 rounded-lg p-3 mb-4 max-w-2xl mx-auto">
        <div className="text-center text-gray-400 text-xs">Загрузка данных о локации...</div>
      </div>
    );
  }
  
  if (!encountersData) return null;
  
  return (
    <div className="bg-fantasy-surface/20 border border-fantasy-border/30 rounded-lg p-3 mb-3 w-full">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-fantasy-border/20">
        <span className="text-base">⚔️</span>
        <h4 className="text-xs font-serif text-fantasy-accent font-semibold">Опасности локации</h4>
      </div>
      
      {/* Список монстров */}
      <div className="space-y-1.5 mb-2">
        {encountersData.encounters.map((enc: { monsterId: string; chance: number }) => {
          const monster = StaticDataService.getMonsterTemplate(enc.monsterId);
          const rank = StaticDataService.getRankByOrder(monster?.rankOrder || 1);
          const monsterRank = monster?.rankOrder ?? 1;
          
          return (
            <div 
              key={enc.monsterId} 
              className="flex items-center justify-between bg-black/20 rounded px-2 py-1.5 hover:bg-black/30 transition-colors"
            >
              {/* Левая часть - иконка и имя */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm flex-shrink-0">{monster?.icon || '👾'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate font-medium leading-tight">
                    {monster?.name || 'Unknown'}
                  </div>
                  <span className={clsx(
                    "text-xs px-1 py-0.5 rounded font-medium",
                    {
                      "bg-green-500/20 text-green-400 border border-green-500/30": monsterRank === 1,
                      "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30": monsterRank === 2, 
                      "bg-red-500/20 text-red-400 border border-red-500/30": monsterRank >= 3
                    }
                  )}>
                    {rank?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              
              {/* Правая часть - шанс */}
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-xs text-fantasy-accent font-mono font-semibold">
                  {enc.chance}%
                </div>
                <div className="text-xs text-gray-500">
                  {enc.chance >= 30 ? 'Часто' : enc.chance >= 15 ? 'Иногда' : 'Редко'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Пустая встреча */}
      <div className="pt-2 border-t border-fantasy-border/20">
        <div className="flex items-center justify-between bg-black/20 rounded px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🌫️</span>
            <span className="text-xs text-gray-400 font-medium">Пустая встреча</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-mono font-semibold">
              {encountersData.emptyChance}%
            </div>
            <div className="text-xs text-gray-600">
              {encountersData.emptyChance >= 30 ? 'Часто' : encountersData.emptyChance >= 15 ? 'Иногда' : 'Редко'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Подсказка */}
      <div className="mt-2 pt-2 border-t border-fantasy-border/20">
        <div className="text-xs text-gray-500 text-center italic">
          💡 Вероятности при поиске конфликта
        </div>
      </div>
    </div>
  );
};
