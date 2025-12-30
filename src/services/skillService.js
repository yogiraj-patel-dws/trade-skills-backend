const prisma = require('../config/database');

class SkillService {
  async createSkill(skillData) {
    const { name, description, category } = skillData;
    
    return await prisma.skill.create({
      data: {
        name,
        description,
        category,
        createdAt: BigInt(Date.now())
      }
    });
  }

  async getAllSkills(filters = {}) {
    const { category, search, isActive = true } = filters;
    
    const where = { isActive };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skills = await prisma.skill.findMany({
      where,
      include: {
        userSkills: {
          where: { canTeach: true },
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    rating: true,
                    createdAt: true,
                    updatedAt: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return skills.map(skill => ({
      ...skill,
      createdAt: Number(skill.createdAt),
      userSkills: skill.userSkills.map(us => ({
        ...us,
        createdAt: Number(us.createdAt),
        user: {
          ...us.user,
          profile: us.user.profile ? {
            ...us.user.profile,
            createdAt: Number(us.user.profile.createdAt),
            updatedAt: Number(us.user.profile.updatedAt)
          } : null
        }
      }))
    }));
  }

  async getSkillById(skillId) {
    return await prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        userSkills: {
          include: {
            user: {
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
            }
          }
        }
      }
    });
  }

  async getSkillCategories() {
    const categories = await prisma.skill.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: {
        category: true
      }
    });

    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));
  }

  async searchSkills(query) {
    return await prisma.skill.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        userSkills: {
          where: { canTeach: true },
          take: 3,
          include: {
            user: {
              select: {
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
        }
      },
      take: 20
    });
  }

  async getPopularSkills(limit = 10) {
    return await prisma.skill.findMany({
      where: { isActive: true },
      include: {
        userSkills: {
          where: { canTeach: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }
}

module.exports = new SkillService();