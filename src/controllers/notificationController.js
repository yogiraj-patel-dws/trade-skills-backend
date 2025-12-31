const notificationService = require('../services/notificationService');
const reportService = require('../services/reportService');
const ApiResponse = require('../utils/ApiResponse');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const { isRead, type, limit, offset } = req.query;
      const notifications = await notificationService.getUserNotifications(req.user.id, {
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        type,
        limit,
        offset
      });
      
      res.status(200).json(ApiResponse.success(notifications, 'Notifications retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get notifications', 500));
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id, req.user.id);
      
      res.status(200).json(ApiResponse.success(null, 'Notification marked as read', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error('Failed to mark notification as read', 400));
    }
  }

  async markAllAsRead(req, res) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.status(200).json(ApiResponse.success(null, 'All notifications marked as read', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error('Failed to mark all notifications as read', 400));
    }
  }

  async getUnreadCount(req, res) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      res.status(200).json(ApiResponse.success({ count }, 'Unread count retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get unread count', 500));
    }
  }
}

class ReportController {
  async createReport(req, res) {
    try {
      const report = await reportService.createReport(req.user.id, req.body);
      res.status(201).json(ApiResponse.success(report, 'Report submitted successfully', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getUserReports(req, res) {
    try {
      const { status, type, limit, offset } = req.query;
      const reports = await reportService.getUserReports(req.user.id, { status, type, limit, offset });
      
      res.status(200).json(ApiResponse.success(reports, 'Reports retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get reports', 500));
    }
  }

  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);
      
      if (!report) {
        return res.status(404).json(ApiResponse.error('Report not found', 404));
      }
      
      res.status(200).json(ApiResponse.success(report, 'Report retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get report', 500));
    }
  }
}

module.exports = {
  NotificationController: new NotificationController(),
  ReportController: new ReportController()
};