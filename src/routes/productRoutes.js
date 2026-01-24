const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const ProductController = require('../controllers/productController');
const { authenticateJWT } = require('../middleware/auth');

const createProductValidation = [
  body('name')
    .notEmpty().withMessage('Название обязательно')
    .isString().withMessage('Название должно быть строкой')
    .isLength({ min: 2, max: 255 }).withMessage('Название от 2 до 255 символов'),
  body('affiliation')
    .optional()
    .isString().withMessage('Принадлежность должна быть строкой'),
  body('product_type')
    .notEmpty().withMessage('Тип изделия обязателен')
    .isIn(['finished', 'semi_finished', 'assembly', 'part']).withMessage('Недопустимый тип'),
  body('unit_of_measure')
    .optional()
    .isIn(['шт', 'компл']).withMessage('Недопустимая единица измерения'),
  body('lot_id')
    .optional()
    .isInt().withMessage('ID участка должен быть числом'),
  body('inspection_time_minutes')
    .optional()
    .isInt({ min: 1 }).withMessage('Время контроля должно быть положительным числом'),
];

const updateProductValidation = [
  param('id').isInt().withMessage('ID должен быть числом'),
  body('name')
    .optional()
    .isString().withMessage('Название должно быть строкой')
    .isLength({ min: 2, max: 255 }).withMessage('Название от 2 до 255 символов'),
  body('product_type')
    .optional()
    .isIn(['finished', 'semi_finished', 'assembly', 'part']).withMessage('Недопустимый тип'),
];

// Маршруты
router.get('/', authenticateJWT, ProductController.getAllProducts);
router.get('/:id', authenticateJWT, param('id').isInt(), ProductController.getProductById);
router.get('/type/:type', authenticateJWT, ProductController.getProductsByType);
router.get('/lot/:lotId', authenticateJWT, param('lotId').isInt(), ProductController.getProductsByLot);

router.post('/', authenticateJWT, createProductValidation, ProductController.createProduct);
router.put('/:id', authenticateJWT, updateProductValidation, ProductController.updateProduct);
router.delete('/:id', authenticateJWT, param('id').isInt(), ProductController.deleteProduct);

module.exports = router;
