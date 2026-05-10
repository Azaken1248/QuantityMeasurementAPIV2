import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FavoriteConversion = sequelize.define('FavoriteConversion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sourceUnit: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    targetUnit: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'FAVORITE_CONVERSIONS',
    timestamps: true,
    updatedAt: false,
});

export default FavoriteConversion;
