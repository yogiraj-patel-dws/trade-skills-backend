const meetService = require('../services/meetService');
const ApiResponse = require('../utils/ApiResponse');

class MeetController {
  async createMeetingRoom(req, res) {
    try {
      const { sessionId } = req.body;
      const result = await meetService.createMeetingRoom(sessionId, req.user.id);
      
      res.status(201).json(ApiResponse.success(result, 'Meeting room created', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async joinMeeting(req, res) {
    try {
      const { sessionId } = req.params;
      const result = await meetService.joinMeeting(sessionId, req.user.id);
      
      res.status(200).json(ApiResponse.success(result, 'Meeting join details retrieved', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async startSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await meetService.startSession(sessionId, req.user.id);
      
      res.status(200).json(ApiResponse.success(session, 'Session started', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await meetService.endSession(sessionId, req.user.id);
      
      res.status(200).json(ApiResponse.success(session, 'Session ended', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async recordAttendance(req, res) {
    try {
      const { sessionId } = req.params;
      const { action } = req.body; // 'join' or 'leave'
      
      const result = await meetService.recordAttendance(sessionId, req.user.id, action);
      
      res.status(200).json(ApiResponse.success(result, 'Attendance recorded', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getSessionStats(req, res) {
    try {
      const { sessionId } = req.params;
      const stats = await meetService.getSessionStats(sessionId);
      
      res.status(200).json(ApiResponse.success(stats, 'Session stats retrieved', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }
}

module.exports = new MeetController();