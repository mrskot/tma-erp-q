const Product = require('../models/Product');
const Lot = require('../models/Lot');

class ProductService {
  static async getAllProducts(limit = 100, offset = 0) {
    try {
      const products = await Product.findAll(limit, offset);
      const total = await Product.count();

      return {
        products,
        pagination: { total, limit, offset, hasMore: offset + products.length < total }
      };
    } catch (error) {
      throw new Error(`Ошибка получения изделий: ${error.message}`);
    }
  }

  static async getProductById(id) {
    try {
      const product = await Product.findById(id);
      if (!product) throw new Error('Изделие не найдено');
      return product;
    } catch (error) {
      throw new Error(`Ошибка получения изделия: ${error.message}`);
    }
  }

  static async getProductsByLot(lotId, limit = 100, offset = 0) {
    try {
      const lot = await Lot.findById(lotId);
      if (!lot) throw new Error('Участок не найден');
      
      const products = await Product.findByLotId(lotId, limit, offset);
      return products;
    } catch (error) {
      throw new Error(`Ошибка получения изделий участка: ${error.message}`);
    }
  }

  static async createProduct(productData) {
    try {
      // Проверка участка
      if (productData.lot_id) {
        const lot = await Lot.findById(productData.lot_id);
        if (!lot) throw new Error('Участок не найден');
      }

      const product = await Product.create(productData);
      return product;
    } catch (error) {
      throw new Error(`Ошибка создания изделия: ${error.message}`);
    }
  }

  static async updateProduct(id, productData) {
    try {
      const product = await Product.findById(id);
      if (!product) throw new Error('Изделие не найдено');

      if (productData.lot_id) {
        const lot = await Lot.findById(productData.lot_id);
        if (!lot) throw new Error('Участок не найден');
      }

      const updated = await Product.update(id, productData);
      return updated;
    } catch (error) {
      throw new Error(`Ошибка обновления изделия: ${error.message}`);
    }
  }

  static async deleteProduct(id) {
    try {
      const product = await Product.findById(id);
      if (!product) throw new Error('Изделие не найдено');

      await Product.delete(id);
      return { success: true, message: 'Изделие деактивировано' };
    } catch (error) {
      throw new Error(`Ошибка удаления изделия: ${error.message}`);
    }
  }

  static async getProductsByType(productType, limit = 100, offset = 0) {
    try {
      const products = await Product.findByProductType(productType, limit, offset);
      return products;
    } catch (error) {
      throw new Error(`Ошибка получения изделий по типу: ${error.message}`);
    }
  }
}

module.exports = ProductService;
