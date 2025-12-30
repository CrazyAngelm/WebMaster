import { create } from 'zustand';
import { 
  Battle, 
  Participant, 
  Character, 
  BattleStatus,
  ExistingItem,
  ItemTemplate
} from '../types/game';
import { CombatEngine } from '../engine/CombatEngine';

interface CombatState {
  battle: Battle | null;
  player: Character | null;
  enemy: Character | null;
  
  // Actions
  initiateBattle: (participants: Participant[], player: Character, enemy: Character) => void;
  nextTurn: () => void;
  executePlayerAttack: (
    weapon: ExistingItem | null,
    defenderArmor: ExistingItem | null,
    armorTemplate: ItemTemplate | null
  ) => void;
  executeEnemyAttack: (
    weapon: ExistingItem | null,
    defenderArmor: ExistingItem | null,
    armorTemplate: ItemTemplate | null
  ) => void;
  endBattle: () => void;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  battle: null,
  player: null,
  enemy: null,

  initiateBattle: (participants, player, enemy) => {
    const battle = CombatEngine.startBattle(participants);
    set({ battle, player, enemy });
  },

  nextTurn: () => {
    const { battle, player, enemy } = get();
    if (!battle) return;

    const updatedBattle = { ...battle };
    CombatEngine.nextTurn(updatedBattle);
    
    // * Add turn change message with character name
    const currentParticipant = updatedBattle.turnOrder[updatedBattle.currentTurnIndex];
    const isPlayerTurn = currentParticipant.characterId === player?.id;
    const characterName = isPlayerTurn ? (player?.name || 'Вы') : (enemy?.name || 'Противник');
    updatedBattle.log.push(`Ход: ${characterName}`);
    
    set({ battle: updatedBattle });
  },

  executePlayerAttack: (weapon, defenderArmor, armorTemplate) => {
    const { battle, player, enemy } = get();
    if (!battle || !player || !enemy) return;

    const result = CombatEngine.resolveAttack(
      player,
      weapon,
      enemy,
      defenderArmor,
      armorTemplate
    );

    const updatedBattle = { 
      ...battle, 
      log: [...battle.log, `${player.name}: ${result.log}`] 
    };

    if (enemy.isDead) {
      updatedBattle.status = BattleStatus.FINISHED;
      updatedBattle.log.push(`${enemy.name} повержен!`);
    }

    set({ battle: updatedBattle, enemy: { ...enemy } });
  },

  executeEnemyAttack: (weapon, defenderArmor, armorTemplate) => {
    const { battle, player, enemy } = get();
    if (!battle || !player || !enemy) return;

    const result = CombatEngine.resolveAttack(
      enemy,
      weapon,
      player,
      defenderArmor,
      armorTemplate
    );

    const updatedBattle = { 
      ...battle, 
      log: [...battle.log, `${enemy.name}: ${result.log}`] 
    };

    if (player.isDead) {
      updatedBattle.status = BattleStatus.FINISHED;
      updatedBattle.log.push(`${player.name} пал в бою...`);
    }

    set({ battle: updatedBattle, player: { ...player } });
  },

  endBattle: () => {
    set({ battle: null, player: null, enemy: null });
  }
}));



