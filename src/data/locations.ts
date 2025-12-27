// 📁 src/data/locations.ts - World geography
// 🎯 Core function: Static data for locations, buildings, and connections
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: StaticDataService, WorldService

import { Location, Building, LocationConnection, ZoneType } from '../types/game';

export const LOCATIONS: Location[] = [
  {
    id: 'loc-outskirts',
    name: 'Окраины Хорниграда',
    description: 'Пыльные, заброшенные окраины города. Место для тех, кто хочет остаться незамеченным.',
    zoneType: ZoneType.GREEN,
    buildings: ['build-rusty-anchor']
  },
  {
    id: 'loc-city-gates',
    name: 'Городские ворота',
    description: 'Массивные железные ворота Хорниграда. Сильно охраняемые и всегда оживлённые.',
    zoneType: ZoneType.GREEN,
    buildings: ['build-guard-post']
  },
  {
    id: 'loc-merchant-district',
    name: 'Торговый район',
    description: 'Сердце коммерции. Прилавки и магазины выстроились вдоль улиц, продавая всё от экзотических специй до обычной стали.',
    zoneType: ZoneType.GREEN,
    buildings: ['build-district-market']
  },
  {
    id: 'loc-forsaken-woods',
    name: 'Заброшенный лес',
    description: 'Тёмный, извилистый лес, где сущность ощущается тяжёлой и враждебной.',
    zoneType: ZoneType.YELLOW,
    buildings: []
  }
];

export const BUILDINGS: Building[] = [
  {
    id: 'build-rusty-anchor',
    locationId: 'loc-outskirts',
    name: 'Таверна "Ржавый якорь"',
    description: 'Тускло освещённая таверна, пахнущая дешёвым элем и отчаянными мечтами.',
    hasShop: true,
    canRest: true
  },
  {
    id: 'build-guard-post',
    locationId: 'loc-city-gates',
    name: 'Караульный пост восточных ворот',
    description: 'Прочное каменное здание, где стража следит за всем трафиком, входящим в город.',
    hasShop: false,
    canRest: false
  },
  {
    id: 'build-district-market',
    locationId: 'loc-merchant-district',
    name: 'Универсальный магазин',
    description: 'Хорошо укомплектованный магазин, обслуживающий как путешественников, так и жителей.',
    hasShop: true,
    canRest: false
  }
];

export const CONNECTIONS: LocationConnection[] = [
  { id: 'conn-1', fromLocationId: 'loc-outskirts', toLocationId: 'loc-city-gates' },
  { id: 'conn-2', fromLocationId: 'loc-city-gates', toLocationId: 'loc-outskirts' },
  { id: 'conn-3', fromLocationId: 'loc-city-gates', toLocationId: 'loc-merchant-district' },
  { id: 'conn-4', fromLocationId: 'loc-merchant-district', toLocationId: 'loc-city-gates' },
  { id: 'conn-5', fromLocationId: 'loc-merchant-district', toLocationId: 'loc-forsaken-woods' },
  { id: 'conn-6', fromLocationId: 'loc-forsaken-woods', toLocationId: 'loc-merchant-district' }
];



