const prisma = require('../config/database');
const { convertDatesToTimestamps } = require('../utils/dateUtils');

class SessionService {
  async createSession(hostId, sessionData) {
    const { title, description, skillId, sessionType, maxParticipants, creditCost, scheduledAt, duration } = sessionData;
    
    return await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.session.create({
        data: {
          title,
          description,
          hostId,
          skillId,
          sessionType,
          maxParticipants: sessionType === 'ONE_TO_MANY' ? maxParticipants : 1,
          creditCost,
          scheduledAt: BigInt(scheduledAt),
          duration,
          status: 'PENDING'
        },
        include: {
          host: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  rating: true
                }
              }
            }
          }
        }
      });

      return convertDatesToTimestamps(session);
    });
  }

  async getSessionById(sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        host: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                rating: true,
                totalReviews: true
              }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });
    return convertDatesToTimestamps(session);
  }

  async getUserSessions(userId, type = 'all') {
    const where = {};
    
    if (type === 'hosted') {
      where.hostId = userId;
    } else if (type === 'joined') {
      where.participants = {
        some: { userId }
      };
    } else {
      where.OR = [
        { hostId: userId },
        { participants: { some: { userId } } }
      ];
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });
    return convertDatesToTimestamps(sessions);
  }

  async getPublicSessions(filters = {}) {
    const { skillId, sessionType, status = 'PENDING' } = filters;
    
    const where = {
      status,
      scheduledAt: {
        gte: BigInt(Date.now())
      }
    };

    if (skillId) where.skillId = skillId;
    if (sessionType) where.sessionType = sessionType;

    const sessions = await prisma.session.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                rating: true
              }
            }
          }
        },
        participants: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });
    return convertDatesToTimestamps(sessions);
  }

  async joinSession(sessionId, userId) {
    return await prisma.$transaction(async (tx) => {
      // Check session availability
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: {
          participants: true
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'PENDING') {
        throw new Error('Session is not available for joining');
      }

      if (session.hostId === userId) {
        throw new Error('Cannot join your own session');
      }

      // Check if already joined
      const existingParticipant = session.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        throw new Error('Already joined this session');
      }

      // Check capacity for group sessions
      if (session.sessionType === 'ONE_TO_MANY' && session.participants.length >= session.maxParticipants) {
        throw new Error('Session is full');
      }

      // Check user's wallet balance
      const wallet = await tx.wallet.findUnique({
        where: { userId }
      });

      if (!wallet || wallet.availableCredits < session.creditCost) {
        throw new Error('Insufficient credits');
      }

      // Lock credits
      await tx.wallet.update({
        where: { userId },
        data: {
          availableCredits: { decrement: session.creditCost },
          lockedCredits: { increment: session.creditCost }
        }
      });

      // Create credit lock record
      await tx.creditLock.create({
        data: {
          walletId: wallet.id,
          sessionId,
          amount: session.creditCost,
          reason: 'Session booking'
        }
      });

      // Add participant
      const participant = await tx.sessionParticipant.create({
        data: {
          sessionId,
          userId,
          status: 'CONFIRMED'
        }
      });

      // Update session status if needed
      if (session.sessionType === 'ONE_ON_ONE') {
        await tx.session.update({
          where: { id: sessionId },
          data: { status: 'CONFIRMED' }
        });
      }

      return participant;
    });
  }

  async cancelSession(sessionId, userId) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: {
          participants: true
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.hostId !== userId) {
        throw new Error('Only host can cancel session');
      }

      if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
        throw new Error('Cannot cancel this session');
      }

      // Refund credits to all participants
      for (const participant of session.participants) {
        const wallet = await tx.wallet.findUnique({
          where: { userId: participant.userId }
        });

        if (wallet) {
          await tx.wallet.update({
            where: { userId: participant.userId },
            data: {
              availableCredits: { increment: session.creditCost },
              lockedCredits: { decrement: session.creditCost }
            }
          });

          // Release credit locks
          await tx.creditLock.updateMany({
            where: {
              walletId: wallet.id,
              sessionId,
              isReleased: false
            },
            data: {
              isReleased: true,
              releasedAt: BigInt(Date.now())
            }
          });
        }
      }

      // Update session status
      await tx.session.update({
        where: { id: sessionId },
        data: { status: 'CANCELLED' }
      });

      return { message: 'Session cancelled and credits refunded' };
    });
  }

  async completeSession(sessionId, hostId) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: {
          participants: true
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.hostId !== hostId) {
        throw new Error('Only host can complete session');
      }

      if (session.status !== 'IN_PROGRESS') {
        throw new Error('Session must be in progress to complete');
      }

      // Calculate total earnings
      const totalEarnings = session.participants.length * session.creditCost;

      // Transfer credits to host
      const hostWallet = await tx.wallet.findUnique({
        where: { userId: hostId }
      });

      if (hostWallet) {
        await tx.wallet.update({
          where: { userId: hostId },
          data: {
            availableCredits: { increment: totalEarnings },
            totalEarned: { increment: totalEarnings }
          }
        });

        // Create earning transaction
        await tx.transaction.create({
          data: {
            walletId: hostWallet.id,
            sessionId,
            type: 'SESSION_EARNING',
            amount: totalEarnings,
            description: `Earnings from session: ${session.title}`,
            status: 'COMPLETED'
          }
        });
      }

      // Release credit locks and create payment transactions
      for (const participant of session.participants) {
        const wallet = await tx.wallet.findUnique({
          where: { userId: participant.userId }
        });

        if (wallet) {
          await tx.wallet.update({
            where: { userId: participant.userId },
            data: {
              lockedCredits: { decrement: session.creditCost },
              totalSpent: { increment: session.creditCost }
            }
          });

          // Release credit locks
          await tx.creditLock.updateMany({
            where: {
              walletId: wallet.id,
              sessionId,
              isReleased: false
            },
            data: {
              isReleased: true,
              releasedAt: BigInt(Date.now())
            }
          });

          // Create payment transaction
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              sessionId,
              type: 'SESSION_PAYMENT',
              amount: -session.creditCost,
              description: `Payment for session: ${session.title}`,
              status: 'COMPLETED'
            }
          });
        }
      }

      // Update session status
      await tx.session.update({
        where: { id: sessionId },
        data: { 
          status: 'COMPLETED',
          actualEndTime: BigInt(Date.now())
        }
      });

      return { message: 'Session completed successfully' };
    });
  }
}

module.exports = new SessionService();