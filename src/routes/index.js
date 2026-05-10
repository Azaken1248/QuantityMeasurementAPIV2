import express from 'express';
import authRoutes from './auth.routes.js';
import measurementRoutes from './measurement.routes.js';
import userRoutes from './user.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/measure', measurementRoutes);
router.use('/users', userRoutes);

export default router;