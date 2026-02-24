// 📁 src/services/EventService.ts - Random encounters and story triggers
// 🎯 Core function: Determines when events trigger and processes outcomes
// 🔗 Key dependencies: src/types/game.ts, src/services/StaticDataService.ts
// 💡 Usage: Called during movement or exploration

import { Character, GameEvent, UUID, GameEventChoice, Inventory } from '../types/game';
import { StaticDataService } from './StaticDataService';
import { TradeService } from './TradeService';

export interface EventOutcome {
  type: 'ESSENCE' | 'ENERGY' | 'MONEY' | 'ITEM' | 'DAMAGE' | 'TEXT' | 'NEXT_EVENT';
  value: number | string;
  description: string;
}

export interface EventResult {
  success: boolean;
  character?: Character;
  inventory?: Inventory; // Добавляем инвентарь в результат
  nextEventId?: UUID;
  outcomes: EventOutcome[];
  message: string;
  roll?: number; // Dice roll result (0-100)
}

export const EventService = {
  /**
   * * Roll for a random event during travel
   */
  rollForTravelEvent(): GameEvent | null {
    const config = StaticDataService.getConfig<{ travelEventChance: number }>('EVENT_CONFIG');
    const chance = Math.random();
    if (chance < (config?.travelEventChance || 0.2)) { // 20% chance of an event
      const allEvents = StaticDataService.getAllEvents();
      const randomIndex = Math.floor(Math.random() * allEvents.length);
      return allEvents[randomIndex];
    }
    return null;
  },

  /**
   * * Roll dice (0-100) for success chance
   */
  rollDice(): number {
    return Math.floor(Math.random() * 100) + 1;
  },

  /**
   * * Processes the outcome of a choice in an event
   * * Supports success chance, multiple outcomes, and event chaining
   */
  processChoice(
    character: Character, 
    inventory: Inventory,
    choiceId: UUID,
    eventId?: UUID,
    itemTemplates?: Map<string, any>
  ): EventResult {
    const updatedCharacter = { ...character };
    const updatedInventory = { ...inventory };
    const outcomes: EventOutcome[] = [];
    let message = "";
    let nextEventId: UUID | undefined;
    let success = true;
    const roll = this.rollDice();

    // Find the choice definition if eventId is provided
    let choice: GameEventChoice | undefined;
    if (eventId) {
      const event = StaticDataService.getAllEvents().find(e => e.id === eventId);
      choice = event?.choices?.find(c => c.id === choiceId);
    }

    // Check requirements
    if (choice?.requirement) {
      const req = choice.requirement;
      switch (req.type) {
        case 'MONEY':
          if (updatedCharacter.money < (req.value as number)) {
            return {
              success: false,
              character: updatedCharacter,
              outcomes: [{
                type: 'TEXT',
                value: '',
                description: `Недостаточно золота (нужно: ${req.value})`
              }],
              message: `У вас недостаточно золота для этого действия.`,
              roll
            };
          }
          break;
        case 'ESSENCE':
          if (updatedCharacter.stats.essence.current < (req.value as number)) {
            return {
              success: false,
              character: updatedCharacter,
              outcomes: [{
                type: 'TEXT',
                value: '',
                description: `Недостаточно эссенции (нужно: ${req.value})`
              }],
              message: `У вас недостаточно эссенции для этого действия.`,
              roll
            };
          }
          break;
      }
    }

    // Check success chance (default 100%)
    const successChance = (choice as any)?.successChance ?? 100;
    const isSuccess = roll <= successChance;

    // Legacy hardcoded choices
    if (choiceId === 'choice-buy-fruit') {
      if (isSuccess && updatedCharacter.money >= 10) {
        updatedCharacter.money -= 10;
        const essenceGain = 5 + Math.floor(Math.random() * 5);
        updatedCharacter.stats.essence.current = Math.min(
          updatedCharacter.stats.essence.max, 
          updatedCharacter.stats.essence.current + essenceGain
        );
        outcomes.push(
          { type: 'MONEY', value: -10, description: 'Потрачено 10 золота' },
          { type: 'ESSENCE', value: essenceGain, description: `Восстановлено ${essenceGain} эссенции` }
        );
        message = "Фрукты оказались волшебными! Вы чувствуете прилив сил.";
      } else {
        success = false;
        outcomes.push({ type: 'TEXT', value: '', description: 'Недостаточно золота' });
        message = "У вас недостаточно золота. Путник разочарованно уходит.";
      }
    }
    else if (choiceId === 'choice-meditate') {
      const ENERGY_COST = 30;
      if (updatedCharacter.stats.energy.current >= ENERGY_COST) {
        updatedCharacter.stats.energy.current -= ENERGY_COST;
        const gain = isSuccess ? 15 : 5;
        updatedCharacter.stats.essence.current = Math.min(
          updatedCharacter.stats.essence.max,
          updatedCharacter.stats.essence.current + gain
        );
        outcomes.push(
          { type: 'ENERGY', value: -ENERGY_COST, description: `Потрачено ${ENERGY_COST} энергии` },
          { type: 'ESSENCE', value: gain, description: `Получено ${gain} эссенции` }
        );
        message = isSuccess 
          ? "Медитация прошла успешно! Вы чувствуете гармонию."
          : "Медитация была прервана, но вы всё равно немного отдохнули.";
      } else {
        success = false;
        outcomes.push({ type: 'TEXT', value: '', description: 'Слишком устали' });
        message = "Вы слишком устали для медитации.";
      }
    }
    // New test events
    else if (choiceId === 'choice-help-traveler') {
      // Help wounded traveler
      if (isSuccess) {
        const reward = 50 + Math.floor(Math.random() * 50);
        updatedCharacter.money += reward;
        outcomes.push(
          { type: 'MONEY', value: reward, description: `Получено ${reward} золота` },
          { type: 'TEXT', value: '', description: 'Репутация повышена' }
        );
        message = "Путник оказался торговцем! Он щедро наградил вас за помощь.";
        nextEventId = 'event-traveler-thanks';
      } else {
        outcomes.push({ type: 'TEXT', value: '', description: 'Помощь оказана' });
        message = "Вы помогли путнику, но он оказался беден и не смог отблагодарить.";
      }
    }
    else if (choiceId === 'choice-rob-traveler') {
      // Rob the traveler
      if (isSuccess && roll > 50) {
        const loot = 20 + Math.floor(Math.random() * 30);
        updatedCharacter.money += loot;
        outcomes.push(
          { type: 'MONEY', value: loot, description: `Украдено ${loot} золота` },
          { type: 'TEXT', value: '', description: 'Карма ухудшилась' }
        );
        message = "Вы ограбили путника. Деньги ваши, но совесть ли?";
      } else {
        const damage = 10 + Math.floor(Math.random() * 10);
        updatedCharacter.stats.essence.current = Math.max(0, updatedCharacter.stats.essence.current - damage);
        outcomes.push(
          { type: 'DAMAGE', value: damage, description: `Получено ${damage} урона` },
          { type: 'TEXT', value: '', description: 'Путник оказался воином' }
        );
        message = "Путник оказался мастером боевых искусств! Вы получили поражение.";
      }
    }
    else if (choiceId === 'choice-leave-traveler') {
      outcomes.push({ type: 'TEXT', value: '', description: 'Ничего не произошло' });
      message = "Вы прошли мимо. Путник остался лежать у дороги.";
    }
    else if (choiceId === 'choice-open-chest') {
      // Open abandoned chest
      if (isSuccess && roll > 30) {
        const gold = 100 + Math.floor(Math.random() * 100);
        updatedCharacter.money += gold;
        outcomes.push(
          { type: 'MONEY', value: gold, description: `Найдено ${gold} золота` }
        );
        message = "Сундук был полон сокровищ! Удача на вашей стороне.";
      } else if (roll > 10) {
        const gold = 20 + Math.floor(Math.random() * 30);
        updatedCharacter.money += gold;
        outcomes.push(
          { type: 'MONEY', value: gold, description: `Найдено ${gold} золота` }
        );
        message = "В сундуке оказалось немного золота.";
      } else {
        const damage = 15;
        updatedCharacter.stats.essence.current = Math.max(0, updatedCharacter.stats.essence.current - damage);
        outcomes.push(
          { type: 'DAMAGE', value: damage, description: `Ловушка! Получено ${damage} урона` }
        );
        message = "Сундук оказался ловушкой! Вы ранены.";
      }
    }
    else if (choiceId === 'choice-check-trap') {
      // Check for traps first
      if (isSuccess && roll > 40) {
        const gold = 150 + Math.floor(Math.random() * 50);
        updatedCharacter.money += gold;
        outcomes.push(
          { type: 'MONEY', value: gold, description: `Найдено ${gold} золота` },
          { type: 'TEXT', value: '', description: 'Ловушка обезврежена' }
        );
        message = "Вы заметили и обезвредили ловушку! В сундуке оказалось много золота.";
      } else {
        const damage = 5;
        updatedCharacter.stats.essence.current = Math.max(0, updatedCharacter.stats.essence.current - damage);
        updatedCharacter.money += 10;
        outcomes.push(
          { type: 'DAMAGE', value: damage, description: `Ловушка сработала, но вы пережили (${damage} урона)` },
          { type: 'MONEY', value: 10, description: 'Найдено 10 золота' }
        );
        message = "Вы не заметили ловушку, но сумели выжить и забрать немного золота.";
      }
    }
    else {
      // Default outcome for unknown choices
      outcomes.push({ type: 'TEXT', value: '', description: 'Действие выполнено' });
      message = "Вы сделали свой выбор...";
    }

    // Process dynamic rewards from choice configuration
    if (choice?.rewards && isSuccess) {
      for (const reward of choice.rewards) {
        switch (reward.type) {
          case 'MONEY':
            const moneyAmount = reward.value as number;
            updatedCharacter.money += moneyAmount;
            outcomes.push({
              type: 'MONEY',
              value: moneyAmount,
              description: reward.description || `Получено ${moneyAmount} золота`
            });
            break;

          case 'ESSENCE':
            const essenceAmount = reward.value as number;
            updatedCharacter.stats.essence.current = Math.min(
              updatedCharacter.stats.essence.max,
              updatedCharacter.stats.essence.current + essenceAmount
            );
            outcomes.push({
              type: 'ESSENCE',
              value: essenceAmount,
              description: reward.description || `Получено ${essenceAmount} эссенции`
            });
            break;

          case 'ENERGY':
            const energyAmount = reward.value as number;
            updatedCharacter.stats.energy.current = Math.min(
              updatedCharacter.stats.energy.max,
              updatedCharacter.stats.energy.current + energyAmount
            );
            outcomes.push({
              type: 'ENERGY',
              value: energyAmount,
              description: reward.description || `Получено ${energyAmount} энергии`
            });
            break;

          case 'DAMAGE':
            const damageAmount = reward.value as number;
            updatedCharacter.stats.essence.current = Math.max(0, updatedCharacter.stats.essence.current - damageAmount);
            outcomes.push({
              type: 'DAMAGE',
              value: damageAmount,
              description: reward.description || `Получено ${damageAmount} урона`
            });
            break;

          case 'ITEM':
            const itemTemplateId = reward.value as string;
            const itemTemplate = StaticDataService.getItemTemplate(itemTemplateId);
            if (itemTemplate) {
              // Add item to inventory through TradeService
              const addResult = TradeService.addItemToInventory(
                updatedInventory,
                itemTemplateId,
                1, // Default quantity
                itemTemplates || new Map()
              );
              
              if (addResult.success && addResult.inventory) {
                Object.assign(updatedInventory, addResult.inventory);
                outcomes.push({
                  type: 'ITEM',
                  value: itemTemplateId,
                  description: reward.description || `Получен предмет: ${itemTemplate.name}`
                });
              } else {
                outcomes.push({
                  type: 'TEXT',
                  value: '',
                  description: addResult.reason || 'Не удалось добавить предмет в инвентарь'
                });
              }
            } else {
              outcomes.push({
                type: 'TEXT',
                value: '',
                description: `Предмет с ID ${itemTemplateId} не найден`
              });
            }
            break;

          case 'TEXT':
            outcomes.push({
              type: 'TEXT',
              value: '',
              description: reward.description || (reward.value as string)
            });
            break;
        }
      }
    }

    return {
      success,
      character: updatedCharacter,
      inventory: updatedInventory,
      nextEventId,
      outcomes,
      message,
      roll
    };
  },

  /**
   * * Format outcomes for display
   */
  formatOutcomes(outcomes: EventOutcome[]): string {
    if (outcomes.length === 0) return '';
    
    const lines = outcomes.map(o => {
      const val = Number(o.value);
      switch (o.type) {
        case 'MONEY':
          return `${val > 0 ? '+' : ''}${val} золота`;
        case 'ESSENCE':
          return `${val > 0 ? '+' : ''}${val} эссенции`;
        case 'ENERGY':
          return `${val > 0 ? '+' : ''}${val} энергии`;
        case 'DAMAGE':
          return `-${val} здоровья`;
        case 'ITEM':
          return `Предмет: ${o.description}`;
        default:
          return o.description;
      }
    });
    
    return lines.join(', ');
  }
};
