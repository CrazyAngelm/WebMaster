// 📁 src/data/events.ts - Narrative events
// 🎯 Core function: Static data for random and scripted events
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: EventService, StaticDataService

import { GameEvent, Rarity } from '../types/game';

export const EVENTS: GameEvent[] = [
  {
    id: 'evt-mysterious-traveler',
    title: 'A Mysterious Traveler',
    description: 'A hooded figure approaches you on the road. They offer a strange, glowing fruit in exchange for a few coins.',
    rarity: Rarity.COMMON,
    choices: [
      {
        id: 'choice-buy-fruit',
        text: 'Pay 10 coins for the fruit',
        outcome: (state: any) => {
          // Logic handled in EventService
        },
        requirement: { type: 'MONEY', value: 10 }
      },
      {
        id: 'choice-ignore',
        text: 'Politely decline and walk away',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-ambush-wolves',
    title: 'Sudden Ambush!',
    description: 'A pack of hungry wolves emerges from the shadows! You have no choice but to fight.',
    rarity: Rarity.COMMON,
    autoTriggerNextId: undefined // Could lead to combat screen
  },
  {
    id: 'evt-ancient-shrine',
    title: 'Ancient Shrine',
    description: 'You discover a hidden shrine overgrown with moss. A faint magical energy pulsates from the altar.',
    rarity: Rarity.RARE,
    choices: [
      {
        id: 'choice-meditate',
        text: 'Meditate at the altar',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-meteor-impact',
    title: 'Meteor Impact',
    description: 'A streak of light tears through the sky and crashes nearby. You find a crater with a glowing metal core.',
    rarity: Rarity.EPIC,
    choices: [
      {
        id: 'choice-extract-ore',
        text: 'Attempt to extract the celestial ore',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-dimensional-rift',
    title: 'Dimensional Rift',
    description: 'The air shimmers and a crack in reality opens before you. Strange whispers echo from the void.',
    rarity: Rarity.MYTHIC,
    choices: [
      {
        id: 'choice-step-through',
        text: 'Step into the rift',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-celestial-trial',
    title: 'Celestial Trial',
    description: 'The clouds part and a beam of golden light descends. A celestial guardian appears to test your worth.',
    rarity: Rarity.LEGENDARY,
    choices: [
      {
        id: 'choice-accept-trial',
        text: 'Accept the trial',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-divine-ascension',
    title: 'Divine Ascension',
    description: 'You stand at the threshold of divinity. The world around you begins to dissolve into pure light.',
    rarity: Rarity.DIVINE,
    choices: [
      {
        id: 'choice-embrace-divinity',
        text: 'Embrace the light',
        outcome: (state: any) => {}
      }
    ]
  }
];

