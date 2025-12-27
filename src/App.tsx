import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { useGameStore } from './store/gameStore';
import { Inventory } from './components/Inventory';
import { CombatScreen } from './components/CombatScreen';
import { WorldNavigation } from './components/WorldNavigation';
import { QuestLog } from './components/QuestLog';
import { EventOverlay } from './components/EventOverlay';
import { 
  MOCK_CHARACTER, 
  MOCK_INVENTORY
} from './data/mockData';

function App() {
  const { 
    character, 
    loadGame, 
    setCharacter, 
    setInventory, 
    trainCharacter,
    isLoading 
  } = useGameStore();
  const [view, setView] = useState<'hub' | 'inventory' | 'explore' | 'combat'>('hub');
  
  // * Map header navigation to internal view state
  const handleHeaderNavigate = (navView: 'character' | 'inventory' | 'world' | 'combat') => {
    switch (navView) {
      case 'character':
        // * Character sheet is always visible in sidebar, so just show hub
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
    }
  };
  
  // * Determine active header view based on current view state
  const getActiveHeaderView = (): 'character' | 'inventory' | 'world' | 'combat' | undefined => {
    switch (view) {
      case 'hub':
        return 'character';
      case 'inventory':
        return 'inventory';
      case 'explore':
        return 'world';
      case 'combat':
        return 'combat';
      default:
        return undefined;
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadGame();
    };
    init();
  }, [loadGame]);

  // * Default character creation if none exists
  useEffect(() => {
    if (!isLoading && !character) {
      console.log('No character found, initializing with mock data...');
      setCharacter(MOCK_CHARACTER);
      setInventory(MOCK_INVENTORY);
    }
  }, [isLoading, character, setCharacter, setInventory]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-fantasy-dark flex items-center justify-center text-fantasy-accent font-serif tracking-widest animate-pulse">
        LOADING DATA...
      </div>
    );
  }

  return (
    <Layout 
      onNavigate={handleHeaderNavigate}
      activeView={getActiveHeaderView()}
    >
      <EventOverlay />
      
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-4 border-b border-fantasy-border">
        <button 
          onClick={() => setView('hub')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'hub' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setView('explore')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'explore' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Explore
        </button>
        <button 
          onClick={() => setView('inventory')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'inventory' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Inventory
        </button>
        <button 
          onClick={() => setView('combat')}
          className={`pb-2 px-4 uppercase text-[10px] font-bold tracking-widest transition-all ${view === 'combat' ? 'text-fantasy-accent border-b-2 border-fantasy-accent' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Combat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full overflow-hidden">
        {/* Main Content Area */}
        <div className="lg:col-span-3 h-full overflow-y-auto custom-scrollbar">
          {view === 'hub' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <h1 className="text-5xl font-serif text-fantasy-accent mb-4 uppercase tracking-tighter">Hornygrad</h1>
              <p className="text-gray-400 max-w-md italic mb-10">"Where steel meets essence, and mortality is but a threshold."</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl w-full">
                <div className="fantasy-panel p-6 flex flex-col items-center gap-3">
                  <div className="text-fantasy-accent font-serif text-lg">Daily Meditation</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Connect with your essence</div>
                  <button 
                    onClick={() => trainCharacter()}
                    className="fantasy-button w-full mt-2"
                  >
                    Meditate
                  </button>
                </div>
                <div className="fantasy-panel p-6 flex flex-col items-center gap-3">
                  <div className="text-fantasy-accent font-serif text-lg">Venture Out</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">The world awaits</div>
                  <button 
                    onClick={() => setView('explore')}
                    className="fantasy-button w-full mt-2"
                  >
                    Leave Hub
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'explore' && <WorldNavigation />}
          {view === 'inventory' && <Inventory />}
          {view === 'combat' && <CombatScreen />}
        </div>

        {/* Sidebar for Quests and Info */}
        <div className="hidden lg:block h-full border-l border-fantasy-border/30 pl-8 overflow-y-auto custom-scrollbar">
          <QuestLog />
          
          <div className="mt-8 fantasy-panel p-4 bg-fantasy-accent/5 border-fantasy-accent/20">
            <h4 className="text-[10px] font-bold text-fantasy-accent uppercase mb-2">Character Info</h4>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Money:</span>
              <span className="text-white font-bold">{character?.money}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Location:</span>
              <span className="text-white">{character?.location.position}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
