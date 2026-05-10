import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import favoriteController from '../controllers/favorite.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/me/favorites', favoriteController.create);
router.get('/me/favorites', favoriteController.list);
router.delete('/me/favorites/:id', favoriteController.remove);

export default router;
