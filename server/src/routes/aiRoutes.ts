// 📁 server/src/routes/aiRoutes.ts - AI routes
// 🎯 Core function: Maps AI/LLM endpoints to controller functions
// 🔗 Key dependencies: express, aiController, authMiddleware
// 💡 Usage: Integrated into main Express app

import { Router } from 'express';
import { generateResponse, generateQuest, generateNPC, describeLocation } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/generate', authenticate, generateResponse);
router.post('/quest', authenticate, generateQuest);
router.post('/npc', authenticate, generateNPC);
router.post('/describe-location', authenticate, describeLocation);

export default router;
