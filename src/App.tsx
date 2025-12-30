// 📁 src/App.tsx - Main application entry point
// 🎯 Core function: Routing and authentication flow management
// 🔗 Key dependencies: React, useGameStore, components/*
// 💡 Usage: Root component of the application

import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { useGameStore } from './store/gameStore';
import { Inventory } from './components/Inventory';
import { CombatScreen } from './components/CombatScreen';
import { WorldNavigation } from './components/WorldNavigation';
import { QuestLog } from './components/QuestLog';
import { EventOverlay } from './components/EventOverlay';
import { CraftingView } from './components/CraftingView';
import { AuthView } from './components/AuthView';
import { CharacterSelectionView } from './components/CharacterSelectionView';
import { DiceOverlay } from './components/DiceOverlay';
import { useDiceStore } from './store/diceStore';
import { DiceEngine } from './engine/DiceEngine';

function App() {
  const { 
    character, 
    authStatus,
    checkAuth,
    trainCharacter,
    isLoading 
  } = useGameStore();
  
  const triggerRoll = useDiceStore(state => state.triggerRoll);
  
  const [view, setView] = useState<'hub' | 'inventory' | 'explore' | 'combat' | 'crafting'>('hub');
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // * Initialize Dice Engine Listeners
  useEffect(() => {
    // Non-blocking listener for standard rolls
    DiceEngine.setListener((sides, result, label) => {
      triggerRoll(sides, result, label);
    });

    // Blocking listener for combat/important rolls
    DiceEngine.setAnimatedListener(async (sides, result, label) => {
      await triggerRoll(sides, result, label);
    });
  }, [triggerRoll]);

  // * Map header navigation to internal view state
  const handleHeaderNavigate = (navView: 'character' | 'inventory' | 'world' | 'combat' | 'crafting') => {
    switch (navView) {
      case 'character':
        setView('hub');
        break;
      case 'inventory':
        setView('inventory');
        break;
      case 'world':
        setView('explore');
        break;
      case 'combat':
        setView('combat');
        break;
      case 'crafting':
        setView('crafting');
        break;
    }
  };
  
  // * Determine active header view based on current view state
  const getActiveHeaderView = (): 'character' | 'inventory' | 'world' | 'combat' | 'crafting' | undefined => {
    switch (view) {
      case 'hub':
        return 'character';
      case 'inventory':
        return 'inventory';
      case 'explore':
        return 'world';
      case 'combat':
        return 'combat';
      case 'crafting':
        return 'crafting';
      default:
        return undefined;
    }
  };

  if (isLoading || authStatus === 'idle') {
    return (
      <div className="h-screen w-screen bg-fantasy-dark flex items-center justify-center text-fantasy-accent font-serif tracking-widest animate-pulse">
        ЗАГРУЗКА ДАННЫХ...
      </div>
    );
  }

  // 1. Not Authenticated -> Show Auth Screen
  if (authStatus === 'unauthenticated') {
    return (
      <div className="h-screen w-screen bg-fantasy-dark overflow-y-auto">
        <AuthView />
      </div>
    );
  }

  // 2. Authenticated but no character selected -> Show Character Selection
  if (!character) {
    return (
      <div className="h-screen w-screen bg-fantasy-dark overflow-y-auto">
        <CharacterSelectionView />
      </div>
    );
  }

  // 3. Authenticated and character selected -> Show Main Game
  return (
    <Layout 
      onNavigate={handleHeaderNavigate}
      activeView={getActiveHeaderView()}
    >
      <DiceOverlay />
      <EventOverlay />
      
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-4 border-b border-fantasy-border">
        <button 
          onClick={() => setView('hub')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'hub' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Обзор
        </button>
        <button 
          onClick={() => setView('explore')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'explore' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Исследовать
        </button>
        <button 
          onClick={() => setView('inventory')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'inventory' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Инвентарь
        </button>
        <button 
          onClick={() => setView('combat')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'combat' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Бой
        </button>
        <button 
          onClick={() => setView('crafting')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'crafting' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Ремесло
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full overflow-hidden">
        {/* Main Content Area */}
        <div className="lg:col-span-3 h-full overflow-y-auto custom-scrollbar">
          {view === 'hub' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <h1 className="text-5xl font-serif text-fantasy-accent mb-4 uppercase tracking-tighter">Hornygrad</h1>
              <p className="text-gray-400 max-w-md italic mb-10">"Где сталь встречается с сущностью, а смертность — лишь порог."</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl w-full">
                <div className="fantasy-panel p-6 flex flex-col items-center gap-3">
                  <div className="text-fantasy-accent font-serif text-lg">Ежедневная медитация</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Соединись со своей сущностью</div>
                  <button 
                    onClick={() => trainCharacter()}
                    className="fantasy-button w-full mt-2"
                  >
                    Медитировать
                  </button>
                </div>
                <div className="fantasy-panel p-6 flex flex-col items-center gap-3">
                  <div className="text-fantasy-accent font-serif text-lg">Отправиться в путь</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Мир ждёт</div>
                  <button 
                    onClick={() => setView('explore')}
                    className="fantasy-button w-full mt-2"
                  >
                    Покинуть убежище
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'explore' && <WorldNavigation />}
          {view === 'inventory' && <Inventory />}
          {view === 'combat' && <CombatScreen />}
          {view === 'crafting' && <CraftingView />}
        </div>

        {/* Sidebar for Quests and Info */}
        <div className="hidden lg:block h-full border-l border-fantasy-border/30 pl-8 overflow-y-auto custom-scrollbar">
          <QuestLog />
          
          <div className="mt-8 fantasy-panel p-4 bg-fantasy-accent/5 border-fantasy-accent/20">
            <h4 className="text-[10px] font-bold text-fantasy-accent uppercase mb-2">Информация о персонаже</h4>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Деньги:</span>
              <span className="text-white font-bold">{character?.money}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Локация:</span>
              <span className="text-white">{character?.location.position}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
