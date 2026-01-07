// 📁 server/src/routes/battleRoutes.ts - Battle routes
// 🎯 Core function: Maps battle endpoints to controller functions
// 🔗 Key dependencies: express, battleController, authMiddleware
// 💡 Usage: Integrated into main Express app

import { Router } from 'express';
import { startBattle, resolveAttack, nextTurn, getBattle, getActiveBattle, endBattle } from '../controllers/battleController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/start', authenticate, startBattle);
router.post('/attack', authenticate, resolveAttack);
router.post('/next-turn', authenticate, nextTurn);
router.post('/end/:id', authenticate, endBattle);
router.get('/active/:characterId', authenticate, getActiveBattle);
router.get('/:id', authenticate, getBattle);

export default router;

