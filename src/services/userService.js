const prisma = require('../config/database');

class UserService {
  async getProfile(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            profilePicture: true,
            phoneNumber: true,
            timezone: true,
            availability: true,
            rating: true,
            totalReviews: true
          }
        },
        wallet: {
          select: {
            availableCredits: true,
            lockedCredits: true,
            totalEarned: true,
            totalSpent: true
          }
        }
      }
    });
  }
  
  async updateProfile(userId, updateData) {
    return await prisma.userProfile.update({
      where: { userId },
      data: updateData
    });
  }
  
  async addSkill(userId, skillData) {
    const { 
      skillId, 
      level, 
      skillTitle,
      bannerImage,
      demoVideo,
      teachingLanguage,
      prerequisites,
      subcategory
    } = skillData;
    
    const result = await prisma.userSkill.create({
      data: {
        userId,
        skillId,
        level,
        canTeach: true, // Default to true since they're adding a teaching skill
        wantsToLearn: false, // Default to false
        skillTitle,
        bannerImage,
        demoVideo,
        teachingLanguage,
        prerequisites,
        subcategory
      },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            isActive: true
          }
        }
      }
    });
    
    // Convert BigInt to string for JSON serialization
    return {
      ...result,
      createdAt: result.createdAt.toString(),
      updatedAt: result.updatedAt.toString()
    };
  }
  
  async getUserSkills(userId) {
    const skills = await prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            isActive: true
          }
        }
      }
    });
    
    // Convert BigInt to string for JSON serialization
    return skills.map(skill => ({
      ...skill,
      createdAt: skill.createdAt.toString(),
      updatedAt: skill.updatedAt.toString()
    }));
  }
}

module.exports = new UserService();