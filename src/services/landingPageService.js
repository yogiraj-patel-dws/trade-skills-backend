const prisma = require('../config/database');

class LandingPageService {
  async getAnalytics() {
    // Get platform statistics
    const [userCount, sessionCount, skillCount] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.session.count({ where: { status: 'COMPLETED' } }),
      prisma.skill.count({ where: { isActive: true } })
    ]);

    // Calculate community rating (mock for now)
    const communityRating = 4.9;

    return {
      activeTeachers: userCount > 0 ? `${Math.floor(userCount * 0.6)}+` : '10+',
      skillsExchanged: sessionCount > 0 ? `${sessionCount}+` : '50+',
      communityRating: communityRating,
      countries: '120+'
    };
  }

  async getPopularSkills() {
    // Get skills with most user associations
    const popularSkills = await prisma.skill.findMany({
      take: 8,
      include: {
        userSkills: {
          where: { canTeach: true }
        }
      },
      orderBy: {
        userSkills: {
          _count: 'desc'
        }
      }
    });

    return popularSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      teacherCount: skill.userSkills.length
    }));
  }

  getWhyTradeSkills() {
    return {
      forLearners: [
        {
          icon: '🎯',
          title: 'Access thousands of skills for free',
          description: 'Learn from expert practitioners without spending money'
        },
        {
          icon: '👥',
          title: 'Learn at your own pace with real people',
          description: 'Connect with mentors who understand your learning style'
        },
        {
          icon: '⚡',
          title: 'Expand your network globally',
          description: 'Build meaningful connections with professionals worldwide'
        }
      ],
      forTeachers: [
        {
          icon: '💡',
          title: 'Monetize your knowledge by teaching',
          description: 'Earn credits and recognition for sharing your expertise'
        },
        {
          icon: '🏆',
          title: 'Build a reputation as an expert',
          description: 'Establish yourself as a thought leader in your field'
        },
        {
          icon: '🌟',
          title: 'Earn community credits for premium features',
          description: 'Unlock advanced platform features through teaching'
        }
      ]
    };
  }

  async getLandingPageData() {
    const [analytics, popularSkills, whyTradeSkills] = await Promise.all([
      this.getAnalytics(),
      this.getPopularSkills(),
      Promise.resolve(this.getWhyTradeSkills())
    ]);

    return {
      analytics,
      popularSkills,
      whyTradeSkills
    };
  }
}

module.exports = new LandingPageService();