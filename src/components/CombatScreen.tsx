import React, { useEffect } from 'react';
import { useCombatStore } from '../store/combatStore';
import { useGameStore } from '../store/gameStore';
import { Sword, Shield, Zap, Skull, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { BattleStatus } from '../types/game';

export const CombatScreen: React.FC = () => {
  const { 
    battle, 
    player, 
    enemy, 
    executeAttack, 
    nextTurn, 
    initiateBattle, 
    endBattle 
  } = useCombatStore();
  const { character, inventory, itemTemplates, setCharacter } = useGameStore();

  // * Auto-handle enemy turns
  useEffect(() => {
    if (battle && battle.status === BattleStatus.ACTIVE) {
      const currentParticipant = battle.participants[battle.currentTurnIndex];
      const isPlayerTurn = currentParticipant.characterId === character?.id;

      if (!isPlayerTurn) {
        // * Enemy AI Turn
        const timer = setTimeout(async () => {
          // Simple AI: always attack
          const target = battle.participants.find(p => p.isPlayer);
          if (target) {
            await executeAttack(currentParticipant.id, target.id, null);
          }
          await nextTurn();
        }, 1500); // 1.5s delay for readability
        return () => clearTimeout(timer);
      }
    }
  }, [battle?.currentTurnIndex, battle?.status]);

  // * Sync player health back to game store if changed
  useEffect(() => {
    if (battle && character) {
      const playerParticipant = battle.participants.find(p => p.characterId === character.id);
      if (playerParticipant && (playerParticipant.currentHp !== character.stats.essence.current || playerParticipant.currentProtection !== character.stats.protection.current)) {
        setCharacter({
          ...character,
          stats: {
            ...character.stats,
            essence: { ...character.stats.essence, current: playerParticipant.currentHp },
            protection: { ...character.stats.protection, current: playerParticipant.currentProtection }
          },
          isDead: playerParticipant.currentHp <= 0
        });
      }
    }
  }, [battle?.participants]);

  const handleStartBattle = () => {
    if (!character) return;
    
    // For testing, we use a known monster template ID from seed.ts
    initiateBattle('mon-wolf', true);
  };

  const handleAttack = async () => {
    if (!battle || !character) return;
    
    const currentParticipant = battle.participants[battle.currentTurnIndex];
    if (!currentParticipant) return; // Robustness check

    const target = battle.participants.find(p => !p.isPlayer);
    
    if (!target) return;

    const equippedWeapon = inventory?.items.find(i => i.isEquipped && itemTemplates.get(i.templateId)?.type === 'WEAPON') || null;
    
    await executeAttack(currentParticipant.id, target.id, equippedWeapon?.id || null);
    await nextTurn();
  };

  if (!battle || !battle.participants || battle.participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-fantasy-border rounded bg-black/10">
        <Sword size={48} className="text-fantasy-border mb-4" />
        <h3 className="text-xl font-serif text-gray-500 mb-4 uppercase tracking-widest">Нет активного боя</h3>
        <button onClick={handleStartBattle} className="fantasy-button">
          Искать конфликт
        </button>
      </div>
    );
  }

  const currentParticipant = battle.participants[battle.currentTurnIndex];
  if (!currentParticipant) return null; // Should not happen with above check

  const isPlayerTurn = currentParticipant.characterId === character?.id;

  const playerParticipant = battle.participants.find(p => p.isPlayer);
  const enemyParticipant = battle.participants.find(p => !p.isPlayer);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Initiative Timeline */}
      <div className="bg-fantasy-surface border border-fantasy-border rounded p-2 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <div className="text-[10px] uppercase font-bold text-gray-600 px-2 border-r border-fantasy-border">Инициатива</div>
          {battle.participants.map((p, i) => (
            <div 
              key={p.id}
              className={clsx(
                "px-3 py-1 rounded border transition-all text-xs font-bold uppercase flex items-center gap-2",
                i === battle.currentTurnIndex 
                ? "bg-fantasy-accent text-fantasy-dark border-white scale-110 z-10" 
                : "bg-black/30 border-fantasy-border text-gray-500"
              )}
            >
              {p.isPlayer ? <UserIcon /> : <Skull size={14} />}
              <span>{p.name}</span>
              <span className="opacity-50">#{p.initiative}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Battle Scene */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-8">
        {/* Player */}
        <div className={clsx("flex flex-col items-center gap-4 transition-transform duration-300", isPlayerTurn && "scale-105")}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-fantasy-accent bg-fantasy-surface flex items-center justify-center overflow-hidden">
              <UserIcon size={40} className="text-fantasy-accent" />
            </div>
            {isPlayerTurn && battle.status === BattleStatus.ACTIVE && (
              <div className="absolute -top-2 -right-2 bg-fantasy-accent text-fantasy-dark p-1 rounded-full animate-bounce">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="font-serif text-lg text-fantasy-accent uppercase tracking-wider">{playerParticipant?.name}</div>
            <div className="flex flex-col gap-2 items-center mt-2">
              <StatSmall label="Защита" current={playerParticipant?.currentProtection || 0} max={playerParticipant?.maxProtection || 1} color="bg-blue-500" />
              <StatSmall label="Сущность" current={playerParticipant?.currentHp || 0} max={playerParticipant?.maxHp || 1} color="bg-fantasy-essence" />
            </div>
          </div>
        </div>

        {/* Enemy */}
        <div className={clsx("flex flex-col items-center gap-4 transition-transform duration-300", !isPlayerTurn && "scale-105")}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-fantasy-blood bg-fantasy-surface flex items-center justify-center overflow-hidden">
              <Skull size={40} className="text-fantasy-blood" />
            </div>
            {!isPlayerTurn && battle.status === BattleStatus.ACTIVE && (
              <div className="absolute -top-2 -right-2 bg-fantasy-blood text-white p-1 rounded-full animate-bounce">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="font-serif text-lg text-fantasy-blood uppercase tracking-wider">{enemyParticipant?.name}</div>
            <div className="flex flex-col gap-2 items-center mt-2">
              <StatSmall label="Защита" current={enemyParticipant?.currentProtection || 0} max={enemyParticipant?.maxProtection || 1} color="bg-blue-500" />
              <StatSmall label="Сущность" current={enemyParticipant?.currentHp || 0} max={enemyParticipant?.maxHp || 1} color="bg-fantasy-blood" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Panel */}
      <div className="bg-fantasy-surface border border-fantasy-border p-6 rounded shadow-xl flex flex-wrap gap-4 justify-center items-center">
        {battle.status === BattleStatus.ACTIVE ? (
          <>
            <button 
              disabled={!isPlayerTurn} 
              onClick={handleAttack}
              className={clsx("fantasy-button flex items-center gap-2 px-8", !isPlayerTurn && "opacity-30 cursor-not-allowed")}
            >
              <Sword size={18} /> Атака
            </button>
            <button 
              disabled={!isPlayerTurn} 
              className={clsx("fantasy-button flex items-center gap-2 opacity-30 cursor-not-allowed")}
            >
              <Zap size={18} /> Умение
            </button>
            <button 
              disabled={!isPlayerTurn} 
              onClick={() => nextTurn()}
              className={clsx("fantasy-button flex items-center gap-2", !isPlayerTurn && "opacity-30 cursor-not-allowed")}
            >
              Ждать
            </button>
          </>
        ) : (
          <div className="text-center">
            <h4 className="text-fantasy-accent font-serif text-xl mb-4 uppercase">
              {playerParticipant && playerParticipant.currentHp <= 0 ? 'Вы проиграли' : 'Победа!'}
            </h4>
            <button onClick={() => endBattle(battle.id)} className="fantasy-button">
              {playerParticipant && playerParticipant.currentHp <= 0 ? 'Вернуться в город' : 'Завершить бой'}
            </button>
          </div>
        )}
      </div>

      {/* Battle Log */}
      <div className="bg-black/40 border border-fantasy-border rounded p-4 h-48 flex flex-col">
        <div className="text-[10px] uppercase font-bold text-gray-600 mb-2 tracking-widest flex items-center gap-2">
          <ChevronRight size={12} /> История боя
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
          {battle.log.map((log, i) => (
            <div key={i} className={clsx(
              "border-l-2 pl-2",
              log.includes('damage') ? "border-fantasy-blood text-gray-300" : "border-fantasy-accent/30 text-gray-500"
            )}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UserIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const StatSmall: React.FC<{ label: string; current: number; max: number; color: string }> = ({ label, current, max, color }) => (
  <div className="w-32">
    <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
      <span>{label}</span>
      <span>{current}/{max}</span>
    </div>
    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
      <div 
        className={clsx("h-full transition-all duration-300", color)}
        style={{ width: `${(current / max) * 100}%` }}
      />
    </div>
  </div>
);



