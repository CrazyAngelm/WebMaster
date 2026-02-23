// 📁 src/App.tsx - Main application entry point
// 🎯 Core function: Routing and authentication flow management
// 🔗 Key dependencies: React, useGameStore, components/*
// 💡 Usage: Root component of the application

import React, { useEffect, useState } from 'react';
import { Zap, Map as MapIcon } from 'lucide-react';
import { Layout } from './components/Layout';
import { useGameStore } from './store/gameStore';
import { Inventory } from './components/Inventory';
import { CombatScreen } from './components/CombatScreen';
import { WorldNavigation } from './components/WorldNavigation';
import { EventOverlay } from './components/EventOverlay';
import { CraftingView } from './components/CraftingView';
import { AuthView } from './components/AuthView';
import { CharacterSelectionView } from './components/CharacterSelectionView';
import { DiceOverlay } from './components/DiceOverlay';
import { useDiceStore } from './store/diceStore';
import { useCombatStore } from './store/combatStore';
import { DiceEngine } from './engine/DiceEngine';

function App() {
  const checkAuth = useGameStore(state => state.checkAuth);
  const character = useGameStore(state => state.character);
  const authStatus = useGameStore(state => state.authStatus);
  const trainCharacter = useGameStore(state => state.trainCharacter);
  const isLoading = useGameStore(state => state.isLoading);
  
  const triggerRoll = useDiceStore(state => state.triggerRoll);
  const checkActiveBattle = useCombatStore(state => state.checkActiveBattle);
  
  const [view, setView] = useState<'hub' | 'inventory' | 'explore' | 'combat' | 'crafting'>('hub');
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // * Auto-resume active battle on character selection
  useEffect(() => {
    if (character && checkActiveBattle) {
      checkActiveBattle(character.id).then(isActive => {
        if (isActive) setView('combat');
      }).catch(err => {
        console.error('Error checking active battle:', err);
      });
    }
  }, [character?.id, checkActiveBattle]);

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

  // * Listen for combat navigation events
  useEffect(() => {
    const handleNavigateToCombat = () => {
      setView('combat');
    };

    window.addEventListener('navigateToCombat', handleNavigateToCombat);
    
    return () => {
      window.removeEventListener('navigateToCombat', handleNavigateToCombat);
    };
  }, []);

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
      
      <div className="h-full">
        {view === 'hub' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <h1 className="text-6xl font-serif text-fantasy-accent mb-4 uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(197,160,89,0.2)]">Hornygrad</h1>
            <p className="text-gray-400 max-w-md italic mb-12 text-sm leading-relaxed">"Где сталь встречается с сущностью, а смертность — лишь порог."</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl w-full">
              <div className="fantasy-panel p-8 flex flex-col items-center gap-4 bg-fantasy-surface/40 hover:bg-fantasy-surface/60 transition-all group">
                <div className="w-12 h-12 rounded-full bg-fantasy-accent/10 border border-fantasy-accent/30 flex items-center justify-center group-hover:bg-fantasy-accent/20 transition-all">
                  <Zap size={24} className="text-fantasy-accent" />
                </div>
                <div className="text-center">
                  <div className="text-fantasy-accent font-serif text-xl mb-1">Ежедневная медитация</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Соединись со своей сущностью</div>
                </div>
                <button 
                  onClick={() => trainCharacter()}
                  className="fantasy-button w-full mt-4 shadow-lg shadow-fantasy-accent/5"
                >
                  Медитировать
                </button>
              </div>

              <div className="fantasy-panel p-8 flex flex-col items-center gap-4 bg-fantasy-surface/40 hover:bg-fantasy-surface/60 transition-all group">
                <div className="w-12 h-12 rounded-full bg-fantasy-accent/10 border border-fantasy-accent/30 flex items-center justify-center group-hover:bg-fantasy-accent/20 transition-all">
                  <MapIcon size={24} className="text-fantasy-accent" />
                </div>
                <div className="text-center">
                  <div className="text-fantasy-accent font-serif text-xl mb-1">Отправиться в путь</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Мир ждёт</div>
                </div>
                <button 
                  onClick={() => setView('explore')}
                  className="fantasy-button w-full mt-4 shadow-lg shadow-fantasy-accent/5"
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
    </Layout>
  );
}

export default App;
