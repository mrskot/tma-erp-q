const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const ApplicationController = require('../controllers/applicationController');
const { authenticateJWT } = require('../middleware/auth');

const createApplicationValidation = [
  body('master_id').isInt().withMessage('ID мастера обязателен'),
  body('lot_id').isInt().withMessage('ID участка обязателен'),
  body('product_id').isInt().withMessage('ID изделия обязателено'),
  body('serial_number')
    .optional()
    .isString().withMessage('Серийный номер должен быть строкой'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Количество должно быть положительным'),
  body('desired_inspection_time')
    .notEmpty().withMessage('Желаемое время контроля обязательно'),
];

const updateApplicationValidation = [
  param('id').isInt().withMessage('ID должен быть числом'),
  body('master_id').optional().isInt(),
  body('serial_number').optional().isString(),
  body('quantity').optional().isInt({ min: 1 }),
];

const updateStatusValidation = [
  param('id').isInt().withMessage('ID должен быть числом'),
  body('status')
    .notEmpty().withMessage('Статус обязателен')
    .isIn(['new', 'assigned', 'in_progress', 'accepted', 'rejected']).withMessage('Недопустимый статус'),
  body('rejectionReason')
    .optional()
    .isString().withMessage('Причина должна быть строкой'),
];

// Маршруты
router.get('/', authenticateJWT, ApplicationController.getAllApplications);
router.get('/statistics', authenticateJWT, ApplicationController.getApplicationStatistics);
router.get('/:id', authenticateJWT, param('id').isInt(), ApplicationController.getApplicationById);
router.get('/status/:status', authenticateJWT, ApplicationController.getApplicationsByStatus);
router.get('/master/:masterId', authenticateJWT, param('masterId').isInt(), ApplicationController.getApplicationsByMaster);

router.post('/', authenticateJWT, createApplicationValidation, ApplicationController.createApplication);
router.put('/:id', authenticateJWT, updateApplicationValidation, ApplicationController.updateApplication);
router.patch('/:id/status', authenticateJWT, updateStatusValidation, ApplicationController.updateApplicationStatus);
router.delete('/:id', authenticateJWT, param('id').isInt(), ApplicationController.deleteApplication);

module.exports = router;
