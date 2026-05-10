import { UnitType, BaseFactors, MeasurementType, toKelvin, fromKelvin } from '../constants/units.js';
import MeasurementHistory from '../models/MeasurementHistory.js';

class MeasurementService {
    async convert(userId, { value, sourceUnit, targetUnit }) {
        const sourceType = UnitType[sourceUnit];
        const targetType = UnitType[targetUnit];

        if (!sourceType) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown source unit: ${sourceUnit}` };
        }
        if (!targetType) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown target unit: ${targetUnit}` };
        }

        if (sourceType !== targetType) {
            throw {
                status: 400,
                code: 'INVALID_UNIT_TYPE',
                message: `Cannot convert ${sourceType} to ${targetType}`,
            };
        }

        let resultValue;

        if (sourceType === MeasurementType.TEMPERATURE) {
            const kelvin = toKelvin(value, sourceUnit);
            resultValue = fromKelvin(kelvin, targetUnit);
        } else {
            const sourceFactor = BaseFactors[sourceUnit];
            const targetFactor = BaseFactors[targetUnit];
            const baseValue = value * sourceFactor;
            resultValue = baseValue / targetFactor;
        }

        resultValue = Math.round(resultValue * 1_000_000) / 1_000_000;

        MeasurementHistory.create({
            userId,
            operation: 'CONVERT',
            measurementType: sourceType,
            input1Value: value,
            input1Unit: sourceUnit,
            resultValue,
            resultUnit: targetUnit,
            isError: false,
        }).catch(err => {
            console.error('Failed to log measurement history:', err.message);
        });

        return { resultValue, resultUnit: targetUnit };
    }
}

export default new MeasurementService();
