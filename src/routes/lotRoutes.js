const express = require('express');
const { body, param } = require('express-validator');
const LotController = require('../controllers/lotController');
const { authenticateJWT } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticateJWT);

// General access
router.get('/', rbacMiddleware(['admin', 'director', 'master', 'inspector']), LotController.getAllLots);
router.get('/with-masters', rbacMiddleware(['admin', 'director']), LotController.getLotsWithMasters);
router.get('/master/:masterId', rbacMiddleware(['admin', 'director']), param('masterId').isInt(), LotController.getLotsByMaster);
router.get('/:id', rbacMiddleware(['admin', 'director']), param('id').isInt(), LotController.getLotById);

// Admin/Director only for modifications
router.post('/', rbacMiddleware(['admin', 'director']), [
    body('name').notEmpty().withMessage('Название обязательно'),
    body('code').notEmpty().withMessage('Код обязателен')
], LotController.createLot);

router.put('/:id', rbacMiddleware(['admin', 'director']), param('id').isInt(), LotController.updateLot);
router.post('/:id/assign-temp-master', rbacMiddleware(['admin', 'director']), [
    param('id').isInt(), body('temp_master_id').isInt().withMessage('ID временного мастера обязателен')
], LotController.assignTempMaster);
router.post('/:id/remove-temp-master', rbacMiddleware(['admin', 'director']), param('id').isInt(), LotController.removeTempMaster);

// Admin only for destructive actions
router.delete('/:id', rbacMiddleware(['admin']), param('id').isInt(), LotController.deleteLot);
router.post('/:id/restore', rbacMiddleware(['admin']), param('id').isInt(), LotController.reactivateLot);

module.exports = router;