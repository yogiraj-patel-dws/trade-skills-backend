const { SDK } = require('@100mslive/server-sdk');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');

class MeetService {
  constructor() {
    this.hms = new SDK(process.env.HMS_ACCESS_KEY, process.env.HMS_SECRET);
  }

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

    try {
      // Create 100ms room
      const roomName = `tradeskills-${sessionId.slice(0, 8)}-${Date.now()}`;
      
      const roomConfig = {
        name: roomName,
        description: session.title,
        template_id: process.env.HMS_TEMPLATE_ID,
        region: 'us',
        recording_info: {
          enabled: true,
          upload_info: {
            type: 's3',
            location: 'us-west-2'
          }
        }
      };

      const room = await this.hms.rooms.create(roomConfig);
      
      // Update session with meeting details
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          meetingId: room.id,
          meetingLink: `https://tradeskills.app.100ms.live/meeting/${room.id}`,
          status: 'CONFIRMED'
        }
      });

      return {
        roomId: room.id,
        meetingLink: `https://tradeskills.app.100ms.live/meeting/${room.id}`,
        session: updatedSession,
        roomConfig: {
          roomId: room.id,
          roomName: room.name,
          templateId: process.env.HMS_TEMPLATE_ID
        }
      };
    } catch (error) {
      console.error('100ms room creation error:', error);
      throw new Error('Failed to create meeting room');
    }
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

    if (!session.meetingId) {
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

    try {
      // Generate 100ms auth token
      const authToken = await this.hms.auth.getAuthToken({
        room_id: session.meetingId,
        user_id: userId,
        role: isHost ? 'host' : 'guest',
        type: 'app',
        data: {
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          sessionId: sessionId,
          isHost: isHost
        }
      });

      return {
        authToken,
        roomId: session.meetingId,
        meetingLink: session.meetingLink,
        isHost,
        userInfo: {
          userId,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          role: isHost ? 'host' : 'guest'
        }
      };
    } catch (error) {
      console.error('100ms auth token error:', error);
      throw new Error('Failed to generate meeting access token');
    }
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

    // Start recording if room exists
    if (session.meetingId) {
      try {
        await this.hms.recordings.start({
          room_id: session.meetingId,
          meeting_url: session.meetingLink
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }

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

    // Stop recording and end room
    if (session.meetingId) {
      try {
        await this.hms.recordings.stop({
          room_id: session.meetingId
        });
        
        // End the room
        await this.hms.rooms.disable(session.meetingId);
      } catch (error) {
        console.error('Failed to stop recording/end room:', error);
      }
    }

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
        return { message: 'Host joined session' };
      } else {
        await prisma.sessionParticipant.update({
          where: { id: participant.id },
          data: { joinedAt: new Date() }
        });
        return { message: 'Participant joined session' };
      }
    } else if (action === 'leave') {
      if (!isHost && participant) {
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

    // Get 100ms analytics if available
    if (session.meetingId) {
      try {
        const roomInfo = await this.hms.rooms.retrieve(session.meetingId);
        stats.roomAnalytics = {
          roomId: roomInfo.id,
          createdAt: roomInfo.created_at,
          isDisabled: roomInfo.disabled
        };
      } catch (error) {
        console.error('Failed to get room analytics:', error);
      }
    }

    return stats;
  }

  async getRecordings(sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session || !session.meetingId) {
      throw new Error('Session or meeting room not found');
    }

    try {
      const recordings = await this.hms.recordings.list({
        room_id: session.meetingId
      });

      return recordings.map(recording => ({
        id: recording.id,
        status: recording.status,
        startedAt: recording.started_at,
        stoppedAt: recording.stopped_at,
        duration: recording.duration,
        size: recording.size,
        location: recording.location
      }));
    } catch (error) {
      console.error('Failed to get recordings:', error);
      throw new Error('Failed to retrieve session recordings');
    }
  }
}

module.exports = new MeetService();