const express = require('express');
const router = express.Router();

// Импорт маршрутов
const userRoutes = require('./userRoutes');
const lotRoutes = require('./lotRoutes');
const productRoutes = require('./productRoutes');
const applicationRoutes = require('./applicationRoutes');
const discrepancyRoutes = require('./discrepancyRoutes');

// Подключение маршрутов
router.use('/users', userRoutes);
router.use('/lots', lotRoutes);
router.use('/products', productRoutes);
router.use('/applications', applicationRoutes);
router.use('/discrepancies', discrepancyRoutes);

// Экспорт основного роутера
module.exports = router;