import React, { ReactNode } from 'react';
import { Shield, User, Package, Map as MapIcon, Sword, Clock } from 'lucide-react';
import { CharacterSheet } from './CharacterSheet';
import { SaveManager } from './SaveManager';
import { useCombatStore } from '../store/combatStore';
import { useGameStore } from '../store/gameStore';
import { clsx } from 'clsx';

interface LayoutProps {
  children: ReactNode;
  onNavigate?: (view: 'character' | 'inventory' | 'world' | 'combat') => void;
  activeView?: 'character' | 'inventory' | 'world' | 'combat';
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, activeView }) => {
  const { battle } = useCombatStore();
  const { worldTime } = useGameStore();

  const formatTime = (totalHours: number) => {
    const days = Math.floor(totalHours / 24) + 1;
    const hours = totalHours % 24;
    return `День ${days}, ${hours.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-fantasy-surface border-b border-fantasy-border flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="text-fantasy-accent w-6 h-6" />
            <span className="font-serif text-xl tracking-widest text-fantasy-accent">WEBMASTER</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-1 bg-black/30 border border-fantasy-border rounded text-xs text-fantasy-accent font-mono">
            <Clock size={14} />
            {formatTime(worldTime)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SaveManager />
          <nav className="flex gap-6">
            <button 
              onClick={() => onNavigate?.('character')}
              className={`flex items-center gap-2 transition-colors ${
                activeView === 'character' 
                  ? 'text-fantasy-accent' 
                  : 'text-gray-400 hover:text-fantasy-accent'
              }`}
            >
              <User size={18} />
              <span className="text-xs uppercase font-bold tracking-tighter">Персонаж</span>
            </button>
            <button 
              onClick={() => onNavigate?.('inventory')}
              className={`flex items-center gap-2 transition-colors ${
                activeView === 'inventory' 
                  ? 'text-fantasy-accent' 
                  : 'text-gray-400 hover:text-fantasy-accent'
              }`}
            >
              <Package size={18} />
              <span className="text-xs uppercase font-bold tracking-tighter">Инвентарь</span>
            </button>
            <button 
              onClick={() => onNavigate?.('world')}
              className={`flex items-center gap-2 transition-colors ${
                activeView === 'world' 
                  ? 'text-fantasy-accent' 
                  : 'text-gray-400 hover:text-fantasy-accent'
              }`}
            >
              <MapIcon size={18} />
              <span className="text-xs uppercase font-bold tracking-tighter">Мир</span>
            </button>
            <button 
              onClick={() => onNavigate?.('combat')}
              className={`flex items-center gap-2 transition-colors ${
                activeView === 'combat' 
                  ? 'text-fantasy-accent' 
                  : 'text-gray-400 hover:text-fantasy-accent'
              }`}
            >
              <Sword size={18} />
              <span className="text-xs uppercase font-bold tracking-tighter">Бой</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Left: Character Stats */}
        <aside className="w-72 bg-fantasy-surface border-r border-fantasy-border overflow-y-auto hidden lg:block p-6">
          <CharacterSheet />
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto bg-fantasy-dark p-6">
          {children}
        </section>

        {/* Sidebar Right: Log / Notifications */}
        <aside className="w-80 bg-fantasy-surface border-l border-fantasy-border flex flex-col overflow-hidden hidden xl:flex">
          <div className="p-3 border-b border-fantasy-border bg-fantasy-surface/50">
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
              {battle ? 'Журнал боя' : 'Общий журнал'}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[10px] font-mono uppercase tracking-tighter">
            {battle ? (
              battle.log.map((entry, i) => (
                <div key={i} className={clsx("pl-2 border-l border-fantasy-accent/30", entry.includes('damage') ? "text-fantasy-blood" : "text-gray-400")}>
                  {entry}
                </div>
              ))
            ) : (
              <>
                <div className="text-gray-500">[Система] Добро пожаловать в Хорниград.</div>
                <div className="text-gray-500">[Система] Ресурсы загружены.</div>
                <div className="text-gray-500">[Система] Готов к культивации.</div>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

