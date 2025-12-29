// 📁 server/src/routes/characterRoutes.ts - Character routes
// 🎯 Core function: Maps character endpoints to controller functions
// 🔗 Key dependencies: express, characterController, authMiddleware
// 💡 Usage: Integrated into main Express app

import { Router } from 'express';
import { getCharacters, createCharacter, deleteCharacter, updateCharacter, updateInventory } from '../controllers/characterController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getCharacters);
router.post('/', authenticate, createCharacter);
router.put('/:id', authenticate, updateCharacter);
router.put('/:id/inventory', authenticate, updateInventory);
router.delete('/:id', authenticate, deleteCharacter);

export default router;

