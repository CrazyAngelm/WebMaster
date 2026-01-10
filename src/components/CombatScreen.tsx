import React, { useEffect, useState } from 'react';
import { useCombatStore } from '../store/combatStore';
import { useGameStore } from '../store/gameStore';
import { StaticDataService } from '../services/StaticDataService';
import { Sword, Shield, Zap, Skull, ChevronRight, ArrowLeft, ArrowRight, LogOut, Crosshair, X } from 'lucide-react';
import { clsx } from 'clsx';
import { BattleStatus, CharacterSkill } from '../types/game';

const UserIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const CombatScreen: React.FC = () => {
  const battle = useCombatStore(state => state.battle);
  const player = useCombatStore(state => state.player);
  const enemy = useCombatStore(state => state.enemy);
  const executeAttack = useCombatStore(state => state.executeAttack);
  const move = useCombatStore(state => state.move);
  const nextTurn = useCombatStore(state => state.nextTurn);
  const initiateBattle = useCombatStore(state => state.initiateBattle);
  const endBattle = useCombatStore(state => state.endBattle);
  const useSkill = useCombatStore(state => state.useSkill);
  const useConsumable = useCombatStore(state => state.useConsumable);
  const blockWithShield = useCombatStore(state => state.blockWithShield);

  const character = useGameStore(state => state.character) as any;
  const inventory = useGameStore(state => state.inventory);
  const itemTemplates = useGameStore(state => state.itemTemplates);
  const setCharacter = useGameStore(state => state.setCharacter);
  const setNotification = useGameStore(state => state.setNotification);

  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [selectedSkillForTarget, setSelectedSkillForTarget] = useState<string | null>(null);
  const [showConsumablesPanel, setShowConsumablesPanel] = useState(false);
  const [consumableError, setConsumableError] = useState<string | null>(null);
  const [selectedConsumableForTarget, setSelectedConsumableForTarget] = useState<string | null>(null);
  const [showShieldBlockOptions, setShowShieldBlockOptions] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<any | null>(null);
  const [aoeSelection, setAoeSelection] = useState<{
    kind: 'weapon' | 'skill' | 'consumable';
    id: string;
    radius: number;
  } | null>(null);
  const [aoeHoverCenterId, setAoeHoverCenterId] = useState<string | null>(null);
  
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
    if (battle && battle.status === BattleStatus.ACTIVE && character) {
      const playerParticipant = battle.participants.find(p => p.characterId === character.id);
      if (playerParticipant) {
        const hpChanged = Math.floor(playerParticipant.currentHp) !== Math.floor(character.stats.essence.current);
        const protChanged = Math.floor(playerParticipant.currentProtection) !== Math.floor(character.stats.protection.current);
        
        if (hpChanged || protChanged) {
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
    }
  }, [battle?.participants, battle?.status, character?.id]); // Added character?.id to dependencies

  const handleStartBattle = async () => {
    if (!character) return;
    
    try {
      // For testing, we use a known monster template ID from seed.ts
      await initiateBattle('mon-wolf', true);
    } catch (error) {
      console.error('Failed to start battle:', error);
      const message = error instanceof Error ? error.message : 'Не удалось начать бой';
      setNotification({
        type: 'error',
        message
      });
    }
  };

  const handleAttack = async (): Promise<void> => {
    if (!battle || !character || !inventory || !itemTemplates) return;
    
    const currentParticipant = battle.participants[battle.currentTurnIndex];
    if (!currentParticipant) return; // Robustness check

    const target = battle.participants.find((p: any) => !p.isPlayer);
    
    if (!target) return;

    // * Get equipped weapons dynamically
    const equippedWeapons = inventory.items.filter((i: any) => {
      const template = itemTemplates.get(i.templateId);
      return i.isEquipped && template?.type === 'WEAPON';
    }) || [];

    const oneHandedWeapons = equippedWeapons.filter((i: any) => {
      const template = itemTemplates.get(i.templateId);
      return template?.category !== 'TWO_HANDED' && template?.category !== 'MAGIC_STABILIZER';
    });

    const dualWieldPrimary = oneHandedWeapons[0] || null;
    const equippedWeapon = dualWieldPrimary || equippedWeapons.find((i: any) => {
      const template = itemTemplates.get(i.templateId);
      return template?.category !== 'MAGIC_STABILIZER';
    }) || null;
    const weaponTemplate = equippedWeapon ? itemTemplates.get(equippedWeapon.templateId) : null;

    const weaponAoe = getAoeMetaFromDescription(weaponTemplate?.description);
    const aoeRadius = weaponAoe.aoeRadius > 0 ? weaponAoe.aoeRadius : 5;
    if (weaponAoe.isAoE && equippedWeapon) {
      setAoeSelection({ kind: 'weapon', id: equippedWeapon.id, radius: aoeRadius });
      setNotification({ type: 'success', message: `Выберите центр AoE (радиус ${aoeRadius}м)` });
      return;
    }

    const attackWeaponId = dualWieldPrimary?.id || equippedWeapon?.id || null;
    const result = await executeAttack(currentParticipant.id, target.id, attackWeaponId);
    recordActionResult(result);
    await nextTurn();
  };

  const handleBlockWithShield = async (actionType: 'MAIN' | 'BONUS'): Promise<void> => {
    if (!battle || !character || !inventory || !itemTemplates) return;
    
    const playerParticipant = battle.participants.find((p: any) => p.isPlayer);
    if (!playerParticipant) return;

    const equippedShield = inventory.items.find((i: any) => i.isEquipped && itemTemplates.get(i.templateId)?.type === 'SHIELD') || null;
    if (!equippedShield) {
      setNotification({ type: 'error', message: 'Нет экипированного щита' });
      return;
    }
    if ((equippedShield.currentDurability || 0) <= 0) {
      setNotification({ type: 'error', message: 'Щит сломан' });
      return;
    }

    try {
      const result = await blockWithShield(playerParticipant.id, actionType);
      recordActionResult(result);
      setShowShieldBlockOptions(false);
      await nextTurn();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось блокировать щитом';
      setNotification({ type: 'error', message });
    }
  };

  const handleAoeTarget = async (centerId: string): Promise<void> => {
    if (!aoeSelection || !battle) return;
    
    const playerParticipant = battle.participants.find((p: any) => p.isPlayer);
    if (!playerParticipant) return;
    
    const center = battle.participants.find(p => p.id === centerId);
    if (!center) return;

    const targetsInRadius = battle.participants.filter(p => {
      if (p.currentHp <= 0) return false;
      if (p.id === playerParticipant.id) return false;
      return Math.abs(p.distance - center.distance) <= aoeSelection.radius;
    });

    if (targetsInRadius.length === 0) {
      setNotification({ type: 'error', message: 'Нет целей в радиусе AoE' });
      return;
    }

    try {
      let result: any;
      if (aoeSelection.kind === 'weapon') {
        // * Get weapon range dynamically
        let weaponRange = { min: 0, max: 5 };
        if (inventory && itemTemplates) {
          const weaponItem = inventory.items.find((i: any) => i.id === aoeSelection.id);
          if (weaponItem) {
            const weaponTemplate = itemTemplates.get(weaponItem.templateId);
            if (weaponTemplate?.distance) {
              try {
                const parsed = JSON.parse(weaponTemplate.distance);
                weaponRange = { min: parsed.minRange || 0, max: parsed.maxRange || 5 };
              } catch {
                switch (weaponTemplate.distance) {
                  case 'MEDIUM': weaponRange = { min: 5, max: 20 }; break;
                  case 'FAR': weaponRange = { min: 20, max: 50 }; break;
                  case 'SNIPER': weaponRange = { min: 50, max: 200 }; break;
                  default: weaponRange = { min: 0, max: 5 };
                }
              }
            }
          }
        }
        
        const distanceToCenter = Math.abs(playerParticipant.distance - center.distance);
        if (distanceToCenter < weaponRange.min || distanceToCenter > weaponRange.max) {
          setNotification({ type: 'error', message: 'Вне дальности атаки' });
          return;
        }
        result = await executeAttack(playerParticipant.id, center.id, aoeSelection.id);
        recordActionResult(result);
        setAoeSelection(null);
        await nextTurn();
        return;
      } else if (aoeSelection.kind === 'skill') {
        result = await useSkill(playerParticipant.id, aoeSelection.id, center.id);
      } else {
        result = await useConsumable(playerParticipant.id, aoeSelection.id, center.id);
      }
      recordActionResult(result);
      setAoeSelection(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить AoE действие';
      setNotification({ type: 'error', message });
    }
  };

  const handleMove = async (direction: 'left' | 'right' | 'towards' | 'away', targetDistance?: number): Promise<void> => {
    if (!battle || !character) return;
    const currentParticipant = battle.participants[battle.currentTurnIndex];
    if (!currentParticipant || !isPlayerTurn) return;

    await move(currentParticipant.id, direction, targetDistance);
  };

  // * Get available targets for a skill
  const getAvailableTargets = (skillTemplate: any) => {
    if (!battle || skillTemplate.targetType !== 'TARGET') {
      return [];
    }
    
    const playerParticipant = battle.participants.find((p: any) => p.isPlayer);
    if (!playerParticipant) {
      return [];
    }

    const availableTargets: typeof battle.participants = [];
    
    // * Parse skill range
    let skillRange = { minRange: 0, maxRange: 999 };
    if (skillTemplate.distance) {
      try {
        const parsed = JSON.parse(skillTemplate.distance);
        skillRange = { minRange: parsed.minRange || 0, maxRange: parsed.maxRange || 999 };
      } catch {
        // Legacy string categories
        switch (skillTemplate.distance) {
          case 'CLOSE': skillRange = { minRange: 0, maxRange: 5 }; break;
          case 'MEDIUM': skillRange = { minRange: 5, maxRange: 20 }; break;
          case 'FAR': skillRange = { minRange: 20, maxRange: 50 }; break;
          case 'SNIPER': skillRange = { minRange: 50, maxRange: 200 }; break;
          default: skillRange = { minRange: 0, maxRange: 999 };
        }
      }
    }

    // * Check all participants
    for (const participant of battle.participants) {
      if (participant.id === playerParticipant.id || participant.currentHp <= 0) continue;
      
      const distance = Math.abs(playerParticipant.distance - participant.distance);
      if (distance >= skillRange.minRange && distance <= skillRange.maxRange) {
        availableTargets.push(participant);
      }
    }

    return availableTargets;
  };

  const handleUseSkill = async (skillId: string, targetId?: string): Promise<void> => {
    if (!battle || !character) return;
    
    const currentParticipant = battle.participants[battle.currentTurnIndex];
    if (!currentParticipant || currentParticipant.characterId !== character.id) return;

    const skill = character.activeSkills?.find((s: CharacterSkill) => s.id === skillId);
    if (!skill) return;

    const skillTemplate = StaticDataService.getSkillTemplate(skill.skillTemplateId);
    if (!skillTemplate) return;

    if (skillTemplate.targetType === 'AREA') {
      const aoeMeta = getAoeMetaFromDescription(skillTemplate.description);
      const aoeRadius = aoeMeta.aoeRadius > 0 ? aoeMeta.aoeRadius : 5;
      setAoeSelection({ kind: 'skill', id: skillId, radius: aoeRadius });
      setShowSkillsPanel(false);
      setSelectedSkillForTarget(null);
      setNotification({ type: 'success', message: `Выберите центр AoE (радиус ${aoeRadius}м)` });
      return;
    }

    // * Determine target based on skill type
    let target: string | undefined = targetId;
    if (skillTemplate.targetType === 'TARGET') {
      if (!targetId) {
        // * Should not happen - target should be selected already
        setSkillError('Необходимо выбрать цель');
        return;
      }
      target = targetId;
    } else if (skillTemplate.targetType === 'SELF') {
      target = currentParticipant.id;
    }

    setSkillError(null);
    setSelectedSkillForTarget(null);
    try {
      const result = await useSkill(currentParticipant.id, skillId, target);
      recordActionResult(result);
      setShowSkillsPanel(false);
      setSelectedSkillForTarget(null);
      // * Show global notification about skill usage
      setNotification({
        type: 'success',
        message: `Способность применена: ${skillTemplate.name}`,
      });
    } catch (error) {
      // * Show error to user - action was not consumed
      setSkillError(error instanceof Error ? error.message : 'Не удалось применить способность');
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Не удалось применить способность',
      });
      // * Don't close panel on error so user can try again
      // * Keep target selection open if it was open
    }
  };

  const getAoeMetaFromDescription = (description?: string) => {
    let isAoE = false;
    let aoeRadius = 0;
    if (!description) return { isAoE, aoeRadius };
    try {
      const parsed = JSON.parse(description);
      if (parsed.isAoE === true) {
        isAoE = true;
      }
      if (typeof parsed.aoeRadius === 'number') {
        aoeRadius = parsed.aoeRadius;
        if (aoeRadius > 0) {
          isAoE = true;
        }
      }
    } catch {
      // description is plain text
    }
    return { isAoE, aoeRadius };
  };

  const getConsumableMeta = (template: any) => {
    let meta: { targetType: 'SELF' | 'TARGET' | 'AREA'; actionType: 'MAIN' | 'BONUS'; aoeRadius?: number } = {
      targetType: 'SELF',
      actionType: 'BONUS'
    };
    if (template?.description) {
      try {
        const parsed = JSON.parse(template.description);
        if (parsed.targetType === 'SELF' || parsed.targetType === 'TARGET' || parsed.targetType === 'AREA') {
          meta.targetType = parsed.targetType;
        }
        if (parsed.actionType === 'MAIN' || parsed.actionType === 'BONUS') {
          meta.actionType = parsed.actionType;
        }
        if (typeof parsed.aoeRadius === 'number') {
          meta.aoeRadius = parsed.aoeRadius;
        }
        if (parsed.isAoE === true) {
          meta.targetType = 'AREA';
        }
      } catch {
        // description is plain text
      }
    }
    return meta;
  };

  const recordActionResult = (result: any) => {
    if (result) {
      setLastActionResult(result);
    }
  };

  const handleUseConsumable = async (itemId: string, templateId: string, targetId?: string): Promise<void> => {
    if (!battle || !character || !inventory || !itemTemplates) return;

    const playerParticipant = battle.participants.find((p: any) => p.isPlayer);
    if (!playerParticipant) return;

    const template = itemTemplates.get(templateId);
    if (!template) return;

    const meta = getConsumableMeta(template);
    const isScroll = template.category === 'SCROLL';
    
    const equippedStabilizer = inventory.items.find((i: any) => {
      const t = itemTemplates.get(i.templateId);
      return i.isEquipped && t?.category === 'MAGIC_STABILIZER';
    }) || null;
    
    const hasStabilizer = !!equippedStabilizer;
    const hasSlots = equippedStabilizer?.spellSlots && equippedStabilizer.spellSlots.used < equippedStabilizer.spellSlots.max;

    if (isScroll && !hasStabilizer) {
      setConsumableError('Требуется экипированный магический стабилизатор');
      setNotification({ type: 'error', message: 'Требуется экипированный магический стабилизатор' });
      return;
    }
    if (isScroll && !hasSlots) {
      setConsumableError('Нет свободных ячеек заклинаний');
      setNotification({ type: 'error', message: 'Нет свободных ячеек заклинаний' });
      return;
    }

    if (meta.targetType === 'AREA') {
      const aoeRadius = meta.aoeRadius && meta.aoeRadius > 0 ? meta.aoeRadius : 5;
      setAoeSelection({ kind: 'consumable', id: itemId, radius: aoeRadius });
      setShowConsumablesPanel(false);
      setSelectedConsumableForTarget(null);
      setNotification({ type: 'success', message: `Выберите центр AoE (радиус ${aoeRadius}м)` });
      return;
    }

    let finalTargetId = targetId;
    if (meta.targetType === 'SELF') {
      finalTargetId = playerParticipant.id;
    }

    setConsumableError(null);
    setSelectedConsumableForTarget(null);

    try {
      const result = await useConsumable(playerParticipant.id, itemId, finalTargetId);
      recordActionResult(result);
      setShowConsumablesPanel(false);
      setSelectedConsumableForTarget(null);
      setNotification({
        type: 'success',
        message: `Предмет использован: ${template.name}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось использовать предмет';
      setConsumableError(message);
      setNotification({
        type: 'error',
        message
      });
    }
  };

  // * Clear AoE selection when not player turn (must be before conditional return)
  useEffect(() => {
    if (battle && battle.participants && battle.participants.length > 0 && character) {
      const currentParticipant = battle.participants[battle.currentTurnIndex];
      if (currentParticipant) {
        const isPlayerTurn = currentParticipant.characterId === character.id;
        if (!isPlayerTurn) {
          setAoeSelection(null);
          setShowShieldBlockOptions(false);
          setAoeHoverCenterId(null);
        }
      }
    }
  }, [battle?.currentTurnIndex, battle?.participants, character?.id]);

  if (!battle || !battle.participants || battle.participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-fantasy-border rounded bg-black/10">
        <Sword size={48} className="text-fantasy-border mb-4" />
        <h3 className="text-xl font-serif text-gray-500 mb-4 uppercase tracking-widest">Нет активного боя</h3>
        <button 
          onClick={(e) => {
            e.preventDefault();
            handleStartBattle().catch(err => {
              console.error('Error in handleStartBattle button click:', err);
            });
          }} 
          className="fantasy-button"
        >
          Искать конфликт
        </button>
      </div>
    );
  }

  const currentParticipant = battle.participants[battle.currentTurnIndex];
  if (!currentParticipant) return null; // Should not happen with above check

  const isPlayerTurn = currentParticipant.characterId === character?.id;

  const playerParticipant = battle.participants.find((p: any) => p.isPlayer);
  const enemyParticipant = battle.participants.find((p: any) => !p.isPlayer);

  const equippedWeapons = inventory?.items.filter((i: any) => {
    const template = itemTemplates.get(i.templateId);
    return i.isEquipped && template?.type === 'WEAPON';
  }) || [];

  const oneHandedWeapons = equippedWeapons.filter((i: any) => {
    const template = itemTemplates.get(i.templateId);
    return template?.category !== 'TWO_HANDED' && template?.category !== 'MAGIC_STABILIZER';
  });

  const dualWieldPrimary = oneHandedWeapons[0] || null;
  const dualWieldSecondary = oneHandedWeapons[1] || null;
  const hasDualWield = oneHandedWeapons.length >= 2;

  const equippedWeapon = dualWieldPrimary || equippedWeapons.find((i: any) => {
    const template = itemTemplates.get(i.templateId);
    return template?.category !== 'MAGIC_STABILIZER';
  }) || null;
  const weaponTemplate = equippedWeapon ? itemTemplates.get(equippedWeapon.templateId) : null;

  const equippedShield = inventory?.items.find((i: any) => i.isEquipped && itemTemplates.get(i.templateId)?.type === 'SHIELD') || null;
  const shieldTemplate = equippedShield ? itemTemplates.get(equippedShield.templateId) : null;

  const equippedStabilizer = inventory?.items.find((i: any) => {
    const template = itemTemplates.get(i.templateId);
    return i.isEquipped && template?.category === 'MAGIC_STABILIZER';
  }) || null;
  const stabilizerTemplate = equippedStabilizer ? itemTemplates.get(equippedStabilizer.templateId) : null;

  const equippedArmor = inventory?.items.find((i: any) => i.isEquipped && itemTemplates.get(i.templateId)?.type === 'ARMOR');
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
  const shieldDurability = equippedShield?.currentDurability || 0;
  const shieldBaseDurability = shieldTemplate?.baseDurability || 0;
  const canBlockWithShield = isPlayerTurn && shieldDurability > 0 && ((playerParticipant?.mainActions || 0) > 0 || (playerParticipant?.bonusActions || 0) > 0);
  const actionResult = lastActionResult?.result || lastActionResult;
  const isDualWieldResult = !!actionResult?.isDualWield && Array.isArray(actionResult?.dualWieldHits);
  const isAoeResult = !!actionResult?.isAoE && Array.isArray(actionResult?.aoeResults);
  const aoeTotalDamage = actionResult?.totalAoEDamage ?? actionResult?.totalDamage ?? actionResult?.aoeTotalDamage;

  const getWeaponTypeLabel = () => {
    if (!weaponTemplate) return 'Без оружия';
    if (weaponTemplate.category === 'TWO_HANDED') return 'Двуручное';
    if (weaponTemplate.category === 'MAGIC_STABILIZER') return 'Магический стабилизатор';
    if (weaponTemplate.category === 'ONE_HANDED') return 'Одноручное';
    return 'Оружие';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Initiative Timeline */}
      <div className="bg-fantasy-surface border border-fantasy-border rounded p-2 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <div className="text-[10px] uppercase font-bold text-gray-600 px-2 border-r border-fantasy-border">Инициатива</div>
          {battle.participants.map((p: any, i: number) => (
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
            if (!isPlayerTurn || playerParticipant?.mainActions === 0 || aoeSelection) return;
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
            const distanceToPlayer = playerParticipant ? Math.abs(playerParticipant.distance - p.distance) : 0;
            const aoeCenter = aoeSelection && aoeHoverCenterId
              ? battle.participants.find(participant => participant.id === aoeHoverCenterId)
              : null;
            const isAoePreview = aoeSelection && aoeCenter
              ? Math.abs(p.distance - aoeCenter.distance) <= aoeSelection.radius
              : false;
            const isAoeCenter = !!aoeCenter && aoeCenter.id === p.id;

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
                title={playerParticipant ? `Дистанция до игрока: ${distanceToPlayer.toFixed(1)}м` : undefined}
                onMouseEnter={() => {
                  if (aoeSelection && isPlayerTurn && p.currentHp > 0) {
                    setAoeHoverCenterId(p.id);
                  }
                }}
                onMouseLeave={() => {
                  if (aoeSelection) {
                    setAoeHoverCenterId(null);
                  }
                }}
                onClick={() => {
                  if (aoeSelection && isPlayerTurn && p.currentHp > 0) {
                    handleAoeTarget(p.id);
                  }
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
                    isClose && "ring-2 ring-yellow-500/50 ring-offset-1",
                    isAoePreview && "ring-2 ring-fantasy-accent/60 ring-offset-2 ring-offset-black/50",
                    isAoeCenter && "ring-2 ring-white ring-offset-4 ring-offset-black/60"
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
                      {p.isBlocking && (
                        <div className="flex items-center gap-1 text-[8px] text-blue-400 uppercase font-bold">
                          <Shield size={10} /> Блокирует
                        </div>
                      )}
                      
                      {/* Action Indicators */}
                      <div className="flex gap-1 mt-0.5">
                        <div className={clsx("w-2 h-2 rounded-full", p.mainActions > 0 ? "bg-orange-500" : "bg-gray-700")} title="Основное действие" />
                        <div className={clsx("w-2 h-2 rounded-full", p.bonusActions > 0 ? "bg-blue-400" : "bg-gray-700")} title="Доп. действие" />
                      </div>
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
            {aoeSelection && (
              <div className="flex items-center justify-between gap-4 bg-black/30 border border-fantasy-border/30 rounded px-4 py-2">
                <div className="text-[10px] uppercase font-bold text-fantasy-accent">
                  Режим AoE: выберите центр (радиус {aoeSelection.radius}м)
                </div>
                <button
                  onClick={() => setAoeSelection(null)}
                  className="text-[10px] uppercase font-bold text-gray-400 hover:text-white"
                >
                  Отмена
                </button>
              </div>
            )}
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
                <Sword size={18} /> {hasDualWield ? (inRange ? 'Атака двумя оружиями' : 'Вне дальности') : (inRange ? 'Атака' : 'Вне дальности')}
              </button>

              <div className="relative">
                <button 
                  disabled={!canBlockWithShield} 
                  onClick={() => {
                    if (!canBlockWithShield) return;
                    setShowShieldBlockOptions(prev => !prev);
                  }}
                  className={clsx(
                    "fantasy-button flex items-center gap-2 px-6", 
                    !canBlockWithShield && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <Shield size={18} /> Блокировать щитом
                </button>
                {showShieldBlockOptions && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-20 bg-black/90 border border-fantasy-border rounded p-2 flex gap-2">
                    <button
                      disabled={!isPlayerTurn || (playerParticipant?.mainActions || 0) === 0}
                      onClick={() => handleBlockWithShield('MAIN')}
                      className={clsx(
                        "px-3 py-1 text-[10px] uppercase font-bold rounded border border-orange-500 text-orange-400",
                        (!isPlayerTurn || (playerParticipant?.mainActions || 0) === 0) && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      Основное
                    </button>
                    <button
                      disabled={!isPlayerTurn || (playerParticipant?.bonusActions || 0) === 0}
                      onClick={() => handleBlockWithShield('BONUS')}
                      className={clsx(
                        "px-3 py-1 text-[10px] uppercase font-bold rounded border border-blue-400 text-blue-300",
                        (!isPlayerTurn || (playerParticipant?.bonusActions || 0) === 0) && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      Доп.
                    </button>
                  </div>
                )}
              </div>
              
              {(() => {
                const hasReadySkill = character?.activeSkills?.some((s: CharacterSkill) => s.castTimeRemaining === 0);
                const canOpenSkills = isPlayerTurn && (playerParticipant?.mainActions! > 0 || hasReadySkill);

                return (
                  <button 
                    disabled={!canOpenSkills || !character?.activeSkills || character.activeSkills.length === 0} 
                    onClick={() => setShowSkillsPanel(true)}
                    className={clsx(
                      "fantasy-button flex items-center gap-2", 
                      (!canOpenSkills || !character?.activeSkills || character.activeSkills.length === 0) && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <Zap size={18} /> Умение {character?.activeSkills && character.activeSkills.length > 0 && `(${character.activeSkills.length})`}
                  </button>
                );
              })()}
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
                onClick={() => {
                  if (!isPlayerTurn || (playerParticipant?.bonusActions === 0 && playerParticipant?.mainActions === 0)) return;
                  setShowConsumablesPanel(true);
                  setConsumableError(null);
                  setSelectedConsumableForTarget(null);
                }}
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
            <button 
              onClick={() => {
                endBattle(battle.id);
              }} 
              className="fantasy-button"
            >
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
             {stabilizerTemplate && equippedStabilizer?.spellSlots && (
               <div className="text-[10px] text-gray-400 mb-2">
                 Ячейки заклинаний: {equippedStabilizer.spellSlots.used}/{equippedStabilizer.spellSlots.max}
               </div>
             )}

             {/* Restored Equipment Info */}
             <div className="p-2 bg-black/20 rounded border border-fantasy-border/30 text-[9px]">
                <div className="flex justify-between items-center text-gray-400 mb-1">
                  <span className="flex items-center gap-1"><Sword size={10} /> {weaponTemplate?.name || 'Кулаки'}</span>
                  <span className="text-fantasy-essence font-bold">{equippedWeapon?.currentEssence || 5}</span>
                </div>
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>Тип: {getWeaponTypeLabel()}</span>
                  {hasDualWield && (
                    <span>Два оружия</span>
                  )}
                </div>
                {hasDualWield && (
                  <div className="flex flex-col gap-0.5 border-t border-fantasy-border/10 pt-1 mt-1">
                    <div className="flex justify-between text-gray-400">
                      <span>Оружие 1: {itemTemplates.get(dualWieldPrimary?.templateId || '')?.name || '—'}</span>
                      <span>{dualWieldPrimary?.currentEssence || 0}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Оружие 2: {itemTemplates.get(dualWieldSecondary?.templateId || '')?.name || '—'}</span>
                      <span>{dualWieldSecondary?.currentEssence || 0}</span>
                    </div>
                  </div>
                )}
                {armorTemplate && (
                  <div className="flex flex-col gap-0.5 border-t border-fantasy-border/10 pt-1 mt-1">
                    <div className="flex justify-between text-gray-400">
                      <span className="flex items-center gap-1"><Shield size={10} /> {armorTemplate.name}</span>
                      <span>{equippedArmor?.currentDurability}/{armorTemplate.baseDurability}</span>
                    </div>
                  </div>
                )}
                {shieldTemplate && (
                  <div className="flex flex-col gap-0.5 border-t border-fantasy-border/10 pt-1 mt-1">
                    <div className="flex justify-between text-gray-400">
                      <span className="flex items-center gap-1"><Shield size={10} /> {shieldTemplate.name}</span>
                      <span>Щит: прочность {shieldDurability}/{shieldBaseDurability}</span>
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
          {battle.log.map((log: string, i: number) => (
            <div key={i} className={clsx(
              "border-l-2 pl-2",
              log.includes('Попадание') || log.includes('damage') ? "border-fantasy-blood text-gray-300" : "border-fantasy-accent/30 text-gray-500"
            )}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {(isDualWieldResult || isAoeResult) && (
        <div className="bg-black/40 border border-fantasy-border rounded p-4">
          <div className="text-[10px] uppercase font-bold text-gray-600 mb-2 tracking-widest">
            Последний результат
          </div>
          {isDualWieldResult && (
            <div className="space-y-1 text-xs text-gray-300">
              {actionResult.dualWieldHits.map((hit: any, index: number) => (
                <div key={index}>
                  Удар {index + 1}: {hit?.hit ? 'попадание' : 'промах'} ({hit?.damage || 0} урона)
                </div>
              ))}
            </div>
          )}
          {isAoeResult && (
            <div className="space-y-1 text-xs text-gray-300 mt-2">
              {actionResult.aoeResults.map((entry: any, index: number) => (
                <div key={index}>
                  Цель {entry?.targetName || entry?.targetId || index + 1}: {entry?.hit ? 'попадание' : 'промах'} ({entry?.damage || 0} урона)
                </div>
              ))}
              {typeof aoeTotalDamage === 'number' && (
                <div className="text-fantasy-accent font-bold mt-1">Общий урон AoE: {aoeTotalDamage}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skills Panel Modal */}
      {showSkillsPanel && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-fantasy-surface border-2 border-fantasy-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-fantasy-border">
              <h2 className="text-xl font-serif text-fantasy-accent uppercase tracking-wider flex items-center gap-2">
                <Zap size={20} /> Панель умений
              </h2>
              <button
                onClick={() => {
                  setShowSkillsPanel(false);
                  setSkillError(null);
                  setSelectedSkillForTarget(null);
                }}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Error Message */}
            {skillError && (
              <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-sm text-red-400">
                {skillError}
              </div>
            )}

            {/* Skills List */}
            <div className="flex-1 overflow-y-auto p-4">
              {character?.activeSkills && character.activeSkills.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {character.activeSkills.map((skill: CharacterSkill) => {
                    const skillTemplate = StaticDataService.getSkillTemplate(skill.skillTemplateId);
                    if (!skillTemplate) return null;

                    const availableTargets = (skillTemplate.targetType === 'TARGET' || skillTemplate.targetType === 'AREA')
                      ? (skillTemplate.targetType === 'TARGET' ? getAvailableTargets(skillTemplate) : battle.participants.filter(p => p.id !== playerParticipant?.id && p.currentHp > 0))
                      : [];
                    const hasAvailableTarget = (skillTemplate.targetType !== 'TARGET' && skillTemplate.targetType !== 'AREA') || availableTargets.length > 0;
                    const singleTarget = availableTargets.length === 1;

                    const isReleasing = skill.castTimeRemaining === 0;
                    const canStart = skill.currentCooldown === 0 && (skillTemplate.castTime === 0 || skill.castTimeRemaining === null);

                    const canUse = isPlayerTurn && 
                                   (isReleasing || (canStart && playerParticipant?.mainActions! > 0)) && 
                                   hasAvailableTarget;
                    
                    const isCasting = skill.castTimeRemaining !== null && skill.castTimeRemaining !== undefined && skill.castTimeRemaining > 0;
                    const isTargetSelectionMode = selectedSkillForTarget === skill.id && availableTargets.length > 1;

                    return (
                      <div
                        key={skill.id}
                        className={clsx(
                          "border rounded-lg p-4 transition-all",
                          canUse && !isTargetSelectionMode
                            ? "border-fantasy-accent bg-fantasy-accent/10 hover:bg-fantasy-accent/20 cursor-pointer" 
                            : isTargetSelectionMode
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-fantasy-border/30 bg-black/20 opacity-60 cursor-not-allowed"
                        )}
                        onClick={() => {
                          if (canUse && !isTargetSelectionMode) {
                            if (skillTemplate.targetType === 'TARGET') {
                              if (singleTarget) {
                                // * Auto-select single target
                                handleUseSkill(skill.id, availableTargets[0].id);
                              } else if (availableTargets.length > 1) {
                                // * Show target selection
                                setSelectedSkillForTarget(skill.id);
                              } else {
                                // * No targets available (should not happen due to canUse check)
                                setSkillError('Нет доступных целей');
                              }
                            } else {
                              handleUseSkill(skill.id);
                            }
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-serif text-fantasy-accent uppercase text-sm">
                                {skillTemplate.name}
                              </h3>
                              {skillTemplate.rarity && (
                                <span className={clsx(
                                  "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
                                  skillTemplate.rarity === 'COMMON' && "bg-gray-600 text-gray-300",
                                  skillTemplate.rarity === 'RARE' && "bg-blue-600 text-blue-200",
                                  skillTemplate.rarity === 'EPIC' && "bg-purple-600 text-purple-200",
                                  skillTemplate.rarity === 'MYTHIC' && "bg-pink-600 text-pink-200",
                                  skillTemplate.rarity === 'LEGENDARY' && "bg-orange-600 text-orange-200",
                                  skillTemplate.rarity === 'DIVINE' && "bg-yellow-600 text-yellow-200"
                                )}>
                                  {skillTemplate.rarity}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{skillTemplate.description}</p>
                            
                            <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                              <span>Цель: {skillTemplate.targetType === 'SELF' ? 'Себя' : skillTemplate.targetType === 'TARGET' ? 'Цель' : 'Область'}</span>
                              {skillTemplate.targetType === 'TARGET' && skillTemplate.distance && (() => {
                                let range = 'Дальность: Любая';
                                try {
                                  const parsed = JSON.parse(skillTemplate.distance);
                                  range = `Дальность: ${parsed.minRange || 0}-${parsed.maxRange || 999}м`;
                                } catch {
                                  switch (skillTemplate.distance) {
                                    case 'CLOSE': range = 'Дальность: 0-5м'; break;
                                    case 'MEDIUM': range = 'Дальность: 5-20м'; break;
                                    case 'FAR': range = 'Дальность: 20-50м'; break;
                                    case 'SNIPER': range = 'Дальность: 50-200м'; break;
                                  }
                                }
                                return <span>{range}</span>;
                              })()}
                              {skillTemplate.castTime > 0 && (
                                <span>Время подготовки: {skillTemplate.castTime} ход(ов)</span>
                              )}
                              {skillTemplate.cooldown > 0 && (
                                <span>Перезарядка: {skillTemplate.cooldown} ход(ов)</span>
                              )}
                              {skillTemplate.targetType === 'TARGET' && (
                                <span className={clsx(
                                  availableTargets.length > 0 ? "text-green-400" : "text-red-400"
                                )}>
                                  Доступных целей: {availableTargets.length}
                                </span>
                              )}
                              {skillTemplate.targetType === 'AREA' && (() => {
                                const aoeMeta = getAoeMetaFromDescription(skillTemplate.description);
                                const radius = aoeMeta.aoeRadius > 0 ? aoeMeta.aoeRadius : 5;
                                return <span>AoE радиус: {radius}м</span>;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-fantasy-border/30">
                          {skill.currentCooldown > 0 && (
                            <div className="px-2 py-1 bg-red-500/20 border border-red-500 rounded text-[10px] text-red-400 font-bold">
                              Перезарядка: {skill.currentCooldown}
                            </div>
                          )}
                          {isCasting && skill.castTimeRemaining !== null && skill.castTimeRemaining !== undefined && (
                            <div className="px-2 py-1 bg-blue-500/20 border border-blue-500 rounded text-[10px] text-blue-400 font-bold">
                              Применяется: {skill.castTimeRemaining}/{skillTemplate.castTime}
                            </div>
                          )}
                          {canUse && !isCasting && (
                            <div className="px-2 py-1 bg-green-500/20 border border-green-500 rounded text-[10px] text-green-400 font-bold">
                              Готово к использованию
                            </div>
                          )}
                          {!canUse && skill.currentCooldown === 0 && !isCasting && (
                            <div className="px-2 py-1 bg-gray-500/20 border border-gray-500 rounded text-[10px] text-gray-400 font-bold">
                              {(skillTemplate.targetType === 'TARGET' || skillTemplate.targetType === 'AREA') && availableTargets.length === 0 
                                ? 'Нет доступных целей' 
                                : 'Недоступно'}
                            </div>
                          )}
                          {(skillTemplate.targetType === 'TARGET' || skillTemplate.targetType === 'AREA') && availableTargets.length > 1 && canUse && !isTargetSelectionMode && (
                            <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-[10px] text-yellow-400 font-bold">
                              {skillTemplate.targetType === 'AREA' ? 'Выберите центр' : 'Выберите цель'} ({availableTargets.length})
                            </div>
                          )}
                        </div>

                        {/* Target Selection UI */}
                        {isTargetSelectionMode && availableTargets.length > 1 && (
                          <div className="mt-3 pt-3 border-t border-fantasy-border/30">
                            <div className="text-xs text-gray-400 mb-2 uppercase font-bold">Выберите цель:</div>
                            <div className="flex flex-wrap gap-2">
                              {availableTargets.map((target) => (
                                <button
                                  key={target.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUseSkill(skill.id, target.id);
                                  }}
                                  className={clsx(
                                    "px-3 py-2 rounded border transition-colors text-xs font-bold uppercase",
                                    target.isPlayer
                                      ? "border-fantasy-accent bg-fantasy-accent/20 text-fantasy-accent hover:bg-fantasy-accent/30"
                                      : "border-fantasy-blood bg-fantasy-blood/20 text-fantasy-blood hover:bg-fantasy-blood/30"
                                  )}
                                >
                                  {target.isPlayer ? '👤' : '💀'} {target.name}
                                  <div className="text-[10px] opacity-70 mt-1">
                                    {Math.abs((playerParticipant?.distance || 0) - target.distance).toFixed(1)}м
                                  </div>
                                </button>
                              ))}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSkillForTarget(null);
                                }}
                                className="px-3 py-2 rounded border border-fantasy-border/30 bg-black/20 text-gray-400 hover:bg-black/40 text-xs font-bold uppercase"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm uppercase tracking-wider">Нет доступных умений</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Consumables Panel Modal */}
      {showConsumablesPanel && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-fantasy-surface border-2 border-fantasy-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-fantasy-border">
              <h2 className="text-xl font-serif text-fantasy-accent uppercase tracking-wider flex items-center gap-2">
                <Shield size={20} /> Использовать предмет
              </h2>
              <button
                onClick={() => {
                  setShowConsumablesPanel(false);
                  setConsumableError(null);
                  setSelectedConsumableForTarget(null);
                }}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Error Message */}
            {consumableError && (
              <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-sm text-red-400">
                {consumableError}
              </div>
            )}

            {/* Consumables List */}
            <div className="flex-1 overflow-y-auto p-4">
              {inventory?.items && inventory.items.filter((i: any) => itemTemplates.get(i.templateId)?.type === 'CONSUMABLE').length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {inventory.items
                    .filter((i: any) => itemTemplates.get(i.templateId)?.type === 'CONSUMABLE')
                    .map((item: any) => {
                      const template = itemTemplates.get(item.templateId);
                      if (!template) return null;

                      const meta = getConsumableMeta(template);
                      const isBonus = meta.actionType === 'BONUS';
                      const hasAction =
                        isBonus
                          ? (playerParticipant?.bonusActions || 0) > 0 || (playerParticipant?.mainActions || 0) > 0
                          : (playerParticipant?.mainActions || 0) > 0;

                      const availableTargets =
                        (meta.targetType === 'TARGET' || meta.targetType === 'AREA') && battle && playerParticipant
                          ? battle.participants.filter(p => p.id !== playerParticipant.id && p.currentHp > 0)
                          : [];

                      const hasAvailableTarget = (meta.targetType !== 'TARGET' && meta.targetType !== 'AREA') || availableTargets.length > 0;
                      const singleTarget = availableTargets.length === 1;
                      const isTargetSelectionMode = selectedConsumableForTarget === item.id && availableTargets.length > 1;

                      const canUse = isPlayerTurn && hasAction && hasAvailableTarget;

                      return (
                        <div
                          key={item.id}
                          className={clsx(
                            "border rounded-lg p-4 transition-all",
                            canUse && !isTargetSelectionMode
                              ? "border-fantasy-accent bg-fantasy-accent/10 hover:bg-fantasy-accent/20 cursor-pointer"
                              : isTargetSelectionMode
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-fantasy-border/30 bg-black/20 opacity-60 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (!canUse || isTargetSelectionMode) return;
                            if (meta.targetType === 'TARGET') {
                              if (singleTarget) {
                                handleUseConsumable(item.id, item.templateId, availableTargets[0].id);
                              } else if (availableTargets.length > 1) {
                                setSelectedConsumableForTarget(item.id);
                              } else {
                                setConsumableError('Нет доступных целей');
                              }
                            } else if (meta.targetType === 'AREA') {
                              handleUseConsumable(item.id, item.templateId);
                            } else {
                              handleUseConsumable(item.id, item.templateId);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-serif text-fantasy-accent uppercase text-sm">
                                  {template.name}
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-gray-600 text-gray-300">
                                  x{item.quantity}
                                </span>
                              </div>
                              {template.description && typeof template.description === 'string' && (
                                <p className="text-xs text-gray-400 mb-2">
                                  {(() => {
                                    try {
                                      const parsed = JSON.parse(template.description as string);
                                      return parsed.description || template.description;
                                    } catch {
                                      return template.description;
                                    }
                                  })()}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                                <span>Цель: {meta.targetType === 'SELF' ? 'Себя' : meta.targetType === 'AREA' ? 'Область' : 'Цель'}</span>
                                <span>Действие: {meta.actionType === 'MAIN' ? 'Основное' : 'Дополнительное'}</span>
                                {meta.targetType === 'TARGET' && (
                                  <span className={clsx(availableTargets.length > 0 ? 'text-green-400' : 'text-red-400')}>
                                    Доступных целей: {availableTargets.length}
                                  </span>
                                )}
                                {meta.targetType === 'AREA' && meta.aoeRadius && (
                                  <span>AoE радиус: {meta.aoeRadius}м</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Target Selection UI */}
                          {isTargetSelectionMode && availableTargets.length > 1 && (
                            <div className="mt-3 pt-3 border-t border-fantasy-border/30">
                              <div className="text-xs text-gray-400 mb-2 uppercase font-bold">Выберите цель:</div>
                              <div className="flex flex-wrap gap-2">
                                {availableTargets.map((target) => (
                                  <button
                                    key={target.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUseConsumable(item.id, item.templateId, target.id);
                                    }}
                                    className={clsx(
                                      "px-3 py-2 rounded border transition-colors text-xs font-bold uppercase",
                                      target.isPlayer
                                        ? "border-fantasy-accent bg-fantasy-accent/20 text-fantasy-accent hover:bg-fantasy-accent/30"
                                        : "border-fantasy-blood bg-fantasy-blood/20 text-fantasy-blood hover:bg-fantasy-blood/30"
                                    )}
                                  >
                                    {target.isPlayer ? '👤' : '💀'} {target.name}
                                    <div className="text-[10px] opacity-70 mt-1">
                                      {Math.abs((playerParticipant?.distance || 0) - target.distance).toFixed(1)}м
                                    </div>
                                  </button>
                                ))}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedConsumableForTarget(null);
                                  }}
                                  className="px-3 py-2 rounded border border-fantasy-border/30 bg-black/20 text-gray-400 hover:bg-black/40 text-xs font-bold uppercase"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm uppercase tracking-wider">Нет доступных предметов</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
