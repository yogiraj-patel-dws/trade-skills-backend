const prisma = require('../config/database');

class ReviewService {
  async createReview(reviewData) {
    const { senderId, receiverId, sessionId, rating, comment } = reviewData;
    
    // Check if review already exists for this session
    if (sessionId) {
      const existingReview = await prisma.review.findFirst({
        where: { senderId, receiverId, sessionId }
      });
      
      if (existingReview) {
        throw new Error('Review already exists for this session');
      }
    }
    
    const review = await prisma.review.create({
      data: {
        senderId,
        receiverId,
        sessionId,
        rating,
        comment
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });
    
    // Update receiver's rating
    await this.updateUserRating(receiverId);
    
    return {
      ...review,
      createdAt: review.createdAt.toString()
    };
  }
  
  async getUserReviews(userId) {
    const reviews = await prisma.review.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return reviews.map(review => ({
      ...review,
      createdAt: review.createdAt.toString()
    }));
  }
  
  async updateUserRating(userId) {
    const reviews = await prisma.review.findMany({
      where: { receiverId: userId },
      select: { rating: true }
    });
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await prisma.userProfile.update({
        where: { userId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length
        }
      });
    }
  }
}

module.exports = new ReviewService();