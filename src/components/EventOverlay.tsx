// 📁 src/components/EventOverlay.tsx - Narrative modal
// 🎯 Core function: Displays an event and allows the player to make choices
// 🔗 Key dependencies: src/store/gameStore.ts
// 💡 Usage: Rendered at the top level when activeEvent is present

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const EventOverlay: React.FC = () => {
  const { activeEvent, handleEventChoice } = useGameStore();

  if (!activeEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="fantasy-panel max-w-2xl w-full p-8 relative animate-in fade-in zoom-in duration-300">
        <div className="text-[10px] text-fantasy-accent uppercase tracking-[0.3em] mb-4 text-center">World Event</div>
        
        <h2 className="text-3xl font-serif text-white uppercase text-center mb-6 tracking-tight">
          {activeEvent.title}
        </h2>

        {activeEvent.image && (
          <div className="w-full h-48 mb-6 border border-fantasy-border bg-black/50 overflow-hidden">
            {/* Event image placeholder */}
            <div className="w-full h-full flex items-center justify-center text-gray-700 italic">
              [Visualizing Scene...]
            </div>
          </div>
        )}

        <div className="text-gray-300 leading-relaxed mb-8 text-center italic font-serif">
          "{activeEvent.description}"
        </div>

        <div className="space-y-3">
          {activeEvent.choices ? (
            activeEvent.choices.map(choice => (
              <button
                key={choice.id}
                onClick={() => handleEventChoice(choice.id)}
                className="w-full fantasy-button py-3 text-sm hover:translate-x-1 transition-transform"
              >
                {choice.text}
                {choice.requirement && (
                  <span className="ml-2 text-[10px] text-fantasy-accent opacity-60">
                    ({choice.requirement.value} {choice.requirement.type})
                  </span>
                )}
              </button>
            ))
          ) : (
            <button
              onClick={() => handleEventChoice('auto-dismiss')}
              className="w-full fantasy-button py-3"
            >
              CONTINUE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};



