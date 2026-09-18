import { Router } from 'express';
import { getServiceHistory } from '../controllers/historyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getServiceHistory);

export default router;
