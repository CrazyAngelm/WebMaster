// 📁 src/data/locations.ts - World geography
// 🎯 Core function: Static data for locations, buildings, and connections
// 🔗 Key dependencies: src/types/game.ts
// 💡 Usage: StaticDataService, WorldService

import { Location, Building, LocationConnection, ZoneType } from '../types/game';

export const LOCATIONS: Location[] = [
  {
    id: 'loc-outskirts',
    name: 'Hornygrad Outskirts',
    description: 'The dusty, neglected edges of the city. A place for those who wish to remain unnoticed.',
    zoneType: ZoneType.GREEN,
    buildings: ['build-rusty-anchor']
  },
  {
    id: 'loc-city-gates',
    name: 'City Gates',
    description: 'The massive iron-bound gates of Hornygrad. Heavily guarded and always busy.',
    zoneType: ZoneType.GREEN,
    buildings: ['build-guard-post']
  },
  {
    id: 'loc-merchant-district',
    name: 'Merchant District',
    description: 'The heart of commerce. Stalls and shops line the streets, selling everything from exotic spices to basic steel.',
    zoneType: ZoneType.GREEN,
    buildings: ['build-district-market']
  },
  {
    id: 'loc-forsaken-woods',
    name: 'Forsaken Woods',
    description: 'A dark, twisted forest where the essence feels heavy and hostile.',
    zoneType: ZoneType.YELLOW,
    buildings: []
  }
];

export const BUILDINGS: Building[] = [
  {
    id: 'build-rusty-anchor',
    locationId: 'loc-outskirts',
    name: 'The Rusty Anchor Tavern',
    description: 'A dimly lit tavern smelling of cheap ale and desperate dreams.',
    hasShop: true
  },
  {
    id: 'build-guard-post',
    locationId: 'loc-city-gates',
    name: 'East Gate Guard Post',
    description: 'A sturdy stone building where guards monitor all traffic entering the city.',
    hasShop: false
  },
  {
    id: 'build-district-market',
    locationId: 'loc-merchant-district',
    name: 'General Store',
    description: 'A well-stocked shop catering to travelers and residents alike.',
    hasShop: true
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



