// 📁 src/components/Layout.tsx - Main layout wrapper
// 🎯 Core function: Shared UI elements (header, sidebars) and admin access
// 🔗 Key dependencies: React, lucide-react, useGameStore, components/*
// 💡 Usage: Wraps main game content

import React, { ReactNode, useState } from 'react';
import { Shield, User, Package, Map as MapIcon, Sword, Clock, Hammer, Settings, MessageSquare, ScrollText } from 'lucide-react';
import { CharacterSheet } from './CharacterSheet';
import { AdminPanel } from './AdminPanel';
import { useCombatStore } from '../store/combatStore';
import { useGameStore } from '../store/gameStore';
import { clsx } from 'clsx';
import { Notification } from './Notification';
import { CharacterQuickInfo } from './CharacterQuickInfo';
import { QuestLog } from './QuestLog';

interface LayoutProps {
  children: ReactNode;
  onNavigate?: (view: 'character' | 'inventory' | 'world' | 'combat' | 'crafting') => void;
  activeView?: 'character' | 'inventory' | 'world' | 'combat' | 'crafting';
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, activeView }) => {
  const { battle } = useCombatStore();
  const { serverTime, user, activeQuests } = useGameStore();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'log' | 'quests'>('log');

  const formatTime = (totalHours: number) => {
    const days = Math.floor(totalHours / 24) + 1;
    const hours = Math.floor(totalHours % 24);
    const minutes = Math.floor((totalHours * 60) % 60);
    return `День ${days}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const completedQuestsCount = activeQuests.filter(q => q.status === 'COMPLETED').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-fantasy-dark">
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      <Notification />
      
      {/* Top Header */}
      <header className="h-16 bg-fantasy-surface/90 backdrop-blur-md border-b border-fantasy-border flex items-center justify-between px-6 z-20 sticky top-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 bg-fantasy-accent/10 border border-fantasy-accent/30 rounded flex items-center justify-center group-hover:bg-fantasy-accent/20 transition-all">
              <Shield className="text-fantasy-accent w-5 h-5" />
            </div>
            <span className="font-serif text-xl tracking-[0.2em] text-fantasy-accent hidden sm:block">WEBMASTER</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-fantasy-border/50 rounded-full text-[10px] text-gray-400 font-mono tracking-wider">
              <Clock size={12} className="text-fantasy-accent" />
              {formatTime(serverTime)}
            </div>
            <CharacterQuickInfo />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="flex gap-1">
            <NavButton 
              active={activeView === 'character'} 
              onClick={() => onNavigate?.('character')} 
              icon={<User size={16} />} 
              label="Персонаж" 
            />
            <NavButton 
              active={activeView === 'inventory'} 
              onClick={() => onNavigate?.('inventory')} 
              icon={<Package size={16} />} 
              label="Инвентарь" 
            />
            <NavButton 
              active={activeView === 'world'} 
              onClick={() => onNavigate?.('world')} 
              icon={<MapIcon size={16} />} 
              label="Мир" 
            />
            <NavButton 
              active={activeView === 'combat'} 
              onClick={() => onNavigate?.('combat')} 
              icon={<Sword size={16} />} 
              label="Бой" 
            />
            <NavButton 
              active={activeView === 'crafting'} 
              onClick={() => onNavigate?.('crafting')} 
              icon={<Hammer size={16} />} 
              label="Ремесло" 
            />
          </nav>

          <div className="h-6 w-px bg-fantasy-border/50 hidden md:block" />

          {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="p-2 text-yellow-600/70 hover:text-yellow-500 transition-colors bg-yellow-500/5 rounded"
              title="Админ-панель"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Left: Character Stats */}
        <aside className="w-72 bg-fantasy-surface/50 border-r border-fantasy-border overflow-y-auto hidden lg:block p-6 custom-scrollbar">
          <CharacterSheet />
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto bg-fantasy-dark/50 p-6 relative">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </section>

        {/* Sidebar Right: Log / Quests */}
        <aside className="w-80 bg-fantasy-surface/80 border-l border-fantasy-border flex flex-col overflow-hidden hidden lg:flex">
          {/* Tabs */}
          <div className="flex border-b border-fantasy-border bg-black/20">
            <button 
              onClick={() => setSidebarTab('log')}
              className={clsx(
                "flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2",
                sidebarTab === 'log' 
                  ? "text-fantasy-accent border-fantasy-accent bg-fantasy-accent/5" 
                  : "text-gray-500 border-transparent hover:text-gray-400"
              )}
            >
              <MessageSquare size={12} />
              Журнал
            </button>
            <button 
              onClick={() => setSidebarTab('quests')}
              className={clsx(
                "flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 relative",
                sidebarTab === 'quests' 
                  ? "text-fantasy-accent border-fantasy-accent bg-fantasy-accent/5" 
                  : "text-gray-500 border-transparent hover:text-gray-400"
              )}
            >
              <ScrollText size={12} />
              Квесты
              {completedQuestsCount > 0 && (
                <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {sidebarTab === 'log' ? (
              <div className="space-y-2 text-[10px] font-mono uppercase tracking-tighter">
                <div className="mb-4 pb-2 border-b border-fantasy-border/30 text-gray-500 font-bold flex items-center gap-2">
                   {battle ? 'СОБЫТИЯ БИТВЫ' : 'ИСТОРИЯ МИРА'}
                </div>
                {battle ? (
                  battle.log.map((entry, i) => (
                    <div key={i} className={clsx("pl-3 border-l-2 py-0.5", entry.includes('damage') ? "text-fantasy-blood border-fantasy-blood/30" : "text-gray-400 border-fantasy-accent/20")}>
                      {entry}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-gray-500 opacity-60 flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-700 rounded-full" />
                      [Система] Добро пожаловать в Хорниград.
                    </div>
                    <div className="text-gray-500 opacity-60 flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-700 rounded-full" />
                      [Система] Ресурсы загружены.
                    </div>
                    <div className="text-gray-500 opacity-60 flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-700 rounded-full" />
                      [Система] Готов к культивации.
                    </div>
                  </>
                )}
              </div>
            ) : (
              <QuestLog />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center justify-center w-16 h-12 transition-all gap-1 rounded hover:bg-white/5",
      active ? "text-fantasy-accent" : "text-gray-500 hover:text-gray-400"
    )}
  >
    {icon}
    <span className="text-[8px] uppercase font-bold tracking-tighter">{label}</span>
  </button>
);

