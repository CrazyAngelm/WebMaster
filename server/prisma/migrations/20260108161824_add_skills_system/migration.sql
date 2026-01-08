-- CreateTable
CREATE TABLE "SkillTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "isStarter" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "skillTemplateId" TEXT NOT NULL,
    "currentCooldown" INTEGER NOT NULL DEFAULT 0,
    "castTimeRemaining" INTEGER,
    "isItemSkill" BOOLEAN NOT NULL DEFAULT false,
    "baseEssence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterSkill_skillTemplateId_fkey" FOREIGN KEY ("skillTemplateId") REFERENCES "SkillTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "lastTrainTime" REAL,
    "lastRestTime" REAL,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("activeQuests", "bio", "bonuses", "createdAt", "description", "id", "isDead", "lastRestTime", "lastTrainTime", "location", "money", "name", "professions", "raceId", "rankId", "stats", "updatedAt", "userId") SELECT "activeQuests", "bio", "bonuses", "createdAt", "description", "id", "isDead", "lastRestTime", "lastTrainTime", "location", "money", "name", "professions", "raceId", "rankId", "stats", "updatedAt", "userId" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
