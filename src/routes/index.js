const express = require('express');
const router = express.Router();

// Импорт маршрутов
const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const lotRoutes = require('./lotRoutes');
const productRoutes = require('./productRoutes');
const applicationRoutes = require('./applicationRoutes');
const discrepancyRoutes = require('./discrepancyRoutes');
const SearchController = require('../controllers/searchController');
const { authenticateJWT } = require('../middleware/auth');

// Подключение маршрутов
router.use('/', healthRoutes);
router.use('/users', userRoutes);
router.use('/lots', lotRoutes);
router.use('/products', productRoutes);
router.use('/applications', applicationRoutes);
router.use('/discrepancies', discrepancyRoutes);

// Глобальный поиск
router.get('/search', authenticateJWT, SearchController.globalSearch);

// Экспорт основного роутера
module.exports = router;