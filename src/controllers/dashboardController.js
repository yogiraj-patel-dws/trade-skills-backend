const dashboardService = require('../services/dashboardService');
const ApiResponse = require('../utils/ApiResponse');

class DashboardController {
  async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const dashboardData = await dashboardService.getUserDashboard(userId);
      res.status(200).json(ApiResponse.success(dashboardData, 'Dashboard data retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error(error.message, 500));
    }
  }
}

module.exports = new DashboardController();