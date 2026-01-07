import { Router } from 'express';
import { getStaticBundle, getServerTime } from '../controllers/staticController';

const router = Router();

router.get('/bundle', getStaticBundle);
router.get('/server-time', getServerTime);

export default router;





