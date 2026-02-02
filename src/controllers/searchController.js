const SearchService = require('../services/searchService');
const asyncHandler = require('../utils/asyncHandler');

class SearchController {
  static globalSearch = asyncHandler(async (req, res) => {
      const { q } = req.query;
      const results = await SearchService.globalSearch(q);
      res.json({
        success: true,
        data: results
      });
  });
    }
module.exports = SearchController;

