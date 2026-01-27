const ApplicationService = require('../services/applicationService');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

// Обертка для асинхронных контроллеров для централизованной обработки ошибок
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

class ApplicationController {

    static getAllApplications = asyncHandler(async (req, res) => {
        const { limit = 100, offset = 0, status } = req.query;
        const filters = { status };
        
        // Передаем req.user в сервис для ролевой фильтрации
        const result = await ApplicationService.getAllApplications(filters, req.user, parseInt(limit), parseInt(offset));
        res.json(result);
    });

    static getApplicationById = asyncHandler(async (req, res) => {
        const result = await ApplicationService.getApplicationById(parseInt(req.params.id));
        res.json(result);
    });

    static createBatchApplications = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Ошибка валидации', 422, errors.array());
        }

        if (req.user.role === 'master' && req.body.master_id !== req.user.id) {
             throw new AppError('Мастер может создавать заявки только от своего имени.', 403);
        }

        const result = await ApplicationService.createBatchApplications(req.body);
        res.status(201).json(result);
    });

    static updateApplication = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Ошибка валидации', 422, errors.array());
        }

        const result = await ApplicationService.updateApplication(parseInt(req.params.id), req.body, req.user);
        res.json(result);
    });

    static updateApplicationStatus = asyncHandler(async (req, res) => {
        const { status, rejectionReason } = req.body;
        const result = await ApplicationService.updateApplicationStatus(
            parseInt(req.params.id),
            status,
            rejectionReason
        );
        res.json(result);
    });

    static deleteApplication = asyncHandler(async (req, res) => {
        const result = await ApplicationService.deleteApplication(parseInt(req.params.id));
        res.json(result);
    });

    static getApplicationStatistics = asyncHandler(async (req, res) => {
        const result = await ApplicationService.getApplicationStatistics();
        res.json(result);
    });
}

module.exports = ApplicationController;