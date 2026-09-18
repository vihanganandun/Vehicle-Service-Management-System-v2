import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import customerRoutes from './customerRoutes';
import vehicleRoutes from './vehicleRoutes';
import appointmentRoutes from './appointmentRoutes';
import serviceRoutes from './serviceRoutes';
import paymentRoutes from './paymentRoutes';
import historyRoutes from './historyRoutes';
import reportRoutes from './reportRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/services', serviceRoutes);
router.use('/payments', paymentRoutes);
router.use('/service-history', historyRoutes);
router.use('/reports', reportRoutes);

export default router;
