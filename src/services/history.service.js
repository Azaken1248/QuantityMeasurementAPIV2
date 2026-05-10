import MeasurementHistory from '../models/MeasurementHistory.js';

class HistoryService {
    async getByUser(userId, { page = 1, limit = 20 }) {
        const offset = (page - 1) * limit;

        const { count, rows } = await MeasurementHistory.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            attributes: [
                'id', 'operation', 'measurementType',
                'input1Value', 'input1Unit',
                'input2Value', 'input2Unit',
                'resultValue', 'resultUnit', 'resultString',
                'isError', 'errorMessage', 'createdAt',
            ],
        });

        return {
            records: rows,
            pagination: {
                page,
                limit,
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
            },
        };
    }
}

export default new HistoryService();
