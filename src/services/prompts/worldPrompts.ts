// 📁 src/services/prompts/worldPrompts.ts
// 🎯 Core function: World/Location description prompt templates
// 🔗 Key dependencies: types/game
// 💡 Usage: Used for generating atmospheric descriptions

import { Location } from '../../types/game';

export const WORLD_PROMPTS = {
  locationDescription: {
    systemPrompt: `
Ты — сказитель фэнтези мира Hornygrad.
Создавай атмосферные описания локаций, которые погружают игрока в мир.

Правила:
1. 2-4 предложения
2. Атмосферно и детально
3. Используй все органы чувств (зрение, звуки, запахи)
4. Соответствуй тону фэнтези
5. Избегай клише
6. Отвечай на русском языке
`,

    userPrompt: (location: Location, timeOfDay?: string, weather?: string) => {
      let prompt = `Локация: ${location.name}\n`;
      prompt += `Базовое описание: ${location.description}\n`;
      prompt += `Тип зоны: ${location.zoneType}\n`;
      
      if (timeOfDay) {
        prompt += `Время суток: ${timeOfDay}\n`;
      }
      
      if (weather) {
        prompt += `Погода: ${weather}\n`;
      }

      prompt += `\nСоздай атмосферное описание этой локации.`;
      return prompt;
    }
  },

  eventDescription: {
    systemPrompt: `
Ты — сказитель фэнтези мира.
Описывай игровые события драматично и интересно.

Правила:
1. 1-3 предложения
2. Драматично, но понятно
3. Связано с действиями игрока
4. На русском языке
`,

    userPrompt: (eventType: string, context: string) => `
Событие: ${eventType}
Контекст: ${context}

Опиши это событие.
`
  },

  timeOfDay: {
    dawn: ' рассвет. Первые лучи солнца пробиваются сквозь туман.',
    morning: ' утро. Мир просыпается, птицы поют.',
    noon: ' полдень. Солнце в зените, жарко.',
    afternoon: ' послеполденье. Тени удлиняются.',
    evening: ' вечер. Звёзды появляются на небе.',
    night: ' ночь. Луна освещает окрестности.',
    midnight: ' полночь. Тёмное время суток.'
  },

  weatherEffects: {
    clear: 'Небо чистое, видимость отличная.',
    cloudy: 'Облака покрывают небо, свет рассеянный.',
    rainy: 'Дождь барабанит по листьям, дороги размыты.',
    foggy: 'Густой туман скрывает окрестности.',
    stormy: 'Гроза гремит, молнии освещают небо.',
    snowy: 'Снег покрывает всё вокруг, холодно.'
  },

  zoneAtmosphere: {
    GREEN: '相对安全, есть опасность, но не смертельно.',
    YELLOW: 'Опасная территория, враги сильнее обычного.',
    RED: 'Смертельно опасно, сильные монстры и ловушки.'
  }
};

export const getRandomTimeOfDay = (): string => {
  const times = Object.keys(WORLD_PROMPTS.timeOfDay);
  return times[Math.floor(Math.random() * times.length)];
};

export const getRandomWeather = (): string => {
  const weathers = Object.keys(WORLD_PROMPTS.weatherEffects);
  return weathers[Math.floor(Math.random() * weathers.length)];
};
