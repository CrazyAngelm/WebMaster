-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonsterTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rankOrder" INTEGER NOT NULL,
    "baseEssence" INTEGER NOT NULL,
    "speedId" TEXT NOT NULL DEFAULT 'speed-ordinary',
    "description" TEXT,
    "skills" TEXT NOT NULL,
    "lootTable" TEXT NOT NULL
);
INSERT INTO "new_MonsterTemplate" ("baseEssence", "description", "id", "lootTable", "name", "rankOrder", "skills") SELECT "baseEssence", "description", "id", "lootTable", "name", "rankOrder", "skills" FROM "MonsterTemplate";
DROP TABLE "MonsterTemplate";
ALTER TABLE "new_MonsterTemplate" RENAME TO "MonsterTemplate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
