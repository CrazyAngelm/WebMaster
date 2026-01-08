-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BattleParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "distance" REAL NOT NULL DEFAULT 0.0,
    "bonuses" TEXT,
    "activeEffects" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "BattleParticipant_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BattleParticipant" ("battleId", "bonusActions", "bonuses", "characterId", "currentHp", "currentProtection", "distance", "id", "initiative", "isPlayer", "mainActions", "maxHp", "maxProtection", "monsterTemplateId", "name") SELECT "battleId", "bonusActions", "bonuses", "characterId", "currentHp", "currentProtection", "distance", "id", "initiative", "isPlayer", "mainActions", "maxHp", "maxProtection", "monsterTemplateId", "name" FROM "BattleParticipant";
DROP TABLE "BattleParticipant";
ALTER TABLE "new_BattleParticipant" RENAME TO "BattleParticipant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
