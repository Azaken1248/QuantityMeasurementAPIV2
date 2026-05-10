import favoriteService from '../services/favorite.service.js';
import { favoriteSchema } from '../validation/schemas.js';

class FavoriteController {
    async create(req, res) {
        try {
            const { error, value } = favoriteSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.details[0].message,
                    },
                    timestamp: new Date().toISOString(),
                });
            }

            const favorite = await favoriteService.create(req.user.id, value);

            return res.status(201).json({
                success: true,
                data: favorite,
                message: 'Favorite conversion saved',
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                error: {
                    code: error.code || 'FAVORITE_FAILED',
                    message: error.message || 'An unexpected error occurred',
                },
                timestamp: new Date().toISOString(),
            });
        }
    }

    async list(req, res) {
        try {
            const favorites = await favoriteService.listByUser(req.user.id);

            return res.status(200).json({
                success: true,
                data: favorites,
                message: `Found ${favorites.length} favorite(s)`,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_FAILED',
                    message: error.message || 'An unexpected error occurred',
                },
                timestamp: new Date().toISOString(),
            });
        }
    }

    async remove(req, res) {
        try {
            await favoriteService.deleteById(req.user.id, req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Favorite removed',
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                error: {
                    code: error.code || 'DELETE_FAILED',
                    message: error.message || 'An unexpected error occurred',
                },
                timestamp: new Date().toISOString(),
            });
        }
    }
}

export default new FavoriteController();
