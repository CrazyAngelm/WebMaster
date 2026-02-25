-- Drop NPC.monsterId unique index and column
DROP INDEX IF EXISTS "NPC_monsterId_key";
ALTER TABLE "NPC" DROP COLUMN IF EXISTS "monsterId";

-- Add FK from NPCMonster to NPC
ALTER TABLE "NPCMonster"
ADD CONSTRAINT "NPCMonster_npcId_fkey"
FOREIGN KEY ("npcId") REFERENCES "NPC"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
