const sessionService = require('../services/sessionService');
const ApiResponse = require('../utils/ApiResponse');

class SessionController {
  async createSession(req, res) {
    try {
      const session = await sessionService.createSession(req.user.id, req.body);
      res.status(201).json(ApiResponse.success(session, 'Session created successfully', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getSessionById(req, res) {
    try {
      const { id } = req.params;
      const session = await sessionService.getSessionById(id);
      
      if (!session) {
        return res.status(404).json(ApiResponse.error('Session not found', 404));
      }
      
      res.status(200).json(ApiResponse.success(session, 'Session retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get session', 500));
    }
  }

  async getUserSessions(req, res) {
    try {
      const { type = 'all' } = req.query;
      const sessions = await sessionService.getUserSessions(req.user.id, type);
      
      res.status(200).json(ApiResponse.success(sessions, 'User sessions retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get user sessions', 500));
    }
  }

  async updateSessionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const session = await sessionService.updateSessionStatus(id, status, req.user.id);
      res.status(200).json(ApiResponse.success({ session }, 'Session status updated', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
}

module.exports = new SessionController();