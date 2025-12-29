import { Router } from 'express';
import { getStaticBundle } from '../controllers/staticController';

const router = Router();

router.get('/bundle', getStaticBundle);

export default router;


