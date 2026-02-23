// 📁 server/src/routes/npcRoutes.ts - NPC routes
// 🎯 Core function: Maps NPC endpoints to controller functions
// 🔗 Key dependencies: express, npcController, authMiddleware
// 💡 Usage: Integrated into main Express app

import { Router } from 'express';
import { 
  getNPCByBuilding, 
  getNPCByLocation, 
  getAllNPCs, 
  createNPC, 
  updateNPC, 
  deleteNPC 
} from '../controllers/npcController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllNPCs);
router.get('/building/:buildingId', authenticate, getNPCByBuilding);
router.get('/location/:locationId', authenticate, getNPCByLocation);
router.post('/', authenticate, createNPC);
router.put('/:id', authenticate, updateNPC);
router.delete('/:id', authenticate, deleteNPC);

export default router;
