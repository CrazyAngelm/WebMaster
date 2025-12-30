-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
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
    "lastTrainTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "baseSlots" INTEGER NOT NULL DEFAULT 10,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "baseSpeedId" TEXT NOT NULL,
    "innateSkills" TEXT NOT NULL,
    "passiveEffects" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "maxEssence" INTEGER NOT NULL,
    "minEssenceRoll" INTEGER,
    "maxArtifacts" INTEGER NOT NULL,
    "maxSkills" INTEGER NOT NULL,
    "breakthroughConditions" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ItemTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "slotCount" INTEGER,
    "effects" TEXT,
    "description" TEXT,
    "basePrice" INTEGER
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultTemplateId" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "rankRequired" INTEGER NOT NULL,
    "ingredients" TEXT NOT NULL,
    "stationRequired" TEXT
);

-- CreateTable
CREATE TABLE "MonsterTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rankOrder" INTEGER NOT NULL,
    "baseEssence" INTEGER NOT NULL,
    "description" TEXT,
    "skills" TEXT NOT NULL,
    "lootTable" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "rewards" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rankRequired" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL,
    "buildings" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hasShop" BOOLEAN NOT NULL,
    "canRest" BOOLEAN NOT NULL DEFAULT false,
    "shopInventory" TEXT,
    "workstations" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LocationConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProfessionRankThreshold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rank" INTEGER NOT NULL,
    "minExp" INTEGER NOT NULL,
    "maxExp" REAL NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Speed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "distancePerAction" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "image" TEXT,
    "choices" TEXT,
    "autoTriggerNextId" TEXT,
    "triggerCondition" TEXT
);

-- CreateTable
CREATE TABLE "GameConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_characterId_key" ON "Inventory"("characterId");
