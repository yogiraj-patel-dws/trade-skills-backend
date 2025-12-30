const prisma = require('../config/database');

class DashboardService {
  async getUserDashboard(userId) {
    const now = Date.now();
    const weekStart = now - (7 * 24 * 60 * 60 * 1000);
    
    // Get user profile and wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true
      }
    });

    // Get upcoming sessions (next 7 days)
    const upcomingSessions = await prisma.sessionParticipant.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        session: {
          scheduledAt: {
            gte: BigInt(now),
            lte: BigInt(now + (7 * 24 * 60 * 60 * 1000))
          }
        }
      },
      include: {
        session: {
          include: {
            host: {
              include: { profile: true }
            }
          }
        }
      },
      orderBy: {
        session: { scheduledAt: 'asc' }
      }
    });

    // Get sessions taught this week
    const sessionsTaughtThisWeek = await prisma.session.count({
      where: {
        hostId: userId,
        status: 'COMPLETED',
        actualEndTime: {
          gte: BigInt(weekStart)
        }
      }
    });

    // Get total sessions taught
    const totalSessionsTaught = await prisma.session.count({
      where: {
        hostId: userId,
        status: 'COMPLETED'
      }
    });

    // Get skills learned (user skills count)
    const skillsLearned = await prisma.userSkill.count({
      where: {
        userId,
        wantsToLearn: true
      }
    });

    // Get recommended sessions (popular skills user doesn't have)
    const recommendedSessions = await prisma.session.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          gte: BigInt(now)
        },
        hostId: {
          not: userId
        }
      },
      include: {
        host: {
          include: { profile: true }
        }
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    // Get recent community activity (recent sessions and reviews)
    const recentActivity = await prisma.session.findMany({
      where: {
        status: 'COMPLETED',
        actualEndTime: {
          gte: BigInt(now - (24 * 60 * 60 * 1000)) // Last 24 hours
        }
      },
      include: {
        host: {
          include: { profile: true }
        },
        participants: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      },
      take: 5,
      orderBy: { actualEndTime: 'desc' }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile ? {
          ...user.profile,
          createdAt: Number(user.profile.createdAt),
          updatedAt: Number(user.profile.updatedAt)
        } : null
      },
      stats: {
        availableCredits: user.wallet?.availableCredits || 0,
        creditsChangeThisWeek: 2, // Mock data - would need transaction tracking
        sessionsTaught: totalSessionsTaught,
        sessionsTaughtThisWeek,
        skillsLearned,
        upcomingSessionsCount: upcomingSessions.length
      },
      upcomingSessions: upcomingSessions.map(participant => ({
        id: participant.session.id,
        title: participant.session.title,
        scheduledAt: Number(participant.session.scheduledAt),
        duration: participant.session.duration,
        host: {
          name: `${participant.session.host.profile?.firstName} ${participant.session.host.profile?.lastName}`,
          profilePicture: participant.session.host.profile?.profilePicture
        },
        meetingLink: participant.session.meetingLink,
        status: participant.session.status
      })),
      recommendedSessions: recommendedSessions.map(session => ({
        id: session.id,
        title: session.title,
        description: session.description,
        creditCost: session.creditCost,
        host: {
          name: `${session.host.profile?.firstName} ${session.host.profile?.lastName}`,
          profilePicture: session.host.profile?.profilePicture
        },
        scheduledAt: Number(session.scheduledAt),
        rating: 4.5 // Mock rating - would need review aggregation
      })),
      communityActivity: recentActivity.map(session => ({
        type: 'session_completed',
        user: {
          name: `${session.host.profile?.firstName} ${session.host.profile?.lastName}`,
          profilePicture: session.host.profile?.profilePicture
        },
        action: `completed session "${session.title}"`,
        timestamp: Number(session.actualEndTime),
        timeAgo: this.getTimeAgo(Number(session.actualEndTime))
      }))
    };
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

module.exports = new DashboardService();