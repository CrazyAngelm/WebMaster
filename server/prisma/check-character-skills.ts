// 📁 server/prisma/check-character-skills.ts - Debug script to check character skills
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const characterName = 'Semen';

  try {
    const character = await prisma.character.findUnique({
      where: { name: characterName },
      include: { 
        characterSkills: {
          include: {
            skillTemplate: true
          }
        }
      }
    });

    if (!character) {
      console.log(`Character "${characterName}" not found.`);
      return;
    }

    console.log(`Character found: ${character.name} (ID: ${character.id})`);
    console.log(`Skills field (JSON): ${character.skills}`);
    console.log(`Number of characterSkills in relation: ${character.characterSkills.length}`);
    
    character.characterSkills.forEach((cs: any, index: number) => {
      console.log(`[${index + 1}] Skill: ${cs.skillTemplate.name} (ID: ${cs.skillTemplateId})`);
      console.log(`    Current Cooldown: ${cs.currentCooldown}`);
      console.log(`    Cast Time Remaining: ${cs.castTimeRemaining}`);
    });

  } catch (error) {
    console.error('Error checking skills:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
