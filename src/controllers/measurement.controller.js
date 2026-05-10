import measurementService from '../services/measurement.service.js';
import { convertSchema } from '../validation/schemas.js';

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
}

export default new MeasurementController();
