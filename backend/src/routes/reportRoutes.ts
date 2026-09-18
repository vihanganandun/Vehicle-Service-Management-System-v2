import { Router } from 'express';
import { getDashboardStats, getReports } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/', getReports);

export default router;
