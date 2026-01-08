// 📁 src/components/CharacterQuickInfo.tsx - Compact character status
// 🎯 Core function: Quick display of money and current position
// 🔗 Key dependencies: src/store/gameStore.ts, lucide-react
// 💡 Usage: Integrated into header or sidebar for persistent info

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Coins, MapPin } from 'lucide-react';

export const CharacterQuickInfo: React.FC = () => {
  const { character } = useGameStore();

  if (!character) return null;

  return (
    <div className="flex items-center gap-4 bg-black/40 border border-fantasy-border/50 rounded-lg px-3 py-1.5 shadow-inner">
      <div className="flex items-center gap-2" title="Ваши деньги">
        <Coins size={14} className="text-fantasy-accent shadow-[0_0_8px_rgba(197,160,89,0.3)]" />
        <span className="text-xs font-bold text-white tracking-tighter">
          {character.money.toLocaleString()}
        </span>
      </div>
      
      <div className="w-px h-3 bg-fantasy-border/50" />
      
      <div className="flex items-center gap-2 overflow-hidden" title="Текущая локация">
        <MapPin size={14} className="text-fantasy-accent" />
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest truncate max-w-[120px]">
          {character.location.position}
        </span>
      </div>
    </div>
  );
};


