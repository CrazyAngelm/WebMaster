// 📁 server/src/routes/authRoutes.ts - Authentication routes
// 🎯 Core function: Maps auth endpoints to controller functions
// 🔗 Key dependencies: express, authController
// 💡 Usage: Integrated into main Express app

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;

