import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import historyController from '../controllers/history.controller.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('ADMIN'));

router.get('/history', historyController.globalList);

export default router;
