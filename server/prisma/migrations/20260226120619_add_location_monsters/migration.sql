-- CreateTable
CREATE TABLE "LocationMonster" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "chance" INTEGER NOT NULL,

    CONSTRAINT "LocationMonster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocationMonster_locationId_monsterId_key" ON "LocationMonster"("locationId", "monsterId");

-- AddForeignKey
ALTER TABLE "LocationMonster" ADD CONSTRAINT "LocationMonster_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationMonster" ADD CONSTRAINT "LocationMonster_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "MonsterTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
