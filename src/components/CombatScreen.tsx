import React, { useEffect } from 'react';
import { useCombatStore } from '../store/combatStore';
import { useGameStore } from '../store/gameStore';
import { Sword, Shield, Zap, Skull, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { BattleStatus } from '../types/game';

export const CombatScreen: React.FC = () => {
  const { battle, attacker, defender, executeAttack, nextTurn, initiateBattle, endBattle } = useCombatStore();
  const { character, inventory, itemTemplates } = useGameStore();

  const handleStartBattle = () => {
    if (!character) return;
    
    // Mocking an enemy for the battle
    const enemy: any = {
      id: 'enemy-wolf',
      name: 'Лесной волк',
      stats: {
        essence: { current: 30, max: 30 },
        protection: { current: 0, max: 0 },
        speedId: 'speed-ordinary'
      },
      bonuses: {
        evasion: 10,
        accuracy: 10,
        damageResistance: 0,
        initiative: 5
      }
    };

    const participants = [
      { id: 'p1', characterId: character.id, teamId: 'player', initiative: 0, currentActions: { main: 1, bonus: 1 } },
      { id: 'p2', characterId: 'enemy-wolf', teamId: 'enemy', initiative: 0, currentActions: { main: 1, bonus: 1 } }
    ];

    initiateBattle(participants, character, enemy);
  };

  const handleAttack = () => {
    if (!battle || !attacker || !defender) return;
    
    const equippedWeapon = inventory?.items.find(i => i.isEquipped && itemTemplates.get(i.templateId)?.type === 'WEAPON') || null;
    // We'd also need the defender's armor template, but for now we simplify
    executeAttack(equippedWeapon, null, null);
  };

  if (!battle) {
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

  const currentParticipant = battle.turnOrder[battle.currentTurnIndex];
  const isPlayerTurn = currentParticipant.characterId === character?.id;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Initiative Timeline */}
      <div className="bg-fantasy-surface border border-fantasy-border rounded p-2 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <div className="text-[10px] uppercase font-bold text-gray-600 px-2 border-r border-fantasy-border">Инициатива</div>
          {battle.turnOrder.map((p, i) => (
            <div 
              key={p.id}
              className={clsx(
                "px-3 py-1 rounded border transition-all text-xs font-bold uppercase flex items-center gap-2",
                i === battle.currentTurnIndex 
                  ? "bg-fantasy-accent text-fantasy-dark border-white scale-110 z-10" 
                  : "bg-black/30 border-fantasy-border text-gray-500"
              )}
            >
              {p.characterId === character?.id ? <UserIcon /> : <Skull size={14} />}
              <span>{p.characterId === character?.id ? 'Вы' : 'Враг'}</span>
              <span className="opacity-50">#{p.initiative}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Battle Scene */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-8">
        {/* Attacker (Player) */}
        <div className={clsx("flex flex-col items-center gap-4 transition-transform duration-300", isPlayerTurn && "scale-105")}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-fantasy-accent bg-fantasy-surface flex items-center justify-center">
              <UserIcon size={40} className="text-fantasy-accent" />
            </div>
            {isPlayerTurn && (
              <div className="absolute -top-2 -right-2 bg-fantasy-accent text-fantasy-dark p-1 rounded-full animate-bounce">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="font-serif text-lg text-fantasy-accent uppercase tracking-wider">{attacker?.name}</div>
            <StatSmall label="Сущность" current={attacker?.stats.essence.current || 0} max={attacker?.stats.essence.max || 1} color="bg-fantasy-essence" />
          </div>
        </div>

        {/* Defender (Foe) */}
        <div className={clsx("flex flex-col items-center gap-4 transition-transform duration-300", !isPlayerTurn && "scale-105")}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-fantasy-blood bg-fantasy-surface flex items-center justify-center">
              <Skull size={40} className="text-fantasy-blood" />
            </div>
            {!isPlayerTurn && (
              <div className="absolute -top-2 -right-2 bg-fantasy-blood text-white p-1 rounded-full animate-bounce">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="font-serif text-lg text-fantasy-blood uppercase tracking-wider">{defender?.name}</div>
            <StatSmall label="Сущность" current={defender?.stats.essence.current || 0} max={defender?.stats.essence.max || 1} color="bg-fantasy-blood" />
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
              onClick={nextTurn}
              className={clsx("fantasy-button flex items-center gap-2", !isPlayerTurn && "opacity-30 cursor-not-allowed")}
            >
              Ждать
            </button>
          </>
        ) : (
          <div className="text-center">
            <h4 className="text-fantasy-accent font-serif text-xl mb-4 uppercase">Бой завершён</h4>
            <button onClick={endBattle} className="fantasy-button">
              Вернуться в убежище
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



