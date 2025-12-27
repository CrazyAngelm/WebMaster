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
  attacker: Character | null;
  defender: Character | null;
  
  // Actions
  initiateBattle: (participants: Participant[], attacker: Character, defender: Character) => void;
  nextTurn: () => void;
  executeAttack: (
    attackerWeapon: ExistingItem | null,
    defenderArmor: ExistingItem | null,
    armorTemplate: ItemTemplate | null
  ) => void;
  endBattle: () => void;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  battle: null,
  attacker: null,
  defender: null,

  initiateBattle: (participants, attacker, defender) => {
    const battle = CombatEngine.startBattle(participants);
    set({ battle, attacker, defender });
  },

  nextTurn: () => {
    const { battle } = get();
    if (!battle) return;

    const updatedBattle = { ...battle };
    CombatEngine.nextTurn(updatedBattle);
    set({ battle: updatedBattle });
  },

  executeAttack: (attackerWeapon, defenderArmor, armorTemplate) => {
    const { battle, attacker, defender } = get();
    if (!battle || !attacker || !defender) return;

    const result = CombatEngine.resolveAttack(
      attacker,
      attackerWeapon,
      defender,
      defenderArmor,
      armorTemplate
    );

    const updatedBattle = { 
      ...battle, 
      log: [...battle.log, result.log] 
    };

    // If defender died, end battle
    if (defender.isDead) {
      updatedBattle.status = BattleStatus.FINISHED;
      updatedBattle.log.push(`${defender.name} has been defeated!`);
    }

    set({ battle: updatedBattle, defender: { ...defender } });
  },

  endBattle: () => {
    set({ battle: null, attacker: null, defender: null });
  }
}));



