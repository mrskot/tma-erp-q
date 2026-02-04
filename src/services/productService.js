const Product = require('../models/Product');
const Lot = require('../models/Lot');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

class ProductService {
  static async getAllProducts(limit = 100, offset = 0, status = 'active') {
    try {
      const products = await Product.findAll({ limit, offset, filters: { status } });
      const total = await Product.count({ status });
      return { products, pagination: { total, limit, offset, hasMore: offset + products.length < total } };
    } catch (error) {
      throw new AppError(`Ошибка получения изделий: ${error.message}`, 500);
    }
  }

  static async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Изделие не найдено', 404);
    return product;
  }

  static async getProductsByLot(lotId, limit = 100, offset = 0) {
    const lot = await Lot.findById(lotId);
    if (!lot) throw new AppError('Участок не найден', 404);
    return await Product.findByLotId(lotId, limit, offset);
  }

  static _prepareChecklist(productData) {
    if (productData.checklist && Array.isArray(productData.checklist)) {
      return JSON.stringify(productData.checklist);
    }
    return productData.checklist;
  }

  static async createProduct(productData) {
    if (productData.lot_id) {
      const lot = await Lot.findById(productData.lot_id);
      if (!lot) throw new AppError('Участок не найден', 404);
    }

    if (productData.default_inspector_id) {
      const inspector = await User.findById(productData.default_inspector_id);
      if (!inspector || inspector.role !== 'inspector') {
        throw new AppError('Указанный пользователь не найден или не является контролёром', 400);
      }
    }

    productData.checklist = this._prepareChecklist(productData);
    return await Product.create(productData);
  }

  static async updateProduct(id, productData) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Изделие не найдено', 404);

    if (productData.lot_id) {
      const lot = await Lot.findById(productData.lot_id);
      if (!lot) throw new AppError('Участок не найден', 404);
    }

    productData.checklist = this._prepareChecklist(productData);
    return await Product.update(id, productData);
  }

  static async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) throw new AppError('Изделие не найдено', 404);
    await Product.delete(id);
    return { success: true, message: 'Изделие деактивировано' };
  }

  static async restoreProduct(id) {
    // FIX: Add 'true' to findById to include inactive products in the search.
    const product = await Product.findById(id, true);
    if (!product) throw new AppError('Изделие не найдено', 404);
    const result = await Product.reactivate(id);
    if (!result) throw new AppError('Не удалось восстановть изделие', 500);
    return { success: true, message: 'Изделие восстановлено' };
  }
}

module.exports = ProductService;