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
          select: {
            id: true,
            teachingLanguage: true,
            bannerImage: true,
            skillTitle: true,
            level: true,
            user: {
              select: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return skills.map(skill => ({
      ...skill,
      createdAt: skill.createdAt.toString(),
      userSkills: skill.userSkills.map(us => ({
        id: us.id,
        teachingLanguage: us.teachingLanguage,
        category: skill.category,
        level: us.level,
        bannerImage: us.bannerImage,
        skillTitle: us.skillTitle,
        user: {
          name: `${us.user.profile?.firstName || ''} ${us.user.profile?.lastName || ''}`.trim(),
          image: us.user.profile?.profilePicture
        }
      }))
    }));
  }

  async getSkillById(skillId) {
    // First try to find as a regular Skill ID
    let skill = await prisma.skill.findUnique({
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
    
    if (skill) {
      return {
        ...skill,
        createdAt: skill.createdAt.toString(),
        userSkills: skill.userSkills.map(us => ({
          ...us,
          createdAt: us.createdAt.toString(),
          updatedAt: us.updatedAt.toString()
        }))
      };
    }
    
    // If not found, try as UserSkill ID and return user's personalized data
    const userSkill = await prisma.userSkill.findUnique({
      where: { id: skillId },
      include: {
        skill: true,
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
    });
    
    if (!userSkill) return null;
    
    // Return all user's personalized skill data
    return {
      id: userSkill.id,
      skillId: userSkill.skillId,
      level: userSkill.level,
      yearsOfExperience: userSkill.yearsOfExperience,
      canTeach: userSkill.canTeach,
      wantsToLearn: userSkill.wantsToLearn,
      skillTitle: userSkill.skillTitle,
      bannerImage: userSkill.bannerImage,
      demoVideo: userSkill.demoVideo,
      teachingLanguage: userSkill.teachingLanguage,
      prerequisites: userSkill.prerequisites,
      subcategory: userSkill.subcategory,
      createdAt: userSkill.createdAt.toString(),
      updatedAt: userSkill.updatedAt.toString(),
      skill: {
        ...userSkill.skill,
        createdAt: userSkill.skill.createdAt.toString()
      },
      user: userSkill.user
    };
  }

  async getSkillCategories() {
    // Get categories with their subcategories
    const categoriesData = await prisma.skill.findMany({
      where: { isActive: true },
      include: {
        userSkills: {
          where: { 
            canTeach: true,
            subcategory: { not: null }
          },
          select: {
            subcategory: true
          }
        }
      }
    });

    // Group by category and collect subcategories
    const categoryMap = new Map();
    
    categoriesData.forEach(skill => {
      const category = skill.category;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          count: 0,
          subcategories: new Set()
        });
      }
      
      const categoryData = categoryMap.get(category);
      categoryData.count++;
      
      // Add subcategories from userSkills
      skill.userSkills.forEach(userSkill => {
        if (userSkill.subcategory) {
          categoryData.subcategories.add(userSkill.subcategory);
        }
      });
    });

    // Convert to array format
    return Array.from(categoryMap.values()).map(cat => ({
      name: cat.name,
      count: cat.count,
      subcategories: Array.from(cat.subcategories)
    }));
  }

  async searchSkills(query) {
    const skills = await prisma.skill.findMany({
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
    
    return skills.map(skill => ({
      ...skill,
      createdAt: skill.createdAt.toString(),
      userSkills: skill.userSkills.map(us => ({
        ...us,
        createdAt: us.createdAt.toString(),
        updatedAt: us.updatedAt.toString()
      }))
    }));
  }

  async getPopularSkills(limit = 10) {
    const skills = await prisma.skill.findMany({
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
    
    return skills.map(skill => ({
      ...skill,
      createdAt: skill.createdAt.toString(),
      userSkills: skill.userSkills.map(us => ({
        ...us,
        createdAt: us.createdAt.toString(),
        updatedAt: us.updatedAt.toString()
      }))
    }));
  }
}

module.exports = new SkillService();