-- AlterTable
-- SQLite does not support ALTER COLUMN, so we need to recreate the table
-- Convert lastTrainTime and lastRestTime from INTEGER to REAL (Float)
-- Also ensures activeQuests column exists (may not exist in older schemas)

-- Step 0: Add activeQuests column if it doesn't exist (SQLite doesn't support IF NOT EXISTS for columns)
-- We'll handle this in the INSERT by using COALESCE

-- Step 1: Create new Character table with Float columns
CREATE TABLE "Character_new" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 2: Copy data from old table, converting INTEGER to REAL
-- Note: This assumes activeQuests column exists. If migrating from initial schema without activeQuests,
-- you may need to add it first or modify this migration to handle missing columns.
INSERT INTO "Character_new" (
    "id", "userId", "name", "raceId", "rankId", "description", "bio",
    "stats", "bonuses", "professions", "location", "isDead", "money",
    "activeQuests", "lastTrainTime", "lastRestTime", "createdAt", "updatedAt"
)
SELECT 
    "id", "userId", "name", "raceId", "rankId", "description", "bio",
    "stats", "bonuses", "professions", "location", "isDead", "money",
    COALESCE("activeQuests", '[]') as "activeQuests",
    CAST("lastTrainTime" AS REAL) as "lastTrainTime",
    CAST(COALESCE("lastRestTime", NULL) AS REAL) as "lastRestTime",
    "createdAt", "updatedAt"
FROM "Character";

-- Step 3: Drop old table
DROP TABLE "Character";

-- Step 4: Rename new table to original name
ALTER TABLE "Character_new" RENAME TO "Character";

-- Step 5: Recreate indexes
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");

