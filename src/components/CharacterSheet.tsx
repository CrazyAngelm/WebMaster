import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Shield, Zap, TrendingUp, Info, Battery, Moon, Lock, Hammer } from 'lucide-react';
import { StaticDataService } from '../services/StaticDataService';
import { ProfessionService } from '../services/ProfessionService';
import { clsx } from 'clsx';

export const CharacterSheet: React.FC = () => {
  const { character, ranks, rest, worldTime } = useGameStore();
  
  if (!character) return null;
  
  const rank = ranks.find(r => r.id === character.rankId);
  const building = character.location.buildingId ? StaticDataService.getBuilding(character.location.buildingId) : null;
  const canRestHere = building?.canRest || false;
  
  const TRAIN_COOLDOWN = 12;
  const timeSinceLastTrain = character.lastTrainTime !== undefined ? worldTime - character.lastTrainTime : 999;
  const trainCooldownRemaining = Math.max(0, TRAIN_COOLDOWN - timeSinceLastTrain);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-4 border-b border-fantasy-border pb-4">
        <div className="w-16 h-16 bg-fantasy-surface border border-fantasy-accent/50 rounded-full flex items-center justify-center">
          <span className="text-2xl font-serif text-fantasy-accent">{character.name[0]}</span>
        </div>
        <div>
          <h2 className="text-xl font-serif text-fantasy-accent uppercase tracking-widest">{character.name}</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold">
            <TrendingUp size={14} className="text-fantasy-accent" />
            <span>Rank {rank?.order}: {rank?.name}</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="space-y-4">
        {/* Essence Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs uppercase font-bold tracking-tighter">
            <span className="text-fantasy-essence flex items-center gap-1">
              <Zap size={12} /> Сущность
            </span>
            <div className="flex flex-col items-end">
              <span>{character.stats.essence.current} / {character.stats.essence.max}</span>
              {trainCooldownRemaining > 0 && (
                <span className="text-[9px] text-amber-500 opacity-70">
                  Откат культивации: {trainCooldownRemaining}ч
                </span>
              )}
            </div>
          </div>
          <div className="h-2 bg-black/50 border border-fantasy-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-900 to-fantasy-essence transition-all duration-500"
              style={{ width: `${(character.stats.essence.current / character.stats.essence.max) * 100}%` }}
            />
          </div>
        </div>

        {/* Energy Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs uppercase font-bold tracking-tighter">
            <span className="text-amber-500 flex items-center gap-1">
              <Battery size={12} /> Энергия
            </span>
            <span>{character.stats.energy.current} / {character.stats.energy.max}</span>
          </div>
          <div className="h-2 bg-black/50 border border-fantasy-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-900 to-amber-500 transition-all duration-500"
              style={{ width: `${(character.stats.energy.current / character.stats.energy.max) * 100}%` }}
            />
          </div>
        </div>

        {/* Protection Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs uppercase font-bold tracking-tighter">
            <span className="text-fantasy-protection flex items-center gap-1">
              <Shield size={12} /> Защита
            </span>
            <span>{character.stats.protection.current} / {character.stats.protection.max}</span>
          </div>
          <div className="h-2 bg-black/50 border border-fantasy-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-900 to-fantasy-protection transition-all duration-500"
              style={{ width: `${(character.stats.protection.current / character.stats.protection.max) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rest Button with Restrictions */}
      <div className="space-y-2">
        <button 
          disabled={!canRestHere || character.money < 10}
          onClick={rest}
          className={clsx(
            "w-full fantasy-button py-2 flex items-center justify-center gap-2 text-xs",
            (!canRestHere || character.money < 10) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {canRestHere ? <Moon size={14} /> : <Lock size={14} />}
          Отдохнуть (10 монет, 8ч)
        </button>
        {!canRestHere && (
          <div className="space-y-1">
            <p className="text-[10px] text-center text-fantasy-blood italic">
              * Отдых доступен только в тавернах
            </p>
            <p className="text-[9px] text-center text-gray-600 italic">
              Войдите в таверну через раздел "Мир"
            </p>
          </div>
        )}
        {canRestHere && character.money < 10 && (
          <p className="text-[10px] text-center text-fantasy-blood italic">
            * Недостаточно монет для отдыха (нужно 10)
          </p>
        )}
      </div>

      {/* Bonuses Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Уклонение" value={character.bonuses.evasion} color="text-gray-400" />
        <StatBox label="Точность" value={character.bonuses.accuracy} color="text-gray-400" />
        <StatBox label="Сопротивление" value={character.bonuses.damageResistance} color="text-gray-400" />
        <StatBox label="Инициатива" value={character.bonuses.initiative} color="text-gray-400" />
      </div>

      {/* Professions */}
      {character.professions && character.professions.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-fantasy-border/50">
          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-2">
            <Hammer size={12} /> Профессии
          </div>
          <div className="space-y-2">
            {character.professions.map((prof) => (
              <div key={prof.type} className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span className="text-gray-400">{prof.type}</span>
                  <span className="text-fantasy-accent">{ProfessionService.getRankName(prof.rank)} ({prof.exp} XP)</span>
                </div>
                <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-fantasy-accent opacity-50 transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (prof.exp / (ProfessionService.RANK_THRESHOLDS.find(t => t.rank === prof.rank)?.minExp || 100)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bio / Description */}
      <div className="p-3 bg-black/30 border border-fantasy-border rounded text-sm text-gray-400 italic leading-relaxed">
        <div className="flex items-center gap-1 not-italic text-xs font-bold uppercase text-gray-500 mb-1">
          <Info size={12} /> Биография
        </div>
        {character.bio}
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="p-2 bg-fantasy-surface/50 border border-fantasy-border rounded flex flex-col items-center">
    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-tighter">{label}</span>
    <span className={clsx("text-lg font-serif", color)}>{value > 0 ? `+${value}` : value}</span>
  </div>
);



