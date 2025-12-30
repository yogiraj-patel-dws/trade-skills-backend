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
    const { skillId, level, yearsOfExperience, canTeach, wantsToLearn } = skillData;
    
    return await prisma.userSkill.create({
      data: {
        userId,
        skillId,
        level,
        yearsOfExperience,
        canTeach,
        wantsToLearn
      },
      include: {
        skill: true
      }
    });
  }
  
  async getUserSkills(userId) {
    return await prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: true
      }
    });
  }
}

module.exports = new UserService();