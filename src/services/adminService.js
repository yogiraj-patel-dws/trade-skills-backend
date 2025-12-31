const prisma = require('../config/database');

class AdminService {
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        totalSessions,
        totalRevenue,
        totalCreditsCirculation
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.session.count(),
        prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.wallet.aggregate({
          _sum: { 
            availableCredits: true,
            lockedCredits: true,
            totalEarned: true
          }
        })
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        sessions: {
          total: totalSessions,
          completed: 0,
          successRate: 0
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          currency: 'USD'
        },
        credits: {
          available: totalCreditsCirculation._sum.availableCredits || 0,
          locked: totalCreditsCirculation._sum.lockedCredits || 0,
          totalEarned: totalCreditsCirculation._sum.totalEarned || 0
        },
        recentActivity: []
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        users: { total: 0, active: 0, inactive: 0 },
        sessions: { total: 0, completed: 0, successRate: 0 },
        revenue: { total: 0, currency: 'USD' },
        credits: { available: 0, locked: 0, totalEarned: 0 },
        recentActivity: []
      };
    }
  }

  async getUsers(filters = {}) {
    try {
      const { role, isActive, search, limit = 20, offset = 0 } = filters;
      
      const where = {};
      if (role) where.role = role;
      if (typeof isActive === 'boolean') where.isActive = isActive;
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      return await prisma.user.findMany({
        where,
        include: {
          profile: true,
          wallet: {
            select: {
              availableCredits: true,
              totalEarned: true,
              totalSpent: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });
    } catch (error) {
      console.error('Error in getUsers:', error);
      return [];
    }
  }

  async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        hostedSessions: {
          include: {
            participants: true
          }
        },
        participantSessions: {
          include: {
            session: {
              select: {
                title: true,
                status: true,
                creditCost: true
              }
            }
          }
        },
        sentReviews: true,
        receivedReviews: true
      }
    });
  }

  async suspendUser(userId, reason) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      // Cancel all pending sessions hosted by this user
      await tx.session.updateMany({
        where: {
          hostId: userId,
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        data: { status: 'CANCELLED' }
      });

      // Create admin action log
      await tx.adminAction.create({
        data: {
          adminId: 'system', // Will be updated with actual admin ID
          targetUserId: userId,
          action: 'USER_SUSPENDED',
          description: reason
        }
      });

      return user;
    });
  }

  async restoreUser(userId, reason) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { isActive: true }
      });

      await tx.adminAction.create({
        data: {
          adminId: 'system',
          targetUserId: userId,
          action: 'USER_RESTORED',
          description: reason
        }
      });

      return user;
    });
  }

  async adjustCredits(userId, amount, reason, adminId) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('User wallet not found');
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          availableCredits: { increment: amount },
          totalEarned: amount > 0 ? { increment: amount } : undefined
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ADMIN_ADJUSTMENT',
          amount,
          description: `Admin adjustment: ${reason}`,
          status: 'COMPLETED'
        }
      });

      // Log admin action
      await tx.adminAction.create({
        data: {
          adminId,
          targetUserId: userId,
          action: 'CREDIT_ADJUSTMENT',
          description: `${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} credits: ${reason}`,
          metadata: { amount, reason }
        }
      });

      return updatedWallet;
    });
  }

  async getSessions(filters = {}) {
    try {
      const { status, hostId, limit = 20, offset = 0 } = filters;
      
      const where = {};
      if (status) where.sessionStatus = status;
      if (hostId) where.hostId = hostId;

      return await prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });
    } catch (error) {
      console.error('Error in getSessions:', error);
      return [];
    }
  }

  async cancelSession(sessionId, reason, adminId) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: { participants: true }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Refund credits to participants
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
        }
      }

      // Update session status
      const updatedSession = await tx.session.update({
        where: { id: sessionId },
        data: { status: 'CANCELLED' }
      });

      // Log admin action
      await tx.adminAction.create({
        data: {
          adminId,
          action: 'SESSION_CANCELLED',
          description: `Admin cancelled session: ${reason}`,
          metadata: { sessionId, reason }
        }
      });

      return updatedSession;
    });
  }

  async getReports(filters = {}) {
    const { status, type, limit = 20, offset = 0 } = filters;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    return await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            profile: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
  }

  async resolveReport(reportId, resolution, adminId) {
    return await prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id: reportId },
        data: {
          status: 'RESOLVED',
          resolvedBy: adminId,
          resolvedAt: new Date()
        }
      });

      await tx.adminAction.create({
        data: {
          adminId,
          action: 'REPORT_RESOLVED',
          description: `Resolved report: ${resolution}`,
          metadata: { reportId, resolution }
        }
      });

      return report;
    });
  }

  async getAdminActions(limit = 50, offset = 0) {
    return await prisma.adminAction.findMany({
      include: {
        admin: {
          select: {
            profile: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
  }
}

module.exports = new AdminService();