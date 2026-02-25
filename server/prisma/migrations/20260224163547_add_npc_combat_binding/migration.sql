-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL,
    "bonuses" TEXT NOT NULL,
    "professions" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isDead" BOOLEAN NOT NULL DEFAULT false,
    "money" INTEGER NOT NULL DEFAULT 0,
    "activeQuests" TEXT NOT NULL DEFAULT '[]',
    "lastTrainTime" DOUBLE PRECISION,
    "lastRestTime" DOUBLE PRECISION,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "npcDialogHistory" TEXT NOT NULL DEFAULT '{}',
    "npcReputation" TEXT NOT NULL DEFAULT '{}',
    "completedQuests" TEXT NOT NULL DEFAULT '[]',
    "lastLocationChange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "baseSlots" INTEGER NOT NULL DEFAULT 10,
    "items" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "baseSpeedId" TEXT NOT NULL,
    "innateSkills" TEXT NOT NULL,
    "passiveEffects" TEXT NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "maxEssence" INTEGER NOT NULL,
    "minEssenceRoll" INTEGER,
    "maxArtifacts" INTEGER NOT NULL,
    "maxSkills" INTEGER NOT NULL,
    "breakthroughConditions" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "rarity" TEXT NOT NULL,
    "stackSize" INTEGER NOT NULL,
    "isUnique" BOOLEAN NOT NULL,
    "baseEssence" INTEGER,
    "maxEssence" INTEGER,
    "penetration" TEXT,
    "distance" TEXT,
    "baseDurability" INTEGER,
    "ignoreDamage" INTEGER,
    "hitPenalty" INTEGER,
    "evasionPenalty" INTEGER,
    "speedPenalty" INTEGER,
    "accuracyBonus" INTEGER DEFAULT 0,
    "evasionBonus" INTEGER DEFAULT 0,
    "initiativeBonus" INTEGER DEFAULT 0,
    "resistanceBonus" INTEGER DEFAULT 0,
    "slotCount" INTEGER,
    "effects" TEXT,
    "description" TEXT,
    "basePrice" INTEGER,
    "shieldType" TEXT,
    "shieldEvasionPenalty" INTEGER,

    CONSTRAINT "ItemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "resultTemplateId" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "rankRequired" INTEGER NOT NULL,
    "ingredients" TEXT NOT NULL,
    "stationRequired" TEXT,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rankOrder" INTEGER NOT NULL,
    "baseEssence" INTEGER NOT NULL,
    "speedId" TEXT NOT NULL DEFAULT 'speed-ordinary',
    "description" TEXT,
    "skills" TEXT NOT NULL,
    "lootTable" TEXT NOT NULL,

    CONSTRAINT "MonsterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPCTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "npcType" TEXT NOT NULL,
    "rankOrder" INTEGER NOT NULL,
    "baseEssence" INTEGER NOT NULL,
    "speedId" TEXT NOT NULL DEFAULT 'speed-ordinary',
    "description" TEXT,
    "personality" TEXT NOT NULL,
    "greeting" TEXT,
    "skills" TEXT NOT NULL,
    "lootTable" TEXT NOT NULL,

    CONSTRAINT "NPCTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "rewards" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rankRequired" INTEGER NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL,
    "buildings" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hasShop" BOOLEAN NOT NULL,
    "canRest" BOOLEAN NOT NULL DEFAULT false,
    "shopInventory" TEXT,
    "workstations" TEXT NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPCMonster" (
    "id" TEXT NOT NULL,
    "npcId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "essenceBonus" INTEGER NOT NULL DEFAULT 0,
    "protectionBonus" INTEGER NOT NULL DEFAULT 0,
    "accuracyBonus" INTEGER NOT NULL DEFAULT 0,
    "evasionBonus" INTEGER NOT NULL DEFAULT 0,
    "initiativeBonus" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NPCMonster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPC" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "greeting" TEXT,
    "buildingId" TEXT,
    "locationId" TEXT,
    "npcType" TEXT NOT NULL,
    "templateId" TEXT,
    "monsterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NPC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationConnection" (
    "id" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,

    CONSTRAINT "LocationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionRankThreshold" (
    "id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "minExp" INTEGER NOT NULL,
    "maxExp" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProfessionRankThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "distancePerAction" INTEGER NOT NULL,

    CONSTRAINT "Speed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "image" TEXT,
    "choices" TEXT,
    "autoTriggerNextId" TEXT,
    "triggerCondition" TEXT,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EffectTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "parameter" TEXT,
    "isNegative" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "EffectTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "castTime" INTEGER NOT NULL,
    "cooldown" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "distance" TEXT,
    "penetration" TEXT,
    "alwaysPenetrates" BOOLEAN NOT NULL DEFAULT false,
    "effects" TEXT,
    "isCombat" BOOLEAN NOT NULL DEFAULT true,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SkillTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "skillTemplateId" TEXT NOT NULL,
    "currentCooldown" INTEGER NOT NULL DEFAULT 0,
    "castTimeRemaining" INTEGER,
    "isItemSkill" BOOLEAN NOT NULL DEFAULT false,
    "baseEssence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentTurnIndex" INTEGER NOT NULL DEFAULT 0,
    "log" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleParticipant" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "characterId" TEXT,
    "monsterTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "initiative" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "currentProtection" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "maxProtection" INTEGER NOT NULL,
    "mainActions" INTEGER NOT NULL DEFAULT 1,
    "bonusActions" INTEGER NOT NULL DEFAULT 1,
    "isPlayer" BOOLEAN NOT NULL DEFAULT false,
    "distance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "bonuses" TEXT,
    "activeEffects" TEXT NOT NULL DEFAULT '[]',
    "isBlocking" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ALIVE',
    "downedRoundsRemaining" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BattleParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_characterId_key" ON "Inventory"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "NPCMonster_npcId_key" ON "NPCMonster"("npcId");

-- CreateIndex
CREATE UNIQUE INDEX "NPC_monsterId_key" ON "NPC"("monsterId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NPCMonster" ADD CONSTRAINT "NPCMonster_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "MonsterTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSkill" ADD CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSkill" ADD CONSTRAINT "CharacterSkill_skillTemplateId_fkey" FOREIGN KEY ("skillTemplateId") REFERENCES "SkillTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
