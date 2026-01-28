const SearchService = require('../services/searchService');

class SearchController {
  static async globalSearch(req, res, next) {
    try {
      const { q } = req.query;
      const results = await SearchService.globalSearch(q);
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SearchController;
