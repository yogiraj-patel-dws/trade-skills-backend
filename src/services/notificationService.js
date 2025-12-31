const prisma = require('../config/database');

class NotificationService {
  async createNotification(userId, type, title, message, data = null) {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data
      }
    });
  }

  async getUserNotifications(userId, filters = {}) {
    const { isRead, type, limit = 20, offset = 0 } = filters;
    
    const where = { userId };
    if (typeof isRead === 'boolean') where.isRead = isRead;
    if (type) where.type = type;

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
  }

  async markAsRead(notificationId, userId) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });
  }

  async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  // Notification templates
  async notifySessionRequest(hostId, participantName, sessionTitle) {
    return await this.createNotification(
      hostId,
      'SESSION_REQUEST',
      'New Session Request',
      `${participantName} wants to join your session "${sessionTitle}"`,
      { sessionTitle, participantName }
    );
  }

  async notifySessionConfirmed(participantId, sessionTitle, scheduledAt) {
    return await this.createNotification(
      participantId,
      'SESSION_CONFIRMED',
      'Session Confirmed',
      `Your session "${sessionTitle}" has been confirmed for ${new Date(scheduledAt).toLocaleString()}`,
      { sessionTitle, scheduledAt }
    );
  }

  async notifySessionCancelled(userId, sessionTitle, reason) {
    return await this.createNotification(
      userId,
      'SESSION_CANCELLED',
      'Session Cancelled',
      `Your session "${sessionTitle}" has been cancelled. ${reason}`,
      { sessionTitle, reason }
    );
  }

  async notifySessionReminder(userId, sessionTitle, scheduledAt) {
    return await this.createNotification(
      userId,
      'SESSION_REMINDER',
      'Session Reminder',
      `Your session "${sessionTitle}" starts in 30 minutes`,
      { sessionTitle, scheduledAt }
    );
  }

  async notifyPaymentSuccess(userId, amount, credits) {
    return await this.createNotification(
      userId,
      'PAYMENT_SUCCESS',
      'Payment Successful',
      `Your payment of $${amount} was successful. ${credits} credits added to your wallet.`,
      { amount, credits }
    );
  }

  async notifyPaymentFailed(userId, amount, reason) {
    return await this.createNotification(
      userId,
      'PAYMENT_FAILED',
      'Payment Failed',
      `Your payment of $${amount} failed. ${reason}`,
      { amount, reason }
    );
  }

  async notifyCreditsReceived(userId, amount, source) {
    return await this.createNotification(
      userId,
      'CREDIT_RECEIVED',
      'Credits Received',
      `You received ${amount} credits from ${source}`,
      { amount, source }
    );
  }

  async notifyReviewReceived(userId, rating, reviewerName) {
    return await this.createNotification(
      userId,
      'REVIEW_RECEIVED',
      'New Review',
      `${reviewerName} left you a ${rating}-star review`,
      { rating, reviewerName }
    );
  }
}

module.exports = new NotificationService();