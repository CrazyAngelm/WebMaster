// 📁 server/prisma/add-starter-skills-to-character.ts - Add starter skills to existing character
// 🎯 Core function: Adds starter skills to an existing character
// 💡 Usage: node -r ts-node/register prisma/add-starter-skills-to-character.ts <characterName>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const characterName = process.argv[2];
  
  if (!characterName) {
    console.error('Usage: ts-node add-starter-skills-to-character.ts <characterName>');
    process.exit(1);
  }

  try {
    // * Find character by name
    const character = await prisma.character.findUnique({
      where: { name: characterName },
      include: { characterSkills: true }
    });

    if (!character) {
      console.error(`Character "${characterName}" not found!`);
      process.exit(1);
    }

    console.log(`Found character: ${character.name} (ID: ${character.id})`);

    // * Get starter skills
    const starterSkills = await (prisma as any).skillTemplate.findMany({
      where: { isStarter: true }
    });

    if (starterSkills.length === 0) {
      console.error('No starter skills found in database! Run seed-skills.ts first.');
      process.exit(1);
    }

    console.log(`Found ${starterSkills.length} starter skills:`);
    starterSkills.forEach((s: any) => console.log(`  - ${s.name} (${s.id})`));

    // * Check which skills character already has
    const existingSkillIds = character.characterSkills.map((cs: any) => cs.skillTemplateId);
    const skillsToAdd = starterSkills.filter((s: any) => !existingSkillIds.includes(s.id));

    if (skillsToAdd.length === 0) {
      console.log('Character already has all starter skills!');
      await prisma.$disconnect();
      return;
    }

    console.log(`\nAdding ${skillsToAdd.length} new skills...`);

    // * Add missing starter skills
    for (const skill of skillsToAdd) {
      await (prisma as any).characterSkill.create({
        data: {
          characterId: character.id,
          skillTemplateId: skill.id,
          currentCooldown: 0,
          castTimeRemaining: null,
          isItemSkill: false,
          baseEssence: 0
        }
      });
      console.log(`  ✓ Added: ${skill.name}`);
    }

    // * Update character.skills field (array of skill IDs)
    const allSkillIds = [...existingSkillIds, ...skillsToAdd.map((s: any) => s.id)];
    await prisma.character.update({
      where: { id: character.id },
      data: {
        skills: JSON.stringify(allSkillIds)
      }
    });

    console.log(`\n✓ Successfully added starter skills to ${character.name}!`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
