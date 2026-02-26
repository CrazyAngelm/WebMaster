-- CreateTable
CREATE TABLE "NPCMerchantInventory" (
    "id" TEXT NOT NULL,
    "npcId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NPCMerchantInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NPCMerchantInventory_npcId_itemId_key" ON "NPCMerchantInventory"("npcId", "itemId");

-- AddForeignKey
ALTER TABLE "NPCMerchantInventory" ADD CONSTRAINT "NPCMerchantInventory_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "NPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;
