// src/routes/discrepancyRoutes.js
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const DiscrepancyController = require('../controllers/discrepancyController');
const { authenticateJWT } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const createDiscrepancyValidation = [
  body('title')
    .notEmpty().withMessage('Название обязательно')
    .isString().withMessage('Название должно быть строкой')
    .trim().escape()
    .isLength({ min: 2, max: 255 }).withMessage('Название от 2 до 255 символов'),
  body('description')
    .optional()
    .isString().withMessage('Описание должно быть строкой')
    .trim().escape(),
  body('severity')
    .notEmpty().withMessage('Серьезность обязательна')
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Недопустимая серьезность'),
  body('responsible_id')
    .optional()
    .isInt().withMessage('ID ответственного должен быть числом'),
  body('inspector_id')
    .optional()
    .isInt().withMessage('ID инспектора должен быть числом'),
  body('detected_at')
    .notEmpty().withMessage('Дата обнаружения обязательна'),
];

const updateDiscrepancyValidation = [
  param('id').isInt().withMessage('ID должен быть числом'),
  body('title').optional().isString(),
  body('description').optional().isString(),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
];

const updateStatusValidation = [
  param('id').isInt().withMessage('ID должен быть числом'),
  body('status')
    .notEmpty().withMessage('Статус обязателен')
    .isIn(['new', 'assigned', 'in_progress', 'resolved', 'closed']).withMessage('Недопустимый статус'),
  body('closure_scenario')
    .optional()
    .isIn(['fixed', 'resolution_card', 'scrap', 'political']).withMessage('Недопустимый сценарий'),
];

// ... (остальной код без изменений, так как он уже использует статические вызовы)
router.get('/', authenticateJWT, DiscrepancyController.getAllDiscrepancies);
router.get('/statistics', authenticateJWT, DiscrepancyController.getDiscrepancyStatistics);
router.get('/:id', authenticateJWT, param('id').isInt(), DiscrepancyController.getDiscrepancyById);
router.get('/status/:status', authenticateJWT, DiscrepancyController.getDiscrepanciesByStatus);
router.get('/severity/:severity', authenticateJWT, DiscrepancyController.getDiscrepanciesBySeverity);
router.get('/responsible/:responsibleId', authenticateJWT, param('responsibleId').isInt(), DiscrepancyController.getDiscrepanciesByResponsible);
router.get('/application/:applicationId', authenticateJWT, param('applicationId').isInt(), DiscrepancyController.getDiscrepanciesByApplication);

router.post('/', authenticateJWT, rbacMiddleware(['admin', 'inspector', 'director']), createDiscrepancyValidation, DiscrepancyController.createDiscrepancy);
router.put('/:id', authenticateJWT, rbacMiddleware(['admin', 'inspector', 'director', 'master']), updateDiscrepancyValidation, DiscrepancyController.updateDiscrepancy);
router.patch('/:id/status', authenticateJWT, rbacMiddleware(['admin', 'inspector', 'director', 'master']), updateStatusValidation, DiscrepancyController.updateDiscrepancyStatus);
router.delete('/:id', authenticateJWT, rbacMiddleware(['admin']), param('id').isInt(), DiscrepancyController.deleteDiscrepancy);

module.exports = router;

