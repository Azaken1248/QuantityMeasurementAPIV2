import FavoriteConversion from '../models/FavoriteConversion.js';
import { UnitType } from '../constants/units.js';

class FavoriteService {
    async create(userId, { label, sourceUnit, targetUnit }) {
        const sourceType = UnitType[sourceUnit];
        const targetType = UnitType[targetUnit];

        if (!sourceType) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown source unit: ${sourceUnit}` };
        }
        if (!targetType) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown target unit: ${targetUnit}` };
        }

        const existing = await FavoriteConversion.findOne({
            where: { userId, sourceUnit, targetUnit },
        });

        if (existing) {
            throw { status: 409, code: 'DUPLICATE_FAVORITE', message: 'This conversion route is already saved' };
        }

        const favorite = await FavoriteConversion.create({
            userId,
            label,
            sourceUnit,
            targetUnit,
        });

        return {
            id: favorite.id,
            label: favorite.label,
            sourceUnit: favorite.sourceUnit,
            targetUnit: favorite.targetUnit,
            createdAt: favorite.createdAt,
        };
    }

    async listByUser(userId) {
        const favorites = await FavoriteConversion.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'label', 'sourceUnit', 'targetUnit', 'createdAt'],
        });

        return favorites;
    }

    async deleteById(userId, favoriteId) {
        const favorite = await FavoriteConversion.findOne({
            where: { id: favoriteId, userId },
        });

        if (!favorite) {
            throw { status: 404, code: 'NOT_FOUND', message: 'Favorite not found' };
        }

        await favorite.destroy();
    }
}

export default new FavoriteService();
