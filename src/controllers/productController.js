const ProductService = require('../services/productService');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

class ProductController {
  static getAllProducts = asyncHandler(async (req, res) => {
      const { limit = 100, offset = 0, status = 'active' } = req.query;
      const result = await ProductService.getAllProducts({
        limit: parseInt(limit),
        offset: parseInt(offset),
        status
      });

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
  });

  static getProductById = asyncHandler(async (req, res) => {
      const product = await ProductService.getProductById(parseInt(req.params.id));
      res.json({ success: true, data: product });
      });

  static getProductsByLot = asyncHandler(async (req, res) => {
      const { limit = 100, offset = 0 } = req.query;
      const products = await ProductService.getProductsByLot(
        parseInt(req.params.lotId),
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: products });
      });

  static createProduct = asyncHandler(async (req, res) => {
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
      throw new AppError('Недостаточно прав', 403);
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      throw new AppError('Ошибка валидации', 400, errors.array());
      }
      
      const productData = req.body;
      if (typeof productData.checklist === 'string') {
        try {
          productData.checklist = JSON.parse(productData.checklist);
        } catch (error) {
        throw new AppError('Некорректный JSON в поле checklist', 400);
        }
      }

      const product = await ProductService.createProduct(productData);
      res.status(201).json({ success: true, message: 'Изделие создано', data: product });
  });

  static updateProduct = asyncHandler(async (req, res) => {
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
      throw new AppError('Недостаточно прав', 403);
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      throw new AppError('Ошибка валидации', 400, errors.array());
      }
      
      const productData = req.body;
       if (typeof productData.checklist === 'string') {
        try {
          productData.checklist = JSON.parse(productData.checklist);
        } catch (error) {
        throw new AppError('Некорректный JSON в поле checklist', 400);
        }
      }

      const product = await ProductService.updateProduct(parseInt(req.params.id), productData);
      res.json({ success: true, message: 'Изделие обновлено', data: product });
      });

  static deleteProduct = asyncHandler(async (req, res) => {
      if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Недостаточно прав', 403);
      }

      const result = await ProductService.deleteProduct(parseInt(req.params.id));
      res.json({ success: true, message: result.message });
      });

  static restoreProduct = asyncHandler(async (req, res) => {
      if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Недостаточно прав', 403);
      }

      const result = await ProductService.restoreProduct(parseInt(req.params.id));
      res.json({ success: true, message: result.message });
      });

  static getProductsByType = asyncHandler(async (req, res) => {
      const { limit = 100, offset = 0 } = req.query;
      const products = await ProductService.getProductsByType(
        req.params.type,
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: products });
  });
    }
module.exports = ProductController;