ALTER TABLE "BattleParticipant" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ALIVE';
ALTER TABLE "BattleParticipant" ADD COLUMN "downedRoundsRemaining" INTEGER NOT NULL DEFAULT 0;
