const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const LotController = require('../controllers/lotController');
const { authenticateJWT } = require('../middleware/auth');

// Валидация для создания участка
const createLotValidation = [
  body('name')
    .notEmpty().withMessage('Название участка обязательно')
    .isString().withMessage('Название должно быть строкой')
    .isLength({ min: 2, max: 255 }).withMessage('Название должно быть от 2 до 255 символов'),
  body('code')
    .notEmpty().withMessage('Код участка обязателен')
    .isString().withMessage('Код должен быть строкой')
    .matches(/^[A-Z0-9_]+$/).withMessage('Код должен содержать только заглавные буквы, цифры и подчёркивания')
    .isLength({ min: 2, max: 50 }).withMessage('Код должен быть от 2 до 50 символов'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Приоритет должен быть от 1 до 10'),
  body('distance_to_office')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Расстояние должно быть неотрицательным числом'),
  body('main_master_id')
    .notEmpty().withMessage('Основной мастер обязателен')
    .isInt().withMessage('ID основного мастера должен быть числом'),
  body('temp_master_id')
    .optional({ nullable: true })
    .isInt().withMessage('ID временного мастера должен быть числом'),
];

// Валидация для обновления участка
const updateLotValidation = [
  param('id')
    .isInt().withMessage('ID должен быть числом'),
  body('name')
    .optional()
    .isString().withMessage('Название должно быть строкой')
    .isLength({ min: 2, max: 255 }).withMessage('Название должно быть от 2 до 255 символов'),
  body('code')
    .optional()
    .isString().withMessage('Код должен быть строкой')
    .matches(/^[A-Z0-9_]+$/).withMessage('Код должен содержать только заглавные буквы, цифры и подчёркивания')
    .isLength({ min: 2, max: 50 }).withMessage('Код должен быть от 2 до 50 символов'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Приоритет должен быть от 1 до 10'),
  body('distance_to_office')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Расстояние должно быть неотрицательным числом'),
  body('main_master_id')
    .optional({ nullable: true })
    .isInt().withMessage('ID основного мастера должен быть числом'),
  body('temp_master_id')
    .optional({ nullable: true })
    .isInt().withMessage('ID временного мастера должен быть числом'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active должен быть булевым значением'),
];

// Валидация параметров запроса
const queryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Limit должен быть числом от 1 до 1000'),
  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset должен быть неотрицательным числом'),
  query('with_masters')
    .optional()
    .isIn(['true', 'false']).withMessage('with_masters должен быть true или false'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all']).withMessage('Недопустимый статус'),
];

// Маршруты

// Получить все участки
router.get('/', authenticateJWT, queryValidation, LotController.getAllLots);

// Получить участок по ID
router.get('/:id', authenticateJWT,
  param('id').isInt().withMessage('ID должен быть числом'),
  LotController.getLotById
);

// Получить участок по коду
router.get('/code/:code', authenticateJWT,
  param('code').isString().withMessage('Код должен быть строкой'),
  LotController.getLotByCode
);

// Получить участки по мастеру
router.get('/master/:masterId', authenticateJWT,
  param('masterId').isInt().withMessage('ID мастера должен быть числом'),
  LotController.getLotsByMaster
);

// Создать новый участок (только для admin и director)
router.post('/', authenticateJWT, createLotValidation, LotController.createLot);

// Обновить участок (только для admin и director)
router.put('/:id', authenticateJWT, updateLotValidation, LotController.updateLot);

// Удалить (деактивировать) участок (только для admin)
router.delete('/:id', authenticateJWT,
  param('id').isInt().withMessage('ID должен быть числом'),
  LotController.deleteLot
);

// Восстановить участок (только для admin)
router.post('/:id/restore', authenticateJWT,
  param('id').isInt().withMessage('ID должен быть числом'),
  LotController.reactivateLot
);

// Назначить временного мастера (только для admin и director)
router.post('/:id/temp-master', authenticateJWT,
  param('id').isInt().withMessage('ID должен быть числом'),
  body('temp_master_id').isInt().withMessage('ID временного мастера должен быть числом'),
  LotController.assignTempMaster
);

// Удалить временного мастера (только для admin и director)
router.delete('/:id/temp-master', authenticateJWT,
  param('id').isInt().withMessage('ID должен быть числом'),
  LotController.removeTempMaster
);

module.exports = router;