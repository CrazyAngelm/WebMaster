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
  ) => Promise<void>;
  executeEnemyAttack: (
    weapon: ExistingItem | null,
    defenderArmor: ExistingItem | null,
    armorTemplate: ItemTemplate | null
  ) => Promise<void>;
  endBattle: () => void;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  battle: null,
  player: null,
  enemy: null,

  initiateBattle: (participants, player, enemy) => {
    // * Create a map of character IDs to names for initiative logging
    const characterNames = new Map<string, string>();
    characterNames.set(player.id, player.name);
    characterNames.set(enemy.id, enemy.name);
    
    const battle = CombatEngine.startBattle(participants, characterNames);
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

  executePlayerAttack: async (weapon, defenderArmor, armorTemplate) => {
    const { battle, player, enemy } = get();
    if (!battle || !player || !enemy) return;

    const result = await CombatEngine.resolveAttack(
      player,
      weapon,
      enemy,
      defenderArmor,
      armorTemplate
    );

    // * Add dice rolls to log first, then the result
    const updatedBattle = { 
      ...battle, 
      log: [...battle.log, ...result.diceLogs, `${player.name}: ${result.log}`] 
    };

    if (enemy.isDead) {
      updatedBattle.status = BattleStatus.FINISHED;
      updatedBattle.log.push(`${enemy.name} повержен!`);
    }

    set({ battle: updatedBattle, enemy: { ...enemy } });
  },

  executeEnemyAttack: async (weapon, defenderArmor, armorTemplate) => {
    const { battle, player, enemy } = get();
    if (!battle || !player || !enemy) return;

    const result = await CombatEngine.resolveAttack(
      enemy,
      weapon,
      player,
      defenderArmor,
      armorTemplate
    );

    // * Add dice rolls to log first, then the result
    const updatedBattle = { 
      ...battle, 
      log: [...battle.log, ...result.diceLogs, `${enemy.name}: ${result.log}`] 
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



