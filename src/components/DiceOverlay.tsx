// 📁 src/components/DiceOverlay.tsx - Visual dice roll animation
// 🎯 Core function: Renders animated dice rolls triggered via DiceStore
// 🔗 Key dependencies: src/store/diceStore.ts, lucide-react, clsx
// 💡 Usage: Placed at the root of the app or in BattleScreen

import React, { useEffect, useState } from 'react';
import { useDiceStore } from '../store/diceStore';
import { clsx } from 'clsx';
import { Dices } from 'lucide-react';

export const DiceOverlay: React.FC = () => {
  const { activeRolls } = useDiceStore();

  if (activeRolls.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center gap-8">
      {activeRolls.map((roll) => (
        <DiceComponent key={roll.id} roll={roll} />
      ))}
    </div>
  );
};

const DiceComponent: React.FC<{ roll: any }> = ({ roll }) => {
  const [displayValue, setDisplayValue] = useState(1);
  const [isSettled, setIsSettled] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'rolling' | 'result' | 'outro'>('intro');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Intro phase
    const introTimer = setTimeout(() => {
      setPhase('rolling');
      
      // Rolling phase
      let rolls = 0;
      const maxRolls = 8;
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * roll.sides) + 1);
        setRotation(prev => prev + 90);
        rolls++;
        
        if (rolls >= maxRolls) {
          clearInterval(interval);
          setDisplayValue(roll.result);
          setRotation(0);
          setIsSettled(true);
          setPhase('result');
          
          // Show result phase, then outro
          setTimeout(() => {
            setPhase('outro');
            setTimeout(() => {
              if (roll.onComplete) roll.onComplete();
            }, 200);
          }, 600);
        }
      }, 50);
    }, 50);

    return () => {
      clearTimeout(introTimer);
      if (interval) clearInterval(interval);
    };
  }, [roll]);

  return (
    <div 
      className={clsx(
        "relative flex flex-col items-center justify-center transition-all duration-300 transform",
        phase === 'intro' && "scale-0 opacity-0 -translate-y-20",
        phase === 'rolling' && "scale-110 opacity-100 translate-y-0",
        phase === 'result' && "scale-125 opacity-100",
        phase === 'outro' && "scale-150 opacity-0 -translate-y-20"
      )}
    >
      {/* Glow Effect */}
      <div className={clsx(
        "absolute inset-0 bg-fantasy-accent/20 blur-3xl rounded-full transition-opacity duration-500",
        isSettled ? "opacity-100" : "opacity-0"
      )} />
      
      {/* Die Container */}
      <div 
        style={{ transform: `rotate(${rotation}deg)` }}
        className={clsx(
          "w-24 h-24 bg-fantasy-surface border-4 rounded-xl flex items-center justify-center shadow-2xl relative overflow-hidden transition-transform duration-100",
          isSettled ? "border-fantasy-accent shadow-fantasy-accent/50" : "border-gray-600 animate-pulse"
        )}
      >
        {/* Background Texture/Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Dices className="w-full h-full p-4" />
        </div>
        
        <span className={clsx(
          "text-4xl font-black font-serif transition-all duration-100",
          isSettled ? "text-fantasy-accent scale-110" : "text-gray-400"
        )}>
          {displayValue}
        </span>

        {/* Rolling indicator */}
        {!isSettled && (
          <div className="absolute bottom-1 w-full flex justify-center gap-1">
            <div className="w-1 h-1 bg-fantasy-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-fantasy-accent rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
            <div className="w-1 h-1 bg-fantasy-accent rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
        )}
      </div>

      {/* Label */}
      {roll.label && (
        <div className={clsx(
          "mt-4 px-4 py-1 bg-black/80 border border-fantasy-border rounded text-xs font-bold uppercase tracking-widest text-fantasy-accent whitespace-nowrap transition-all duration-300",
          phase === 'result' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {roll.label}
        </div>
      )}
      
      {/* Result feedback */}
      {isSettled && roll.result >= roll.sides * 0.9 && (
        <div className="absolute -top-8 text-fantasy-accent font-bold animate-bounce uppercase text-sm italic">
          Critical!
        </div>
      )}
    </div>
  );
};

