-- Normalize NPCMerchantInventory: remove denormalized columns, add ItemTemplate FK
-- name, price, type come from ItemTemplate via relation

-- Add foreign key to ItemTemplate (if not exists)
ALTER TABLE "NPCMerchantInventory" ADD CONSTRAINT "NPCMerchantInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop denormalized columns
ALTER TABLE "NPCMerchantInventory" DROP COLUMN IF EXISTS "name";
ALTER TABLE "NPCMerchantInventory" DROP COLUMN IF EXISTS "price";
ALTER TABLE "NPCMerchantInventory" DROP COLUMN IF EXISTS "type";
