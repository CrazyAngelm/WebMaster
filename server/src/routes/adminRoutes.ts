// 📁 server/src/routes/adminRoutes.ts - Admin routes
// 🎯 Core function: Maps admin endpoints to controller functions
// 🔗 Key dependencies: express, adminController, authMiddleware
// 💡 Usage: Integrated into main Express app

import { Router } from 'express';
import { addGold, skipTime, forceRest, setTimeMultiplier } from '../controllers/adminController';
import { authenticate, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// All routes here require ADMIN role
router.use(authenticate, isAdmin);

router.post('/add-gold', addGold);
router.post('/skip-time', skipTime);
router.post('/set-multiplier', setTimeMultiplier);
router.post('/force-rest', forceRest);

export default router;

