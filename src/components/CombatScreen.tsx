import React, { useEffect } from 'react';
import { useCombatStore } from '../store/combatStore';
import { useGameStore } from '../store/gameStore';
import { Sword, Shield, Zap, Skull, ChevronRight, ArrowLeft, ArrowRight, LogOut, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { BattleStatus } from '../types/game';

export const CombatScreen: React.FC = () => {
  const { 
    battle, 
    player, 
    enemy, 
    executeAttack, 
    move,
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
          const target = battle.participants.find(p => p.isPlayer);
          if (target) {
            // Check range
            const dist = Math.abs(currentParticipant.distance - target.distance);
            
            // For now, AI only has unarmed melee (0-5m)
            if (dist > 5) {
              // Move TOWARDS player (smarter move)
              await move(currentParticipant.id, 'towards');
            } else {
              await executeAttack(currentParticipant.id, target.id, null);
            }
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

  const handleMove = async (direction: 'left' | 'right' | 'towards' | 'away', targetDistance?: number) => {
    if (!battle || !character) return;
    const currentParticipant = battle.participants[battle.currentTurnIndex];
    if (!currentParticipant || !isPlayerTurn) return;

    await move(currentParticipant.id, direction, targetDistance);
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

  const equippedWeapon = inventory?.items.find(i => i.isEquipped && itemTemplates.get(i.templateId)?.type === 'WEAPON');
  const weaponTemplate = equippedWeapon ? itemTemplates.get(equippedWeapon.templateId) : null;

  const equippedArmor = inventory?.items.find(i => i.isEquipped && itemTemplates.get(i.templateId)?.type === 'ARMOR');
  const armorTemplate = equippedArmor ? itemTemplates.get(equippedArmor.templateId) : null;

  // * Fetch speed info
  const speedTemplates = Array.from(itemTemplates.values()).filter(t => (t as any).distancePerAction !== undefined); // This is not how it works, I need speed models
  
  const getSpeedValue = (p: any) => {
    const speedMap: Record<string, number> = {
      'speed-very-slow': 5,
      'speed-slow': 10,
      'speed-ordinary': 15,
      'speed-fast': 20,
      'speed-very-fast': 30
    };

    if (p.isPlayer && character) {
      return speedMap[character.stats.speedId] || 15;
    }
    
    if (p.name.toLowerCase().includes('wolf')) return 20;
    if (p.name.toLowerCase().includes('orc')) return 10;
    if (p.name.toLowerCase().includes('vampire')) return 30;
    return 15;
  };

  const playerSpeed = playerParticipant ? getSpeedValue(playerParticipant) : 15;

  // * Range calculation
  const currentDistance = playerParticipant && enemyParticipant 
    ? Math.abs(playerParticipant.distance - enemyParticipant.distance) 
    : 0;

  let weaponRange = { min: 0, max: 5 };
  if (weaponTemplate?.distance) {
    try {
      const parsed = JSON.parse(weaponTemplate.distance);
      weaponRange = { min: parsed.minRange, max: parsed.maxRange };
    } catch {
      switch (weaponTemplate.distance) {
        case 'MEDIUM': weaponRange = { min: 5, max: 20 }; break;
        case 'FAR': weaponRange = { min: 20, max: 50 }; break;
        case 'SNIPER': weaponRange = { min: 50, max: 200 }; break;
        default: weaponRange = { min: 0, max: 5 };
      }
    }
  }

  const inRange = currentDistance >= weaponRange.min && currentDistance <= weaponRange.max;
  const canEscape = currentDistance > 90;

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

      {/* Battle Scene (1D Line) */}
      <div className="relative h-64 bg-black/40 border-y border-fantasy-border/30 rounded-lg overflow-hidden flex flex-col justify-end pb-8">
        {/* Hint text */}
        {isPlayerTurn && playerParticipant?.mainActions! > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 text-[9px] text-gray-400 uppercase tracking-wider pointer-events-none">
            Кликните по линии для перемещения
          </div>
        )}

        {/* Clickable Line Layer */}
        <div 
          className={clsx(
            "absolute inset-0 z-10 cursor-crosshair transition-colors",
            isPlayerTurn && playerParticipant?.mainActions! > 0 && "hover:bg-fantasy-accent/5"
          )}
          onClick={(e) => {
            if (!isPlayerTurn || playerParticipant?.mainActions === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            const clickedDistance = ((percentage - 50) / 100) * 200; // -100 to 100 range
            handleMove('towards', clickedDistance);
          }}
          title={isPlayerTurn && playerParticipant?.mainActions! > 0 ? "Кликните по линии для перемещения" : undefined}
        >
          {/* Visual reach indicator for movement */}
          {isPlayerTurn && playerParticipant?.mainActions! > 0 && playerParticipant && (
            <div 
              className="absolute bottom-0 h-1 bg-fantasy-accent/30 pointer-events-none transition-all"
              style={{ 
                left: `${Math.max(0, Math.min(100, 50 + ((playerParticipant.distance - playerSpeed) / 200) * 100))}%`,
                width: `${Math.min(100, (playerSpeed * 2 / 200) * 100)}%`
              }}
            />
          )}
        </div>

        {/* Distance markers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-fantasy-border/50 to-transparent" />
        </div>
        
        {/* Scale/Grid (visual only) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-mono flex gap-8">
          <span>-50m</span>
          <span>-25m</span>
          <span>0m</span>
          <span>25m</span>
          <span>50m</span>
        </div>

        {/* Participants on the line */}
        <div className="relative w-full h-full">
          {battle.participants.map((p, idx) => {
            // Map distance to percentage (center 0 is 50%)
            // Range: -100m to 100m for visualization
            const leftPos = 50 + (p.distance / 200) * 100;
            const isCurrent = p.id === currentParticipant.id;

            // * Check distance to nearest enemy for visual separation
            const otherParticipants = battle.participants.filter(op => op.id !== p.id && op.currentHp > 0);
            const nearestOther = otherParticipants.length > 0
              ? otherParticipants.reduce((prev, curr) => 
                  Math.abs(curr.distance - p.distance) < Math.abs(prev.distance - p.distance) ? curr : prev
                )
              : null;
            
            const distToNearest = nearestOther ? Math.abs(p.distance - nearestOther.distance) : Infinity;
            const isClose = distToNearest < 5; // Less than 5 meters
            
            // * Vertical offset to prevent overlap: player goes up, enemy goes down (or vice versa)
            const verticalOffset = isClose 
              ? (p.isPlayer ? 12 : -8) // Player slightly higher, enemy slightly lower
              : 0;
            
            // * Z-index: player always on top when close
            const zIndex = isClose && p.isPlayer ? 20 : (isClose ? 10 : 5);

            return (
              <div 
                key={p.id}
                className="absolute transition-all duration-700 ease-out flex flex-col items-center"
                style={{ 
                  left: `${leftPos}%`, 
                  transform: 'translateX(-50%)',
                  bottom: `${verticalOffset}px`,
                  zIndex: zIndex
                }}
              >
                {/* Visual range indicator if it's player turn and this is the enemy */}
                {isPlayerTurn && !p.isPlayer && (
                  <div className="absolute -top-16 flex flex-col items-center">
                    <div className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded border mb-1",
                      inRange ? "bg-green-500/20 border-green-500 text-green-400" : "bg-red-500/20 border-red-500 text-red-400"
                    )}>
                      {currentDistance.toFixed(1)}м
                    </div>
                    {!inRange && (
                      <div className="text-[8px] text-gray-400 uppercase tracking-tighter">
                        Нужно: {weaponRange.min}-{weaponRange.max}м
                      </div>
                    )}
                  </div>
                )}

                <div className={clsx(
                  "relative group",
                  isCurrent && "animate-pulse"
                )}>
                  <div className={clsx(
                    "w-16 h-16 rounded-full border-2 bg-fantasy-surface flex items-center justify-center overflow-hidden shadow-lg transition-all",
                    p.isPlayer ? "border-fantasy-accent" : "border-fantasy-blood",
                    isCurrent && "ring-4 ring-white ring-offset-2 ring-offset-black/50",
                    isClose && "ring-2 ring-yellow-500/50 ring-offset-1"
                  )}>
                    {p.isPlayer ? <UserIcon size={32} className="text-fantasy-accent" /> : <Skull size={32} className="text-fantasy-blood" />}
                  </div>
                  
                  {/* Close combat indicator */}
                  {isClose && nearestOther && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Ближний бой" />
                  )}
                  
                  {/* Name Tag */}
                  <div className="mt-2 text-center">
                    <div className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider",
                      p.isPlayer ? "text-fantasy-accent" : "text-fantasy-blood"
                    )}>
                      {p.name}
                    </div>
                    <div className="flex flex-col gap-1 items-center mt-1">
                      <div className="w-16 h-1 bg-black/50 rounded-full overflow-hidden">
                        <div className="h-full bg-fantasy-essence" style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }} />
                      </div>
                      <div className="text-[8px] text-gray-500 uppercase font-mono">Скорость: {getSpeedValue(p)}м</div>
                      
                      {/* Action Indicators */}
                      <div className="flex gap-1 mt-0.5">
                        <div className={clsx("w-2 h-2 rounded-full", p.mainActions > 0 ? "bg-orange-500" : "bg-gray-700")} title="Основное действие" />
                        <div className={clsx("w-2 h-2 rounded-full", p.bonusActions > 0 ? "bg-blue-400" : "bg-gray-700")} title="Доп. действие" />
                      </div>

                      {/* Active Effects */}
                      {p.activeEffects && p.activeEffects.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap justify-center max-w-[100px]">
                          {p.activeEffects.map(effect => (
                            <div 
                              key={effect.id}
                              className={clsx(
                                "px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-tighter border flex items-center gap-0.5",
                                effect.isNegative ? "bg-red-900/40 border-red-500/50 text-red-300" : "bg-green-900/40 border-green-500/50 text-green-300"
                              )}
                              title={`${effect.name}: ${effect.value} (${effect.remainingTurns} ходов)`}
                            >
                              <span>{effect.name}</span>
                              <span className="opacity-60 bg-black/30 px-0.5 rounded">{effect.remainingTurns}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCurrent && battle.status === BattleStatus.ACTIVE && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <ChevronRight size={20} className="rotate-90 text-white animate-bounce" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Panel */}
      <div className="bg-fantasy-surface border border-fantasy-border p-6 rounded shadow-xl flex flex-col gap-6">
        {battle.status === BattleStatus.ACTIVE ? (
          <>
            {/* Main Actions Row */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2 border-r border-fantasy-border/30 pr-4">
                <button 
                  disabled={!isPlayerTurn || playerParticipant?.mainActions === 0} 
                  onClick={() => handleMove('towards')}
                  className={clsx(
                    "p-2 rounded border border-fantasy-border hover:bg-white/10 transition-colors flex items-center gap-2", 
                    (!isPlayerTurn || playerParticipant?.mainActions === 0) && "opacity-30 cursor-not-allowed"
                  )}
                  title="Подойти к врагу"
                >
                  <Crosshair size={18} />
                  <span className="text-[10px] font-bold uppercase">Сближение</span>
                </button>
                <div className="text-[10px] uppercase font-bold text-orange-500 w-12 text-center flex flex-col">
                  <span>Движ.</span>
                  <span className="text-[8px] opacity-70">(Осн.)</span>
                </div>
                <button 
                  disabled={!isPlayerTurn || playerParticipant?.mainActions === 0} 
                  onClick={() => handleMove('away')}
                  className={clsx(
                    "p-2 rounded border border-fantasy-border hover:bg-white/10 transition-colors flex items-center gap-2", 
                    (!isPlayerTurn || playerParticipant?.mainActions === 0) && "opacity-30 cursor-not-allowed"
                  )}
                  title="Отойти от врага"
                >
                  <span className="text-[10px] font-bold uppercase">Отступление</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              <button 
                disabled={!isPlayerTurn || !inRange || playerParticipant?.mainActions === 0} 
                onClick={handleAttack}
                className={clsx(
                  "fantasy-button flex items-center gap-2 px-8 min-w-[140px]", 
                  (!isPlayerTurn || !inRange || playerParticipant?.mainActions === 0) && "opacity-30 cursor-not-allowed"
                )}
              >
                <Sword size={18} /> {inRange ? 'Атака' : 'Вне дальности'}
              </button>
              
              <button 
                disabled={!isPlayerTurn || playerParticipant?.mainActions === 0} 
                className={clsx("fantasy-button flex items-center gap-2 opacity-30 cursor-not-allowed")}
              >
                <Zap size={18} /> Умение
              </button>
            </div>

            {/* Bonus Actions Row */}
            <div className="flex flex-wrap gap-4 justify-center items-center border-t border-fantasy-border/10 pt-4">
              <div className="text-[10px] uppercase font-bold text-blue-400">Доп. действие:</div>
              <button 
                disabled={!isPlayerTurn || (playerParticipant?.bonusActions === 0 && playerParticipant?.mainActions === 0)} 
                className={clsx(
                  "fantasy-button flex items-center gap-2 py-1 px-4 text-sm", 
                  (!isPlayerTurn || (playerParticipant?.bonusActions === 0 && playerParticipant?.mainActions === 0)) && "opacity-30 cursor-not-allowed"
                )}
              >
                <Shield size={14} /> Использовать предмет
              </button>

              <div className="flex-1" />

              <button 
                disabled={!isPlayerTurn || !canEscape} 
                onClick={() => endBattle(battle.id)}
                className={clsx(
                  "fantasy-button flex items-center gap-2 py-1 px-4 text-sm border-fantasy-blood/50", 
                  (!isPlayerTurn || !canEscape) && "opacity-30 cursor-not-allowed"
                )}
                title={canEscape ? 'Сбежать из боя' : 'Нужно отойти на 90м чтобы сбежать'}
              >
                <LogOut size={14} /> Побег
              </button>

              <button 
                disabled={!isPlayerTurn} 
                onClick={() => nextTurn()}
                className={clsx("fantasy-button flex items-center gap-2 py-1 px-4 text-sm", !isPlayerTurn && "opacity-30 cursor-not-allowed")}
              >
                Завершить ход
              </button>
            </div>
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

      {/* Equipment & Info (Side Panels or bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player Stats & Equipment */}
        <div className="bg-fantasy-surface/50 border border-fantasy-border/30 p-4 rounded flex gap-4">
          <div className="w-24 h-24 rounded border border-fantasy-accent bg-black/40 flex flex-col items-center justify-center shrink-0 p-2">
             <UserIcon size={32} className="text-fantasy-accent mb-2" />
             <div className="text-[8px] text-gray-500 uppercase font-mono">Скор: {getSpeedValue(playerParticipant)}м</div>
          </div>
          <div className="flex-1">
             <div className="flex justify-between items-center mb-2">
               <span className="font-serif text-fantasy-accent uppercase text-sm">{playerParticipant?.name}</span>
               <span className="text-[10px] text-gray-500 font-mono">Поз: {playerParticipant?.distance.toFixed(1)}м</span>
             </div>
             
             {/* Stats Bars */}
             <div className="space-y-2 mb-3">
               <StatSmall label="Защита" current={playerParticipant?.currentProtection || 0} max={playerParticipant?.maxProtection || 1} color="bg-blue-500" />
               <StatSmall label="Сущность" current={playerParticipant?.currentHp || 0} max={playerParticipant?.maxHp || 1} color="bg-fantasy-essence" />
             </div>

             {/* Restored Equipment Info */}
             <div className="p-2 bg-black/20 rounded border border-fantasy-border/30 text-[9px]">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="flex items-center gap-1"><Sword size={10} /> {weaponTemplate?.name || 'Кулаки'}</span>
                  <span className="text-fantasy-essence font-bold">{equippedWeapon?.currentEssence || 5}</span>
                </div>
                {armorTemplate && (
                  <div className="flex flex-col gap-0.5 border-t border-fantasy-border/10 pt-1 mt-1">
                    <div className="flex justify-between text-gray-400">
                      <span className="flex items-center gap-1"><Shield size={10} /> {armorTemplate.name}</span>
                      <span>{equippedArmor?.currentDurability}/{armorTemplate.baseDurability}</span>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Enemy Stats */}
        <div className="bg-fantasy-surface/50 border border-fantasy-border/30 p-4 rounded flex gap-4">
          <div className="w-24 h-24 rounded border border-fantasy-blood bg-black/40 flex flex-col items-center justify-center shrink-0 p-2">
             <Skull size={32} className="text-fantasy-blood mb-2" />
             <div className="text-[8px] text-gray-500 uppercase font-mono">Скор: {getSpeedValue(enemyParticipant)}м</div>
          </div>
          <div className="flex-1">
             <div className="flex justify-between items-center mb-2">
               <span className="font-serif text-fantasy-blood uppercase text-sm">{enemyParticipant?.name}</span>
               <span className="text-[10px] text-gray-500 font-mono">Поз: {enemyParticipant?.distance.toFixed(1)}м</span>
             </div>
             <div className="space-y-2">
               <StatSmall label="Защита" current={enemyParticipant?.currentProtection || 0} max={enemyParticipant?.maxProtection || 1} color="bg-blue-500" />
               <StatSmall label="Сущность" current={enemyParticipant?.currentHp || 0} max={enemyParticipant?.maxHp || 1} color="bg-fantasy-blood" />
             </div>
          </div>
        </div>
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
              log.includes('Попадание') || log.includes('damage') ? "border-fantasy-blood text-gray-300" : "border-fantasy-accent/30 text-gray-500"
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



