const adminService = require('../services/adminService');
const ApiResponse = require('../utils/ApiResponse');

class AdminController {
  async getDashboardStats(req, res) {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json(ApiResponse.success(stats, 'Dashboard stats retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get dashboard stats', 500));
    }
  }

  async getUsers(req, res) {
    try {
      const { role, isActive, search, limit, offset } = req.query;
      const users = await adminService.getUsers({ 
        role, 
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search, 
        limit, 
        offset 
      });
      
      res.status(200).json(ApiResponse.success(users, 'Users retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get users', 500));
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);
      
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found', 404));
      }
      
      res.status(200).json(ApiResponse.success(user, 'User details retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get user details', 500));
    }
  }

  async suspendUser(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const user = await adminService.suspendUser(id, reason);
      res.status(200).json(ApiResponse.success(user, 'User suspended successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async restoreUser(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const user = await adminService.restoreUser(id, reason);
      res.status(200).json(ApiResponse.success(user, 'User restored successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async adjustCredits(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      
      const wallet = await adminService.adjustCredits(id, amount, reason, req.user.id);
      res.status(200).json(ApiResponse.success(wallet, 'Credits adjusted successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getSessions(req, res) {
    try {
      const { status, hostId, limit, offset } = req.query;
      const sessions = await adminService.getSessions({ status, hostId, limit, offset });
      
      res.status(200).json(ApiResponse.success(sessions, 'Sessions retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get sessions', 500));
    }
  }

  async cancelSession(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const session = await adminService.cancelSession(id, reason, req.user.id);
      res.status(200).json(ApiResponse.success(session, 'Session cancelled successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getReports(req, res) {
    try {
      const { status, type, limit, offset } = req.query;
      const reports = await adminService.getReports({ status, type, limit, offset });
      
      res.status(200).json(ApiResponse.success(reports, 'Reports retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get reports', 500));
    }
  }

  async resolveReport(req, res) {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      
      const report = await adminService.resolveReport(id, resolution, req.user.id);
      res.status(200).json(ApiResponse.success(report, 'Report resolved successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getAdminActions(req, res) {
    try {
      const { limit, offset } = req.query;
      const actions = await adminService.getAdminActions(limit, offset);
      
      res.status(200).json(ApiResponse.success(actions, 'Admin actions retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get admin actions', 500));
    }
  }
}

module.exports = new AdminController();