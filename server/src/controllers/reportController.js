const Report = require('../models/Report');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');

class ReportController {
    async createReport(req, res) {
        const { targetType, targetId, reason, description } = req.body;

        const existing = await Report.findOne({
            reporter: req.user._id,
            targetType,
            targetId,
            status: { $in: ['open', 'under_review'] },
        });
        if (existing) {
            throw new ApiError(400, 'You already have an open report for this item');
        }

        const report = await Report.create({
            reporter: req.user._id,
            targetType,
            targetId,
            reason,
            description,
        });

        return success(res, 201, 'Report submitted. Our team will review it.', report);
    }

    async getMyReports(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { reporter: req.user._id };

        const [reports, total] = await Promise.all([
            Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Report.countDocuments(filter),
        ]);

        return success(res, 200, 'Reports fetched', reports, buildMeta(total));
    }
}

module.exports = bindController(new ReportController());
