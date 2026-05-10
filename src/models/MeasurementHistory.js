import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MeasurementHistory = sequelize.define('MeasurementHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    operation: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['CONVERT', 'COMPARE', 'ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE']],
        },
    },
    measurementType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    input1Value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    input1Unit: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    input2Value: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    input2Unit: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resultValue: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    resultUnit: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resultString: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isError: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    errorMessage: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'MEASUREMENT_HISTORY',
    timestamps: true,
});

export default MeasurementHistory;
