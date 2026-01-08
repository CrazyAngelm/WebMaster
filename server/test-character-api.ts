// Тестовый скрипт для проверки API

async function testCharacterAPI() {
  try {
    // Попробуем получить список персонажей (нужен токен, но посмотрим структуру ответа)
    console.log('Testing character API...');
    
    // Для теста создадим простой GET запрос к серверу
    const res = await fetch('http://localhost:5000/health');
    const health = await res.json();
    console.log('Server health:', health);
    
    console.log('\n=== Проверка структуры данных из seed ===');
    
    // Подключимся к БД напрямую
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const character = await prisma.character.findUnique({
      where: { name: 'Semen' },
      include: {
        inventory: true,
        characterSkills: {
          include: {
            skillTemplate: true
          }
        }
      }
    });
    
    if (!character) {
      console.log('❌ Character not found');
      return;
    }
    
    console.log('\n✅ Character found:', character.name);
    console.log('📊 Skills in DB:', character.characterSkills.length);
    
    character.characterSkills.forEach((cs: any) => {
      console.log(`  - ${cs.skillTemplate.name} (${cs.skillTemplateId})`);
    });
    
    console.log('\n=== Проверка SkillTemplate ===');
    const skillTemplates = await prisma.skillTemplate.findMany();
    console.log('Всего шаблонов навыков в БД:', skillTemplates.length);
    skillTemplates.forEach((st: any) => {
      console.log(`  - ${st.name} (${st.id})`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCharacterAPI();
