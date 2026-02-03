const express = require('express');
const { body } = require('express-validator');
const ProductController = require('../controllers/productController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Валидация для создания/обновления изделия
const productValidationRules = [
  body('name').trim().notEmpty().withMessage('Название не может быть пустым.'),
  body('product_type')
    .isIn(['finished', 'semi_finished', 'assembly', 'part'])
    .withMessage('Указан неверный тип изделия.'),
  body('lot_id')
    .customSanitizer(value => value || null)
    .notEmpty().withMessage('Участок обязателен')
    .isInt({ min: 1 }).withMessage('ID участка должен быть числом.'),
  body('previous_lot_id')
    .customSanitizer(value => value || null)
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('ID предыдущего участка должен быть числом.'),
  body('next_lot_id')
    .customSanitizer(value => value || null)
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('ID следующего участка должен быть числом.'),
  body('default_inspector_id')
    .customSanitizer(value => value || null)
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('ID контролёра должен быть целым числом.'),
  body('inspection_time_minutes').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Время на приёмку должно быть положительным целым числом.'),
  body('checklist').optional().custom((value) => {
    if (Array.isArray(value)) {
      return true;
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch (e) {
        return false;
      }
    }
    // Не разрешать другие типы
    return false;
  }).withMessage('Чек-лист должен быть массивом или JSON-строкой, представляющей массив.'),
];

// Все маршруты защищены JWT
router.use(authenticateJWT);

// Маршруты
router.get('/', ProductController.getAllProducts);
router.post('/', productValidationRules, ProductController.createProduct);
router.get('/:id', ProductController.getProductById);
router.put('/:id', productValidationRules, ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
router.get('/lot/:lotId', ProductController.getProductsByLot);
router.get('/type/:type', ProductController.getProductsByType);

// Маршрут для восстановления
router.post('/:id/restore', ProductController.restoreProduct);

module.exports = router;