const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');

class MeetService {
  async createMeetingRoom(sessionId, hostId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        host: {
          select: {
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

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.hostId !== hostId) {
      throw new Error('Only session host can create meeting room');
    }

    // Generate unique meeting room ID
    const meetingId = `tradeskills-${sessionId.slice(0, 8)}-${Date.now()}`;
    
    // Create Jitsi Meet room URL
    const meetingLink = `https://meet.jit.si/${meetingId}`;

    // Update session with meeting details
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        meetingId,
        meetingLink,
        status: 'CONFIRMED'
      }
    });

    return {
      meetingId,
      meetingLink,
      session: updatedSession,
      roomConfig: {
        roomName: meetingId,
        displayName: `${session.host.profile.firstName} ${session.host.profile.lastName}`,
        subject: session.title,
        startWithAudioMuted: false,
        startWithVideoMuted: false
      }
    };
  }

  async joinMeeting(sessionId, userId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { userId }
        },
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
        }
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.meetingLink) {
      throw new Error('Meeting room not created yet');
    }

    // Check if user is host or participant
    const isHost = session.hostId === userId;
    const isParticipant = session.participants.some(p => p.userId === userId);

    if (!isHost && !isParticipant) {
      throw new Error('Not authorized to join this meeting');
    }

    // Get user profile for display name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return {
      meetingLink: session.meetingLink,
      meetingId: session.meetingId,
      isHost,
      roomConfig: {
        roomName: session.meetingId,
        displayName: `${user.profile.firstName} ${user.profile.lastName}`,
        subject: session.title,
        startWithAudioMuted: !isHost,
        startWithVideoMuted: !isHost
      }
    };
  }

  async startSession(sessionId, hostId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.hostId !== hostId) {
      throw new Error('Only session host can start the session');
    }

    if (session.status !== 'CONFIRMED') {
      throw new Error('Session must be confirmed before starting');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        actualStartTime: new Date()
      }
    });

    return updatedSession;
  }

  async endSession(sessionId, hostId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.hostId !== hostId) {
      throw new Error('Only session host can end the session');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new Error('Session must be in progress to end');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        actualEndTime: new Date()
      }
    });

    return updatedSession;
  }

  async recordAttendance(sessionId, userId, action) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { userId }
        }
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const isHost = session.hostId === userId;
    const participant = session.participants[0];

    if (!isHost && !participant) {
      throw new Error('Not authorized for this session');
    }

    if (action === 'join') {
      if (isHost) {
        // Host joined - no participant record needed
        return { message: 'Host joined session' };
      } else {
        // Update participant join time
        await prisma.sessionParticipant.update({
          where: { id: participant.id },
          data: { joinedAt: new Date() }
        });
        return { message: 'Participant joined session' };
      }
    } else if (action === 'leave') {
      if (!isHost && participant) {
        // Update participant leave time
        await prisma.sessionParticipant.update({
          where: { id: participant.id },
          data: { leftAt: new Date() }
        });
        return { message: 'Participant left session' };
      }
      return { message: 'User left session' };
    }
  }

  async getSessionStats(sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          include: {
            user: {
              select: {
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

    if (!session) {
      throw new Error('Session not found');
    }

    const stats = {
      sessionId,
      title: session.title,
      status: session.status,
      scheduledDuration: session.duration,
      actualDuration: null,
      participantCount: session.participants.length,
      participants: session.participants.map(p => ({
        name: `${p.user.profile.firstName} ${p.user.profile.lastName}`,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        duration: p.joinedAt && p.leftAt ? 
          Math.round((new Date(p.leftAt) - new Date(p.joinedAt)) / 1000 / 60) : null
      }))
    };

    if (session.actualStartTime && session.actualEndTime) {
      stats.actualDuration = Math.round(
        (new Date(session.actualEndTime) - new Date(session.actualStartTime)) / 1000 / 60
      );
    }

    return stats;
  }
}

module.exports = new MeetService();