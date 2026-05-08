import express from 'express';
import authRoutes from './auth.routes.js';
import measurementRoutes from './measurement.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/measure', measurementRoutes);

export default router;