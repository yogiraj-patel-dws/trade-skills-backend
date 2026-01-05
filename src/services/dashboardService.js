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

      // Get upcoming sessions where user is learner
      const upcomingSessions = await prisma.session.findMany({
        where: {
          learnerId: userId,
          sessionStatus: { in: ['PENDING', 'CONFIRMED'] },
          createdAt: {
            gte: BigInt(now)
          }
        },
        include: {
          host: {
            include: { profile: true }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: 5
      });

      // Get sessions taught this week
      const sessionsTaughtThisWeek = await prisma.session.count({
        where: {
          hostId: userId,
          sessionStatus: 'COMPLETED',
          updatedAt: {
            gte: BigInt(weekStart)
          }
        }
      });

      // Get total sessions taught
      const totalSessionsTaught = await prisma.session.count({
        where: {
          hostId: userId,
          sessionStatus: 'COMPLETED'
        }
      });

      // Get skills learned (user skills count)
      const skillsLearned = await prisma.userSkill.count({
        where: {
          userId,
          wantsToLearn: true
        }
      });

      // Get recommended sessions (available sessions from other hosts)
      const recommendedSessions = await prisma.session.findMany({
        where: {
          sessionStatus: 'PENDING',
          hostId: {
            not: userId
          }
        },
        include: {
          host: {
            include: { profile: true }
          },
          userSkill: {
            include: { skill: true }
          }
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      });

      // Get recent community activity (recent completed sessions)
      const recentActivity = await prisma.session.findMany({
        where: {
          sessionStatus: 'COMPLETED',
          updatedAt: {
            gte: BigInt(now - (24 * 60 * 60 * 1000)) // Last 24 hours
          }
        },
        include: {
          host: {
            include: { profile: true }
          },
          learner: {
            include: { profile: true }
          }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
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
          creditsChangeThisWeek: 0, // Would need transaction tracking
          sessionsTaught: totalSessionsTaught,
          sessionsTaughtThisWeek,
          skillsLearned,
          upcomingSessionsCount: upcomingSessions.length
        },
        upcomingSessions: upcomingSessions.map(session => ({
          id: session.id,
          title: `Session with ${session.host.profile?.firstName || 'Host'}`,
          scheduledAt: Number(session.createdAt),
          duration: session.totalDurationMinutes,
          host: {
            name: `${session.host.profile?.firstName || ''} ${session.host.profile?.lastName || ''}`.trim(),
            profilePicture: session.host.profile?.profilePicture
          },
          status: session.sessionStatus,
          credits: session.totalCredits
        })),
        recommendedSessions: recommendedSessions.map(session => ({
          id: session.id,
          title: `Learn ${session.userSkill?.skill?.name || 'New Skill'}`,
          description: session.userSkill?.skill?.description || 'Skill learning session',
          creditCost: session.totalCredits,
          host: {
            name: `${session.host.profile?.firstName || ''} ${session.host.profile?.lastName || ''}`.trim(),
            profilePicture: session.host.profile?.profilePicture
          },
          scheduledAt: Number(session.createdAt),
          rating: 4.5 // Mock rating
        })),
        communityActivity: recentActivity.map(session => ({
          type: 'session_completed',
          user: {
            name: `${session.host.profile?.firstName || ''} ${session.host.profile?.lastName || ''}`.trim(),
            profilePicture: session.host.profile?.profilePicture
          },
          action: `completed a session with ${session.learner.profile?.firstName || 'a learner'}`,
          timestamp: Number(session.updatedAt),
          timeAgo: this.getTimeAgo(Number(session.updatedAt))
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