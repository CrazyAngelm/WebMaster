-- CreateTable
CREATE TABLE "EffectTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "parameter" TEXT,
    "isNegative" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT
);
