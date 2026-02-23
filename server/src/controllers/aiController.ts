// 📁 server/src/controllers/aiController.ts
// 🎯 Core function: Handles LLM API calls to DeepSeek
// 🔗 Key dependencies: axios, dotenv
// 💡 Usage: Server-side proxy for LLM generation

import { Request, Response } from 'express';
import axios from 'axios';

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const isAIConfigured = (): boolean => {
  return !!API_KEY && API_KEY !== 'sk-your-deepseek-api-key-here';
};

if (!isAIConfigured()) {
  console.warn('[AI Controller] WARNING: DEEPSEEK_API_KEY not configured. AI features will use fallback mode.');
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GenerateRequest {
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface QuestGenerateRequest {
  locationName: string;
  locationDescription: string;
  playerName: string;
  playerLevel?: number;
}

interface NPCGenerateRequest {
  locationName: string;
  locationDescription: string;
  npcType?: 'merchant' | 'guard' | 'questgiver' | 'villager' | 'mysterious';
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  userLimit.count++;
  return true;
};

export const generateResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAIConfigured()) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const userId = req.userId || 'anonymous';
    
    if (!checkRateLimit(userId)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const { messages, temperature = 0.7, max_tokens = 500 } = req.body as GenerateRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages,
        temperature,
        max_tokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    res.json({ content });
  } catch (error: any) {
    console.error('LLM API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.status(500).json({ error: 'Invalid API key configuration' });
      return;
    }
    
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'Request timeout. Please try again.' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to generate response' });
  }
};

export const generateQuest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAIConfigured()) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const userId = req.userId || 'anonymous';
    
    if (!checkRateLimit(userId)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const { locationName, locationDescription, playerName, playerLevel } = req.body as QuestGenerateRequest;

    const systemPrompt = `Ты — генератор квестов для фэнтези RPG.
Создай интересный квест, подходящий для указанной локации.
Верни JSON без markdown форматирования:
{
  "title": "Название квеста",
  "description": "Описание (2-3 предложения)",
  "objectives": [
    { "type": "KILL|COLLECT|VISIT|TALK", "target": "Описание цели", "amount": 1 }
  ],
  "rewards": { "money": 100, "essence": 50 }
}`;

    const userPrompt = `Локация: ${locationName}
Описание: ${locationDescription}
Игрок: ${playerName}
${playerLevel ? `Уровень: ${playerLevel}` : ''}

Создай квест, подходящий для этой локации.`;

    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 400,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '{}';
    
    let questData;
    try {
      questData = JSON.parse(content);
    } catch {
      questData = {
        title: 'Случайное приключение',
        description: content.substring(0, 100),
        objectives: [],
        rewards: { money: 50, essence: 25 }
      };
    }

    res.json(questData);
  } catch (error: any) {
    console.error('Quest Generation Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate quest' });
  }
};

export const generateNPC = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAIConfigured()) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const userId = req.userId || 'anonymous';
    
    if (!checkRateLimit(userId)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const { locationName, locationDescription, npcType } = req.body as NPCGenerateRequest;

    const typeDescription = {
      merchant: 'торговец, который продает и покупает предметы',
      guard: 'охранник или страж, следящий за порядком',
      questgiver: ' NPC, который дает задания путешественникам',
      villager: 'обычный житель деревни или города',
      mysterious: 'таинственный незнакомец с скрытыми мотивами'
    };

    const systemPrompt = `Ты — генератор NPC для фэнтези RPG.
Создай интересного персонажа для указанной локации.
Верни JSON без markdown форматирования:
{
  "name": "Имя персонажа",
  "description": "Внешность и роль (1 предложение)",
  "personality": "Черты характера (2-3 слова)",
  "dialogueGreeting": "Приветственная фраза при встрече"
}`;

    const userPrompt = `Локация: ${locationName}
Описание: ${locationDescription}
Тип NPC: ${npcType ? typeDescription[npcType] || 'обычный житель' : 'обычный житель'}

Создай подходящего персонажа.`;

    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 300,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '{}';
    
    let npcData;
    try {
      npcData = JSON.parse(content);
    } catch {
      npcData = {
        name: 'Незнакомец',
        description: 'Таинственный путник',
        personality: 'Нейтральный',
        dialogueGreeting: 'Привет, путник.'
      };
    }

    res.json(npcData);
  } catch (error: any) {
    console.error('NPC Generation Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate NPC' });
  }
};

export const describeLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAIConfigured()) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const userId = req.userId || 'anonymous';
    
    if (!checkRateLimit(userId)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const { locationName, locationDescription, timeOfDay = 'день', events = [] } = req.body;

    const systemPrompt = `Ты — сказитель фэнтези мира.
Создай атмосферное описание локации.
Верни 2-4 предложения. Будь краток и атмосферечен.`;

    const userPrompt = `Локация: ${locationName}
Описание: ${locationDescription}
Время суток: ${timeOfDay}
${events.length > 0 ? `Недавние события: ${events.join(', ')}` : ''}

Опиши это место атмосферно.`;

    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || locationDescription;
    res.json({ description: content });
  } catch (error: any) {
    console.error('Location Description Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate description' });
  }
};
