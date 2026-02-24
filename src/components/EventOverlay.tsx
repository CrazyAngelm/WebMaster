// 📁 src/components/EventOverlay.tsx - Narrative modal
// 🎯 Core function: Displays an event and allows the player to make choices
// 🔗 Key dependencies: src/store/gameStore.ts
// 💡 Usage: Rendered at the top level when activeEvent is present

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { EventService, EventResult, EventOutcome } from '../services/EventService';
import { GameEvent } from '../types/game';

export const EventOverlay: React.FC = () => {
  const { activeEvent, handleEventChoice, character, setNotification } = useGameStore();
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!activeEvent) return null;

  const handleChoice = async (choiceId: string) => {
    const result = EventService.processChoice(character!, choiceId, activeEvent.id);
    setEventResult(result);
    setShowResult(true);
    
    // Apply the character changes
    await handleEventChoice(choiceId);
    
    // Show notification about changes
    if (result.outcomes.length > 0) {
      const changesText = EventService.formatOutcomes(result.outcomes);
      setNotification({
        type: result.success ? 'success' : 'error',
        message: `${result.message} ${changesText ? `(${changesText})` : ''}`
      });
    }
  };

  const handleClose = () => {
    setShowResult(false);
    setEventResult(null);
  };

  const formatOutcome = (outcome: EventOutcome): string => {
    const val = Number(outcome.value);
    switch (outcome.type) {
      case 'MONEY':
        return `${val > 0 ? '+' : ''}${val}💰`;
      case 'ESSENCE':
        return `${val > 0 ? '+' : ''}${val}✨`;
      case 'ENERGY':
        return `${val > 0 ? '+' : ''}${val}⚡`;
      case 'DAMAGE':
        return `-${val}❤️`;
      case 'ITEM':
        return `📦 ${outcome.description}`;
      default:
        return outcome.description;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="fantasy-panel max-w-2xl w-full p-8 relative animate-in fade-in zoom-in duration-300">
        {!showResult ? (
          // Event choice view
          <>
            <div className="text-[10px] text-fantasy-accent uppercase tracking-[0.3em] mb-4 text-center">Событие мира</div>
            
            <h2 className="text-3xl font-serif text-white uppercase text-center mb-6 tracking-tight">
              {activeEvent.title}
            </h2>

            {activeEvent.image && (
              <div className="w-full h-48 mb-6 border border-fantasy-border bg-black/50 overflow-hidden">
                {/* Event image placeholder */}
                <div className="w-full h-full flex items-center justify-center text-gray-700 italic">
                  [Визуализация сцены...]
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
                    onClick={() => handleChoice(choice.id)}
                    className="w-full fantasy-button py-3 text-sm hover:translate-x-1 transition-transform text-left px-4"
                  >
                    <div className="flex justify-between items-center">
                      <span>{choice.text}</span>
                      {choice.requirement && (
                        <span className="text-[10px] text-fantasy-accent opacity-60">
                          ({choice.requirement.value} {choice.requirement.type})
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <button
                  onClick={() => handleChoice('auto-dismiss')}
                  className="w-full fantasy-button py-3"
                >
                  ПРОДОЛЖИТЬ
                </button>
              )}
            </div>
          </>
        ) : (
          // Result view
          <>
            <div className="text-[10px] text-fantasy-accent uppercase tracking-[0.3em] mb-4 text-center">
              Результат
            </div>
            
            <div className={`text-center mb-6 ${eventResult?.success ? 'text-green-400' : 'text-yellow-400'}`}>
              <div className="text-5xl mb-4">
                {eventResult?.success ? '🎲' : '⚠️'}
              </div>
              <h3 className="text-2xl font-serif uppercase tracking-tight">
                {eventResult?.success ? 'Успех!' : 'Неудача'}
              </h3>
              {eventResult?.roll && (
                <div className="text-sm text-gray-400 mt-2">
                  Выпало: {eventResult.roll}/100
                </div>
              )}
            </div>

            <div className="text-gray-300 leading-relaxed mb-6 text-center italic font-serif text-lg">
              "{eventResult?.message || activeEvent.description}"
            </div>

            {eventResult?.outcomes && eventResult.outcomes.length > 0 && (
              <div className="mb-6 p-4 bg-black/30 border border-fantasy-border/30 rounded">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 text-center">
                  Изменения
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {eventResult.outcomes.map((outcome, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded text-sm font-bold ${
                        outcome.type === 'DAMAGE' ? 'bg-red-900/50 text-red-300' :
                        outcome.type === 'MONEY' && Number(outcome.value) > 0 ? 'bg-yellow-900/50 text-yellow-300' :
                        outcome.type === 'ESSENCE' && Number(outcome.value) > 0 ? 'bg-blue-900/50 text-blue-300' :
                        outcome.type === 'ENERGY' && Number(outcome.value) > 0 ? 'bg-green-900/50 text-green-300' :
                        'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {formatOutcome(outcome)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full fantasy-button py-3 bg-green-600 hover:bg-green-700"
            >
              ПРОДОЛЖИТЬ ПУТЬ
            </button>
          </>
        )}
      </div>
    </div>
  );
};
