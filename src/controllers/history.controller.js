import historyService from '../services/history.service.js';

class HistoryController {
    async list(req, res) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

            const result = await historyService.getByUser(req.user.id, { page, limit });

            return res.status(200).json({
                success: true,
                data: result.records,
                pagination: result.pagination,
                message: `Found ${result.pagination.totalRecords} record(s)`,
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

    async globalList(req, res) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

            const result = await historyService.getGlobal({ page, limit });

            return res.status(200).json({
                success: true,
                data: result.records,
                pagination: result.pagination,
                message: `Found ${result.pagination.totalRecords} record(s)`,
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
}

export default new HistoryController();

