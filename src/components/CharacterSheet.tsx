import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Shield, Zap, TrendingUp, Info } from 'lucide-react';
import { clsx } from 'clsx';

export const CharacterSheet: React.FC = () => {
  const { character, ranks } = useGameStore();
  
  if (!character) return null;
  
  const rank = ranks.find(r => r.id === character.rankId);

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
              <Zap size={12} /> Essence
            </span>
            <span>{character.stats.essence.current} / {character.stats.essence.max}</span>
          </div>
          <div className="h-2 bg-black/50 border border-fantasy-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-900 to-fantasy-essence transition-all duration-500"
              style={{ width: `${(character.stats.essence.current / character.stats.essence.max) * 100}%` }}
            />
          </div>
        </div>

        {/* Protection Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs uppercase font-bold tracking-tighter">
            <span className="text-fantasy-protection flex items-center gap-1">
              <Shield size={12} /> Protection
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

      {/* Bonuses Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Evasion" value={character.bonuses.evasion} color="text-gray-400" />
        <StatBox label="Accuracy" value={character.bonuses.accuracy} color="text-gray-400" />
        <StatBox label="Resistance" value={character.bonuses.damageResistance} color="text-gray-400" />
        <StatBox label="Initiative" value={character.bonuses.initiative} color="text-gray-400" />
      </div>

      {/* Bio / Description */}
      <div className="p-3 bg-black/30 border border-fantasy-border rounded text-sm text-gray-400 italic leading-relaxed">
        <div className="flex items-center gap-1 not-italic text-xs font-bold uppercase text-gray-500 mb-1">
          <Info size={12} /> Biography
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



