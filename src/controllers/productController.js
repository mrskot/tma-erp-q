const ProductService = require('../services/productService');
const { validationResult } = require('express-validator');

class ProductController {
  static async getAllProducts(req, res) {
    try {
      const { limit = 100, offset = 0, status = 'active' } = req.query;
      const result = await ProductService.getAllProducts(parseInt(limit), parseInt(offset), status);

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getProductById(req, res) {
    try {
      const product = await ProductService.getProductById(parseInt(req.params.id));
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async getProductsByLot(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const products = await ProductService.getProductsByLot(
        parseInt(req.params.lotId),
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: products });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async createProduct(req, res) {
    try {
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      
      const productData = req.body;
      if (typeof productData.checklist === 'string') {
        try {
          productData.checklist = JSON.parse(productData.checklist);
        } catch (error) {
          return res.status(400).json({ success: false, message: 'Некорректный JSON в поле checklist' });
        }
      }


      const product = await ProductService.createProduct(productData);
      res.status(201).json({ success: true, message: 'Изделие создано', data: product });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      
      const productData = req.body;
       if (typeof productData.checklist === 'string') {
        try {
          productData.checklist = JSON.parse(productData.checklist);
        } catch (error) {
          return res.status(400).json({ success: false, message: 'Некорректный JSON в поле checklist' });
        }
      }


      const product = await ProductService.updateProduct(parseInt(req.params.id), productData);
      res.json({ success: true, message: 'Изделие обновлено', data: product });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async deleteProduct(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const result = await ProductService.deleteProduct(parseInt(req.params.id));
      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async restoreProduct(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const result = await ProductService.restoreProduct(parseInt(req.params.id));
      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async getProductsByType(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const products = await ProductService.getProductsByType(
        req.params.type,
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ProductController;