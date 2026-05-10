import { UnitType, BaseFactors, MeasurementType, toKelvin, fromKelvin } from '../constants/units.js';
import MeasurementHistory from '../models/MeasurementHistory.js';

class MeasurementService {
    _toBase(value, unit) {
        const type = UnitType[unit];
        if (type === MeasurementType.TEMPERATURE) {
            return toKelvin(value, unit);
        }
        return value * BaseFactors[unit];
    }

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

    async compare(userId, { qty1, qty2 }) {
        const type1 = UnitType[qty1.unit];
        const type2 = UnitType[qty2.unit];

        if (!type1) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown unit: ${qty1.unit}` };
        }
        if (!type2) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown unit: ${qty2.unit}` };
        }

        if (type1 !== type2) {
            throw {
                status: 400,
                code: 'INVALID_UNIT_TYPE',
                message: `Cannot compare ${type1} with ${type2}`,
            };
        }

        const base1 = this._toBase(qty1.value, qty1.unit);
        const base2 = this._toBase(qty2.value, qty2.unit);

        const EPSILON = 1e-6;
        const resultString = Math.abs(base1 - base2) < EPSILON ? 'Equal' : 'Not Equal';

        MeasurementHistory.create({
            userId,
            operation: 'COMPARE',
            measurementType: type1,
            input1Value: qty1.value,
            input1Unit: qty1.unit,
            input2Value: qty2.value,
            input2Unit: qty2.unit,
            resultString,
            isError: false,
        }).catch(err => {
            console.error('Failed to log measurement history:', err.message);
        });

        return { result: resultString };
    }

    async calculate(userId, { op, qty1, qty2, targetUnit }) {
        const type1 = UnitType[qty1.unit];
        const type2 = UnitType[qty2.unit];
        const targetType = UnitType[targetUnit];

        if (!type1) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown unit: ${qty1.unit}` };
        }
        if (!type2) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown unit: ${qty2.unit}` };
        }
        if (!targetType) {
            throw { status: 400, code: 'INVALID_UNIT', message: `Unknown target unit: ${targetUnit}` };
        }

        if (type1 !== type2 || type1 !== targetType) {
            throw {
                status: 400,
                code: 'INVALID_UNIT_TYPE',
                message: `All units must be of the same measurement type`,
            };
        }

        if (type1 === MeasurementType.TEMPERATURE) {
            throw {
                status: 400,
                code: 'UNSUPPORTED_OPERATION',
                message: 'Arithmetic operations are not supported for temperature units',
            };
        }

        const base1 = this._toBase(qty1.value, qty1.unit);
        const base2 = this._toBase(qty2.value, qty2.unit);

        let resultBase;
        switch (op) {
            case 'ADD':      resultBase = base1 + base2; break;
            case 'SUBTRACT': resultBase = base1 - base2; break;
            case 'MULTIPLY': resultBase = base1 * base2; break;
            case 'DIVIDE':
                if (base2 === 0) {
                    throw { status: 400, code: 'DIVISION_BY_ZERO', message: 'Cannot divide by zero' };
                }
                resultBase = base1 / base2;
                break;
        }

        const targetFactor = BaseFactors[targetUnit];
        let resultValue = resultBase / targetFactor;
        resultValue = Math.round(resultValue * 1_000_000) / 1_000_000;

        MeasurementHistory.create({
            userId,
            operation: op,
            measurementType: type1,
            input1Value: qty1.value,
            input1Unit: qty1.unit,
            input2Value: qty2.value,
            input2Unit: qty2.unit,
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
