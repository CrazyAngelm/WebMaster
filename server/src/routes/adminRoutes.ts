// 📁 server/src/routes/adminRoutes.ts - Admin routes
// 🎯 Core function: Maps admin endpoints to controller functions
// 🔗 Key dependencies: express, adminController, authMiddleware
// 💡 Usage: Integrated into main Express app

import { Router } from 'express';
import { 
  addGold, 
  skipTime, 
  forceRest, 
  setTimeMultiplier, 
  getConfigs, 
  updateConfig 
} from '../controllers/adminController';
import { authenticate, isAdmin, isOwner } from '../middleware/authMiddleware';

const router = Router();

// All routes here require at least ADMIN role
router.use(authenticate, isAdmin);

router.post('/add-gold', addGold);
router.post('/force-rest', forceRest);

// Owner-only routes
router.post('/skip-time', isOwner, skipTime);
router.post('/set-multiplier', isOwner, setTimeMultiplier);
router.get('/configs', isOwner, getConfigs);
router.put('/configs/:key', isOwner, updateConfig);

export default router;

