const knex = require('../config/database');
const { AppError } = require('../utils/errorHandler');

class SearchService {
  /**
   * Global search across applications and discrepancies
   */
  static async globalSearch(query) {
    if (!query || query.length < 2) {
      return { applications: [], discrepancies: [] };
    }

    const searchTerm = `%${query}%`;

    try {
      // Search Applications
      const applications = await knex('applications')
        .select('id', 'application_number', 'drawing_number', 'serial_number', 'status')
        .where('is_active', true)
        .andWhere(function() {
          this.where('application_number', 'like', searchTerm)
            .orWhere('drawing_number', 'like', searchTerm)
            .orWhere('serial_number', 'like', searchTerm);
        })
        .limit(10);

      // Search Discrepancies
      const discrepancies = await knex('discrepancies')
        .select('id', 'discrepancy_number', 'title', 'status', 'severity')
        .where('is_active', true)
        .andWhere(function() {
          this.where('discrepancy_number', 'like', searchTerm)
            .orWhere('title', 'like', searchTerm)
            .orWhere('description', 'like', searchTerm);
        })
        .limit(10);

      return {
        applications,
        discrepancies
      };
    } catch (error) {
      throw new AppError(`Ошибка при поиске: ${error.message}`, 500);
    }
  }
}

module.exports = SearchService;
