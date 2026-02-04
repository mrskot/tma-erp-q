const ApplicationService = require('../services/applicationService');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const asyncHandler = require('../utils/asyncHandler'); // FIX: Use the central asyncHandler

class ApplicationController {

    static getAllApplications = asyncHandler(async (req, res) => {
        const { limit = 100, offset = 0, status, master_id, inspector_id, lot_id } = req.query;
        const filters = { status, master_id, inspector_id, lot_id };
        
        // The service now returns an object { applications, pagination }
        const result = await ApplicationService.getAllApplications(filters, req.user, parseInt(limit), parseInt(offset));
        
        // FIX: Standardize the response structure to match other controllers.
        res.json({ success: true, data: result });
    });

    static getApplicationById = asyncHandler(async (req, res) => {
        const result = await ApplicationService.getApplicationById(parseInt(req.params.id));
        res.json({ success: true, data: result });
    });

    static createBatchApplications = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Ошибка валидации', 422, errors.array());
        }

        if (req.user.role === 'master' && req.body.master_id != req.user.id) {
             throw new AppError('Мастер может создавать заявки только от своего имени.', 403);
        }

        const result = await ApplicationService.createBatchApplications(req.body, req.user);
        res.status(201).json({ success: true, data: result });
    });

    static updateApplication = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Ошибка валидации', 422, errors.array());
        }

        const result = await ApplicationService.updateApplication(parseInt(req.params.id), req.body, req.user);
        res.json({ success: true, data: result });
    });

    static updateApplicationStatus = asyncHandler(async (req, res) => {
        const { status, rejectionReason } = req.body;
        const result = await ApplicationService.updateApplicationStatus(
            parseInt(req.params.id),
            status,
            rejectionReason,
            req.user
        );
        res.json({ success: true, data: result });
    });

    static deleteApplication = asyncHandler(async (req, res) => {
        const result = await ApplicationService.deleteApplication(parseInt(req.params.id), req.user);
        res.json(result); // This service already returns { success, message }
    });

    static getApplicationStatistics = asyncHandler(async (req, res) => {
        const result = await ApplicationService.getApplicationStatistics();
        res.json({ success: true, data: result });
    });
}

module.exports = ApplicationController;