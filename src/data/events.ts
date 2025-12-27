// 📁 src/data/events.ts - Narrative events
// 🎯 Core function: Static data for random and scripted events
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: EventService, StaticDataService

import { GameEvent, Rarity } from '../types/game';

export const EVENTS: GameEvent[] = [
  {
    id: 'evt-mysterious-traveler',
    title: 'Таинственный путешественник',
    description: 'Закутанная фигура приближается к вам на дороге. Они предлагают странный светящийся фрукт в обмен на несколько монет.',
    rarity: Rarity.COMMON,
    choices: [
      {
        id: 'choice-buy-fruit',
        text: 'Заплатить 10 монет за фрукт',
        outcome: (state: any) => {
          // Logic handled in EventService
        },
        requirement: { type: 'MONEY', value: 10 }
      },
      {
        id: 'choice-ignore',
        text: 'Вежливо отказаться и уйти',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-ambush-wolves',
    title: 'Внезапная засада!',
    description: 'Стая голодных волков выходит из теней! У вас нет выбора, кроме как сражаться.',
    rarity: Rarity.COMMON,
    autoTriggerNextId: undefined // Could lead to combat screen
  },
  {
    id: 'evt-ancient-shrine',
    title: 'Древнее святилище',
    description: 'Вы обнаруживаете скрытое святилище, заросшее мхом. Слабая магическая энергия пульсирует от алтаря.',
    rarity: Rarity.RARE,
    choices: [
      {
        id: 'choice-meditate',
        text: 'Медитировать у алтаря',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-meteor-impact',
    title: 'Падение метеорита',
    description: 'Полоса света пронзает небо и падает поблизости. Вы находите кратер со светящимся металлическим ядром.',
    rarity: Rarity.EPIC,
    choices: [
      {
        id: 'choice-extract-ore',
        text: 'Попытаться извлечь небесную руду',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-dimensional-rift',
    title: 'Разлом измерений',
    description: 'Воздух мерцает, и трещина в реальности открывается перед вами. Странные шёпоты эхом отдаются из пустоты.',
    rarity: Rarity.MYTHIC,
    choices: [
      {
        id: 'choice-step-through',
        text: 'Шагнуть в разлом',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-celestial-trial',
    title: 'Небесное испытание',
    description: 'Облака расступаются, и луч золотого света опускается. Появляется небесный страж, чтобы испытать вашу ценность.',
    rarity: Rarity.LEGENDARY,
    choices: [
      {
        id: 'choice-accept-trial',
        text: 'Принять испытание',
        outcome: (state: any) => {}
      }
    ]
  },
  {
    id: 'evt-divine-ascension',
    title: 'Божественное вознесение',
    description: 'Вы стоите на пороге божественности. Мир вокруг вас начинает растворяться в чистом свете.',
    rarity: Rarity.DIVINE,
    choices: [
      {
        id: 'choice-embrace-divinity',
        text: 'Принять свет',
        outcome: (state: any) => {}
      }
    ]
  }
];

