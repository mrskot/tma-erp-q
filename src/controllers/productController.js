const ProductService = require('../services/productService');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

class ProductController {
  static getAllProducts = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0, status = 'active' } = req.query;
    const result = await ProductService.getAllProducts(parseInt(limit), parseInt(offset), status);
    res.json({ success: true, data: result });
  });

  static getProductById = asyncHandler(async (req, res) => {
    const product = await ProductService.getProductById(parseInt(req.params.id));
    res.json({ success: true, data: product });
  });

  static createProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());
    const product = await ProductService.createProduct(req.body);
    res.status(201).json({ success: true, message: 'Изделие создано', data: product });
  });

  static updateProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());
    const product = await ProductService.updateProduct(parseInt(req.params.id), req.body);
    res.json({ success: true, message: 'Изделие обновлено', data: product });
  });

  static deleteProduct = asyncHandler(async (req, res) => {
    const result = await ProductService.deleteProduct(parseInt(req.params.id));
    res.json({ success: true, message: result.message });
  });

  static restoreProduct = asyncHandler(async (req, res) => {
    const result = await ProductService.restoreProduct(parseInt(req.params.id));
    res.json({ success: true, message: result.message });
  });
  
  static getProductsByLot = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    const products = await ProductService.getProductsByLot(
      parseInt(req.params.lotId), parseInt(limit), parseInt(offset)
    );
    res.json({ success: true, data: products });
  });
}

module.exports = ProductController;