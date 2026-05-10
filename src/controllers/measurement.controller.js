import measurementService from '../services/measurement.service.js';
import { convertSchema, compareSchema, calculateSchema } from '../validation/schemas.js';

class MeasurementController {

    async convert(req, res) {
        try {
            const { error, value } = convertSchema.validate(req.body);
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

            const result = await measurementService.convert(req.user.id, value);

            return res.status(200).json({
                success: true,
                data: result,
                message: `Successfully converted ${value.value} ${value.sourceUnit} to ${value.targetUnit}`,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                error: {
                    code: error.code || 'CONVERSION_FAILED',
                    message: error.message || 'An unexpected error occurred',
                },
                timestamp: new Date().toISOString(),
            });
        }
    }

    async compare(req, res) {
        try {
            const { error, value } = compareSchema.validate(req.body);
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

            const result = await measurementService.compare(req.user.id, value);

            return res.status(200).json({
                success: true,
                data: result,
                message: `Compared ${value.qty1.value} ${value.qty1.unit} with ${value.qty2.value} ${value.qty2.unit}`,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                error: {
                    code: error.code || 'COMPARISON_FAILED',
                    message: error.message || 'An unexpected error occurred',
                },
                timestamp: new Date().toISOString(),
            });
        }
    }

    async calculate(req, res) {
        try {
            const { error, value } = calculateSchema.validate(req.body);
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

            const result = await measurementService.calculate(req.user.id, value);

            return res.status(200).json({
                success: true,
                data: result,
                message: `${value.op}: ${value.qty1.value} ${value.qty1.unit} and ${value.qty2.value} ${value.qty2.unit} = ${result.resultValue} ${result.resultUnit}`,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            const status = error.status || 500;
            return res.status(status).json({
                success: false,
                error: {
                    code: error.code || 'CALCULATION_FAILED',
                    message: error.message || 'An unexpected error occurred',
                },
                timestamp: new Date().toISOString(),
            });
        }
    }
}

export default new MeasurementController();
