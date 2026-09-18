import { Router } from 'express';
import {
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;
