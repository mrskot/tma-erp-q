const express = require('express');
const { body, param } = require('express-validator');
const ProductController = require('../controllers/productController'); 
const { authenticateJWT } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const router = express.Router();
router.use(authenticateJWT);
// FIX: All controller methods are static, so they should be called directly on the class.
router.get('/', rbacMiddleware(['admin', 'director', 'master', 'inspector']), ProductController.getAllProducts);
router.get('/:id', rbacMiddleware(['admin', 'director']), param('id').isInt(), ProductController.getProductById);
router.get('/lot/:lotId', rbacMiddleware(['admin', 'director', 'master']), param('lotId').isInt(), ProductController.getProductsByLot);
// FIX: Removed the route for getProductsByType as the method does not exist in the controller.
// router.get('/type/:type', rbacMiddleware(['admin', 'director']), ProductController.getProductsByType);
router.post('/', rbacMiddleware(['admin', 'director']), [
body('name').notEmpty().withMessage('Название обязательно'),
body('lot_id').isInt().withMessage('ID участка обязателен')
], ProductController.createProduct);
router.put('/:id', rbacMiddleware(['admin', 'director']), param('id').isInt(), ProductController.updateProduct);
router.delete('/:id', rbacMiddleware(['admin']), param('id').isInt(), ProductController.deleteProduct);
router.post('/:id/restore', rbacMiddleware(['admin']), param('id').isInt(), ProductController.restoreProduct);
module.exports = router;