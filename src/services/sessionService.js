const prisma = require('../config/database');

class SessionService {
  async createSession(hostId, sessionData) {
    const { 
      skillId, 
      duration,
      creditsRequired
    } = sessionData;
    
    // Create a basic session with the current schema
    const session = await prisma.session.create({
      data: {
        userTeachingSkillId: skillId, // Using skillId as userTeachingSkillId for now
        learnerId: hostId, // Same user for testing
        hostId: hostId,
        totalDurationMinutes: duration,
        totalCredits: creditsRequired,
        hostCredits: Math.floor(creditsRequired * 0.8),
        adminCredits: Math.floor(creditsRequired * 0.2),
        learnerStatus: 'PENDING',
        hostStatus: 'PENDING',
        sessionStatus: 'PENDING',
        updatedAt: BigInt(Date.now())
      },
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
        learner: {
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
    });
    
    return {
      session: {
        ...session,
        createdAt: Number(session.createdAt),
        updatedAt: Number(session.updatedAt)
      }
    };
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
                lastName: true
              }
            }
          }
        },
        learner: {
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
        userSkill: {
          include: {
            skill: true
          }
        }
      }
    });
    
    if (!session) return null;
    
    return {
      ...session,
      createdAt: Number(session.createdAt),
      updatedAt: Number(session.updatedAt)
    };
  }
  
  async getUserSessions(userId, type = 'all') {
    try {
      let where = {};
      
      if (type === 'hosted') {
        where.hostId = userId;
      } else if (type === 'learning') {
        where.learnerId = userId;
      } else {
        where.OR = [
          { hostId: userId },
          { learnerId: userId }
        ];
      }
      
      const sessions = await prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      
      return sessions.map(session => ({
        ...session,
        createdAt: Number(session.createdAt),
        updatedAt: Number(session.updatedAt)
      }));
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      return [];
    }
  }
  
  async updateSessionStatus(sessionId, status, userId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if user is host or learner
    if (session.hostId !== userId && session.learnerId !== userId) {
      throw new Error('Unauthorized to update this session');
    }
    
    const updateData = {};
    
    if (session.hostId === userId) {
      updateData.hostStatus = status;
    } else {
      updateData.learnerStatus = status;
    }
    
    // Update overall session status based on individual statuses
    if (status === 'CONFIRMED') {
      updateData.sessionStatus = 'CONFIRMED';
    } else if (status === 'CANCELLED') {
      updateData.sessionStatus = 'CANCELLED';
    }
    
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
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
        learner: {
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
        userSkill: {
          include: {
            skill: true
          }
        }
      }
    });
    
    return {
      ...updatedSession,
      createdAt: Number(updatedSession.createdAt),
      updatedAt: Number(updatedSession.updatedAt)
    };
  }
}

module.exports = new SessionService();