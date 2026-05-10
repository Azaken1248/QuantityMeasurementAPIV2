import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import measurementController from '../controllers/measurement.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/convert', measurementController.convert);
router.post('/compare', measurementController.compare);
// router.post('/calculate', measurementController.calculate);

export default router;