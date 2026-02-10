// src/routes/applicationRoutes.js
const express = require('express');
const { body, param } = require('express-validator');
const ApplicationController = require('../controllers/applicationController');
const { authenticateJWT } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const router = express.Router();
router.use(authenticateJWT);
// ... (остальные роуты без изменений, так как они уже используют статические вызовы)
// GET /api/v1/applications
router.get('/', rbacMiddleware(['admin', 'director', 'inspector', 'master']), ApplicationController.getAllApplications);
// ...
// GET /api/v1/applications/statistics - Получение статистики
router.get(
    '/statistics', 
    rbacMiddleware(['admin', 'director']), 
    ApplicationController.getApplicationStatistics
);

// GET /api/v1/applications/:id - Получение одной заявки
router.get(
    '/:id', 
    param('id').isInt().withMessage('ID должен быть числом'),
    rbacMiddleware(['admin', 'director', 'inspector', 'master']), 
    ApplicationController.getApplicationById
);

// POST /api/v1/applications/batch - Пакетное создание заявок
router.post(
    '/batch',
    rbacMiddleware(['admin', 'director', 'master']),
    [
        body('product_id').isInt().withMessage('Product ID должен быть целым числом'),
        body('lot_id').isInt().withMessage('Lot ID должен быть целым числом'),
        body('master_id').isInt().withMessage('Master ID должен быть целым числом'),
        body('quantity').isInt({ min: 1 }).withMessage('Количество должно быть не менее 1'),
        body('desired_inspection_time').isISO8601().toDate().withMessage('Неверный формат даты'),
        body('has_serial_numbers').isBoolean().withMessage('Флаг has_serial_numbers должен быть boolean'),
        body('serial_data').isArray().optional()
    ],
    ApplicationController.createBatchApplications
);

// PUT /api/v1/applications/:id - Обновление заявки
router.put(
    '/:id',
    param('id').isInt().withMessage('ID должен быть числом'),
    rbacMiddleware(['admin', 'director', 'master', 'inspector']),
    [
        body('inspector_id').optional().isInt().withMessage('Inspector ID должен быть целым числом'),
        body('drawing_number').optional().isString().withMessage('Номер чертежа должен быть строкой'),
    ],
    ApplicationController.updateApplication
);

// PATCH /api/v1/applications/:id/status - Обновление статуса
router.patch(
    '/:id/status',
    param('id').isInt().withMessage('ID должен быть числом'),
    rbacMiddleware(['admin', 'director', 'inspector']),
    [
        body('status').isIn(['new', 'assigned', 'in_progress', 'accepted', 'rejected']).withMessage('Недопустимый статус')
    ],
    ApplicationController.updateApplicationStatus
);

// DELETE /api/v1/applications/:id - Деактивация (мягкое удаление)
router.delete(
    '/:id',
    param('id').isInt().withMessage('ID должен быть числом'),
    rbacMiddleware(['admin', 'master']),
    ApplicationController.deleteApplication
);

module.exports = router;