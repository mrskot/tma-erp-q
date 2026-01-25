const Product = require('../models/Product');
const Lot = require('../models/Lot');
const User = require('../models/User');

class ProductService {
  static async getAllProducts(limit = 100, offset = 0, status = 'active') {
    try {
      const products = await Product.findAll(limit, offset, status);
      const total = await Product.count(status);

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
      // Проверка основного участка
      if (productData.lot_id) {
        const lot = await Lot.findById(productData.lot_id);
        if (!lot) throw new Error('Основной участок не найден');
      }

      // Проверка предыдущего участка
      if (productData.previous_lot_id) {
        const lot = await Lot.findById(productData.previous_lot_id);
        if (!lot) throw new Error('Предыдущий участок не найден');
      }

      // Проверка следующего участка
      if (productData.next_lot_id) {
        const lot = await Lot.findById(productData.next_lot_id);
        if (!lot) throw new Error('Следующий участок не найден');
      }

      // Проверка контролёра
      if (productData.default_inspector_id) {
        const inspector = await User.findById(productData.default_inspector_id);
        if (!inspector) throw new Error('Контролёр не найден');
        if (inspector.role !== 'inspector') {
          throw new Error('Указанный пользователь не является контролёром');
        }
      }

      // Гарантируем, что checklist является строкой JSON перед сохранением
      if (productData.checklist && Array.isArray(productData.checklist)) {
        productData.checklist = JSON.stringify(productData.checklist);
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

      // Проверка основного участка
      if (productData.lot_id) {
        const lot = await Lot.findById(productData.lot_id);
        if (!lot) throw new Error('Основной участок не найден');
      }

      // Проверка предыдущего участка
      if (productData.previous_lot_id) {
        const lot = await Lot.findById(productData.previous_lot_id);
        if (!lot) throw new Error('Предыдущий участок не найден');
      }

      // Проверка следующего участка
      if (productData.next_lot_id) {
        const lot = await Lot.findById(productData.next_lot_id);
        if (!lot) throw new Error('Следующий участок не найден');
      }

      // Проверка контролёра
      if (productData.default_inspector_id) {
        const inspector = await User.findById(productData.default_inspector_id);
        if (!inspector) throw new Error('Контролёр не найден');
        if (inspector.role !== 'inspector') {
          throw new Error('Указанный пользователь не является контролёром');
        }
      }

      // Гарантируем, что checklist является строкой JSON перед сохранением
      if (productData.checklist && Array.isArray(productData.checklist)) {
        productData.checklist = JSON.stringify(productData.checklist);
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

  static async restoreProduct(id) {
    try {
      const product = await Product.findById(id, true); // Ищем, включая деактивированные
      if (!product) throw new Error('Изделие не найдено');
      if (product.is_active) throw new Error('Изделие уже активно');

      await Product.restore(id);
      return { success: true, message: 'Изделие успешно восстановлено' };
    } catch (error) {
      throw new Error(`Ошибка восстановления изделия: ${error.message}`);
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