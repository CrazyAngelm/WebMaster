// 📁 src/data/GEQ.ts - Game Experience Questionnaire Data
// 🎯 Core function: GEQ questions and NPC-specific questions for research
// 🔗 Key dependencies: None
// 💡 Usage: Used by GEQSurvey component

export interface GEQQuestion {
  id: string;
  text: string;
  textRu: string;
  category: GEQCategory;
}

export type GEQCategory = 
  | 'immersion' 
  | 'tension' 
  | 'challenge' 
  | 'negative' 
  | 'positive' 
  | 'engagement' 
  | 'npc_specific';

export const GEQ_QUESTIONS: GEQQuestion[] = [
  // Immersion
  { id: 'imm1', text: 'I felt like I was in the game world', textRu: 'Я чувствовал, что нахожусь внутри мира игры', category: 'immersion' },
  { id: 'imm2', text: 'I was interested in exploring the game world', textRu: 'Мне было интересно исследовать игровой мир', category: 'immersion' },
  { id: 'imm3', text: 'I was fully focused on the game', textRu: 'Я полностью сосредоточился на игре', category: 'immersion' },
  
  // Tension
  { id: 'ten1', text: 'I felt tense during gameplay', textRu: 'Я чувствовал напряжение во время игры', category: 'tension' },
  { id: 'ten2', text: 'The game made me feel worried', textRu: 'Игра вызывала у меня беспокойство', category: 'tension' },
  
  // Challenge
  { id: 'cha1', text: 'The game was challenging', textRu: 'Игра была сложной', category: 'challenge' },
  { id: 'cha2', text: 'I had to put in effort to achieve my goals', textRu: 'Мне нужно было приложить усилия для достижения целей', category: 'challenge' },
  
  // Negative
  { id: 'neg1', text: 'I felt frustrated', textRu: 'Я чувствовал разочарование', category: 'negative' },
  { id: 'neg2', text: 'I felt irritated', textRu: 'Я чувствовал раздражение', category: 'negative' },
  
  // Positive
  { id: 'pos1', text: 'I enjoyed playing', textRu: 'Я получал удовольствие от игры', category: 'positive' },
  { id: 'pos2', text: 'The game was fun', textRu: 'Игра была весёлой', category: 'positive' },
  
  // Engagement
  { id: 'eng1', text: 'I was engaged with the gameplay', textRu: 'Я был увлечён игровым процессом', category: 'engagement' },
  { id: 'eng2', text: 'I wanted to keep playing', textRu: 'Мне хотелось продолжать играть', category: 'engagement' },
  
  // NPC-Specific Questions
  { id: 'npc1', text: 'NPCs responded to my actions meaningfully', textRu: 'NPC реагировали на мои действия осмысленно', category: 'npc_specific' },
  { id: 'npc2', text: 'Dialogues with NPCs were interesting', textRu: 'Диалоги с NPC были интересными', category: 'npc_specific' },
  { id: 'npc3', text: 'NPCs remembered our previous conversations', textRu: 'NPC запоминали наши предыдущие разговоры', category: 'npc_specific' },
  { id: 'npc4', text: 'I wanted to talk more with NPCs', textRu: 'Я хотел больше общаться с NPC', category: 'npc_specific' },
  { id: 'npc5', text: 'NPCs helped create the atmosphere of the world', textRu: 'NPC помогали создать атмосферу мира', category: 'npc_specific' },
  { id: 'npc6', text: 'NPCs felt alive', textRu: 'NPC казались живыми', category: 'npc_specific' },
  { id: 'npc7', text: 'NPC dialogues were natural', textRu: 'Диалоги с NPC были естественными', category: 'npc_specific' }
];

export const GEQ_SCALE_LABELS = {
  ru: {
    1: 'Не согласен',
    2: 'Частично не согласен',
    3: 'Нейтрален',
    4: 'Частично согласен',
    5: 'Согласен'
  },
  en: {
    1: 'Strongly Disagree',
    2: 'Disagree',
    3: 'Neutral',
    4: 'Agree',
    5: 'Strongly Agree'
  }
};

export const getQuestionsByCategory = (category: GEQCategory): GEQQuestion[] => {
  return GEQ_QUESTIONS.filter(q => q.category === category);
};

export const getCategories = (): GEQCategory[] => {
  return ['immersion', 'tension', 'challenge', 'negative', 'positive', 'engagement'];
};

export const getCategoryName = (category: GEQCategory, lang: 'ru' | 'en' = 'ru'): string => {
  const names: Record<GEQCategory, { ru: string; en: string }> = {
    immersion: { ru: 'Погружение', en: 'Immersion' },
    tension: { ru: 'Напряжение', en: 'Tension' },
    challenge: { ru: 'Вызов', en: 'Challenge' },
    negative: { ru: 'Негативные эмоции', en: 'Negative' },
    positive: { ru: 'Позитивные эмоции', en: 'Positive' },
    engagement: { ru: 'Вовлечённость', en: 'Engagement' },
    npc_specific: { ru: 'Взаимодействие с NPC', en: 'NPC Interaction' }
  };
  return names[category][lang];
};
