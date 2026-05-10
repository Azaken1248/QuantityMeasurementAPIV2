import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; 

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USER',
        validate: {
            isIn: [['USER', 'ADMIN']],
        },
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'USERS',
    timestamps: true,
});

export default User;