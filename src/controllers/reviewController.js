const reviewService = require('../services/reviewService');
const ApiResponse = require('../utils/ApiResponse');

class ReviewController {
  async createReview(req, res) {
    try {
      const { userId } = req.params;
      const reviewData = { ...req.body, receiverId: userId, senderId: req.user.id };
      
      const review = await reviewService.createReview(reviewData);
      res.status(201).json(ApiResponse.success({ review }, 'Review created successfully', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const reviews = await reviewService.getUserReviews(userId);
      res.status(200).json(ApiResponse.success(reviews, 'Reviews retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get reviews', 500));
    }
  }
}

module.exports = new ReviewController();