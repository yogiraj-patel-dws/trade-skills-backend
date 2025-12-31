const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { generateToken } = require('../src/config/jwt');

describe('100ms Meet Flow Tests', () => {
  let authToken;
  let participantToken;
  let testHost;
  let testParticipant;
  let testSession;
  let testSkill;

  beforeAll(async () => {
    // Create test skill
    testSkill = await prisma.skill.create({
      data: {
        name: 'Test Skill',
        description: 'Test skill for meeting',
        category: 'Technology',
        isActive: true
      }
    });

    // Create test host user
    testHost = await prisma.user.create({
      data: {
        email: 'host@meet.com',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Host',
            lastName: 'User'
          }
        },
        wallet: {
          create: {
            availableCredits: 1000,
            lockedCredits: 0
          }
        }
      }
    });

    // Create test participant user
    testParticipant = await prisma.user.create({
      data: {
        email: 'participant@meet.com',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Participant',
            lastName: 'User'
          }
        },
        wallet: {
          create: {
            availableCredits: 500,
            lockedCredits: 0
          }
        }
      }
    });

    // Create test session
    testSession = await prisma.session.create({
      data: {
        title: 'Test Meeting Session',
        description: 'Test session for 100ms integration',
        hostId: testHost.id,
        skillId: testSkill.id,
        sessionType: 'ONE_ON_ONE',
        status: 'PENDING',
        maxParticipants: 1,
        creditCost: 50,
        scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
        duration: 60
      }
    });

    authToken = generateToken({ userId: testHost.id });
    participantToken = generateToken({ userId: testParticipant.id });
  });

  afterAll(async () => {
    await prisma.sessionParticipant.deleteMany({ where: { sessionId: testSession.id } });
    await prisma.session.delete({ where: { id: testSession.id } });
    await prisma.transaction.deleteMany({ where: { wallet: { userId: testHost.id } } });
    await prisma.transaction.deleteMany({ where: { wallet: { userId: testParticipant.id } } });
    await prisma.wallet.delete({ where: { userId: testHost.id } });
    await prisma.wallet.delete({ where: { userId: testParticipant.id } });
    await prisma.userProfile.delete({ where: { userId: testHost.id } });
    await prisma.userProfile.delete({ where: { userId: testParticipant.id } });
    await prisma.user.delete({ where: { id: testHost.id } });
    await prisma.user.delete({ where: { id: testParticipant.id } });
    await prisma.skill.delete({ where: { id: testSkill.id } });
  });

  describe('POST /api/meet/create-room', () => {
    test('should create meeting room for session host', async () => {
      const response = await request(app)
        .post('/api/meet/create-room')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionId: testSession.id })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roomId).toBeDefined();
      expect(response.body.data.meetingLink).toBeDefined();
      expect(response.body.data.session.status).toBe('CONFIRMED');
      expect(response.body.data.session.meetingId).toBeDefined();
      expect(response.body.data.session.meetingLink).toBeDefined();

      // Verify session was updated in database
      const updatedSession = await prisma.session.findUnique({
        where: { id: testSession.id }
      });
      expect(updatedSession.meetingId).toBeDefined();
      expect(updatedSession.meetingLink).toBeDefined();
      expect(updatedSession.status).toBe('CONFIRMED');
    });

    test('should fail for non-host user', async () => {
      const response = await request(app)
        .post('/api/meet/create-room')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ sessionId: testSession.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only session host can create meeting room');
    });

    test('should fail for invalid session', async () => {
      const response = await request(app)
        .post('/api/meet/create-room')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionId: 'invalid-session-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session not found');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/meet/create-room')
        .send({ sessionId: testSession.id })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/meet/join/:sessionId', () => {
    beforeAll(async () => {
      // Add participant to session
      await prisma.sessionParticipant.create({
        data: {
          sessionId: testSession.id,
          userId: testParticipant.id,
          status: 'CONFIRMED'
        }
      });
    });

    test('should allow host to join meeting', async () => {
      const response = await request(app)
        .get(`/api/meet/join/${testSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authToken).toBeDefined();
      expect(response.body.data.roomId).toBeDefined();
      expect(response.body.data.meetingLink).toBeDefined();
      expect(response.body.data.isHost).toBe(true);
      expect(response.body.data.userInfo.role).toBe('host');
      expect(response.body.data.userInfo.name).toBe('Host User');
    });

    test('should allow participant to join meeting', async () => {
      const response = await request(app)
        .get(`/api/meet/join/${testSession.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authToken).toBeDefined();
      expect(response.body.data.roomId).toBeDefined();
      expect(response.body.data.isHost).toBe(false);
      expect(response.body.data.userInfo.role).toBe('guest');
      expect(response.body.data.userInfo.name).toBe('Participant User');
    });

    test('should fail for unauthorized user', async () => {
      // Create another user not in the session
      const unauthorizedUser = await prisma.user.create({
        data: {
          email: 'unauthorized@meet.com',
          password: 'hashedpassword',
          role: 'USER',
          isActive: true,
          profile: {
            create: {
              firstName: 'Unauthorized',
              lastName: 'User'
            }
          }
        }
      });

      const unauthorizedToken = generateToken({ userId: unauthorizedUser.id });

      const response = await request(app)
        .get(`/api/meet/join/${testSession.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized to join this meeting');

      // Cleanup
      await prisma.userProfile.delete({ where: { userId: unauthorizedUser.id } });
      await prisma.user.delete({ where: { id: unauthorizedUser.id } });
    });

    test('should fail if meeting room not created', async () => {
      // Create session without meeting room
      const sessionWithoutRoom = await prisma.session.create({
        data: {
          title: 'Session Without Room',
          hostId: testHost.id,
          sessionType: 'ONE_ON_ONE',
          status: 'PENDING',
          creditCost: 50,
          scheduledAt: new Date(Date.now() + 3600000),
          duration: 60
        }
      });

      const response = await request(app)
        .get(`/api/meet/join/${sessionWithoutRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Meeting room not created yet');

      // Cleanup
      await prisma.session.delete({ where: { id: sessionWithoutRoom.id } });
    });
  });

  describe('POST /api/meet/start/:sessionId', () => {
    test('should start session for host', async () => {
      const response = await request(app)
        .post(`/api/meet/start/${testSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
      expect(response.body.data.actualStartTime).toBeDefined();

      // Verify session status in database
      const updatedSession = await prisma.session.findUnique({
        where: { id: testSession.id }
      });
      expect(updatedSession.status).toBe('IN_PROGRESS');
      expect(updatedSession.actualStartTime).toBeDefined();
    });

    test('should fail for non-host user', async () => {
      const response = await request(app)
        .post(`/api/meet/start/${testSession.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only session host can start the session');
    });
  });

  describe('POST /api/meet/attendance/:sessionId', () => {
    test('should record participant join', async () => {
      const response = await request(app)
        .post(`/api/meet/attendance/${testSession.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ action: 'join' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Participant joined session');

      // Verify attendance in database
      const participant = await prisma.sessionParticipant.findFirst({
        where: {
          sessionId: testSession.id,
          userId: testParticipant.id
        }
      });
      expect(participant.joinedAt).toBeDefined();
    });

    test('should record participant leave', async () => {
      const response = await request(app)
        .post(`/api/meet/attendance/${testSession.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ action: 'leave' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Participant left session');

      // Verify attendance in database
      const participant = await prisma.sessionParticipant.findFirst({
        where: {
          sessionId: testSession.id,
          userId: testParticipant.id
        }
      });
      expect(participant.leftAt).toBeDefined();
    });

    test('should record host join', async () => {
      const response = await request(app)
        .post(`/api/meet/attendance/${testSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'join' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Host joined session');
    });
  });

  describe('GET /api/meet/stats/:sessionId', () => {
    test('should get session statistics', async () => {
      const response = await request(app)
        .get(`/api/meet/stats/${testSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(testSession.id);
      expect(response.body.data.title).toBe('Test Meeting Session');
      expect(response.body.data.status).toBe('IN_PROGRESS');
      expect(response.body.data.participantCount).toBe(1);
      expect(Array.isArray(response.body.data.participants)).toBe(true);
      expect(response.body.data.participants[0].name).toBe('Participant User');
    });

    test('should fail for invalid session', async () => {
      const response = await request(app)
        .get('/api/meet/stats/invalid-session-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session not found');
    });
  });

  describe('POST /api/meet/end/:sessionId', () => {
    test('should end session for host', async () => {
      const response = await request(app)
        .post(`/api/meet/end/${testSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.actualEndTime).toBeDefined();

      // Verify session status in database
      const updatedSession = await prisma.session.findUnique({
        where: { id: testSession.id }
      });
      expect(updatedSession.actualEndTime).toBeDefined();
    });

    test('should fail for non-host user', async () => {
      const response = await request(app)
        .post(`/api/meet/end/${testSession.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only session host can end the session');
    });
  });

  describe('GET /api/meet/recordings/:sessionId', () => {
    test('should get session recordings', async () => {
      const response = await request(app)
        .get(`/api/meet/recordings/${testSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // Note: In test environment, this might return empty array
    });

    test('should fail for session without meeting room', async () => {
      const sessionWithoutRoom = await prisma.session.create({
        data: {
          title: 'Session Without Room',
          hostId: testHost.id,
          sessionType: 'ONE_ON_ONE',
          status: 'PENDING',
          creditCost: 50,
          scheduledAt: new Date(Date.now() + 3600000),
          duration: 60
        }
      });

      const response = await request(app)
        .get(`/api/meet/recordings/${sessionWithoutRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session or meeting room not found');

      // Cleanup
      await prisma.session.delete({ where: { id: sessionWithoutRoom.id } });
    });
  });
});

// Test environment setup validation
describe('100ms Environment Tests', () => {
  test('should have required 100ms environment variables', () => {
    // In test environment, these might be mock values
    expect(process.env.HMS_ACCESS_KEY).toBeDefined();
    expect(process.env.HMS_SECRET).toBeDefined();
    expect(process.env.HMS_TEMPLATE_ID).toBeDefined();
  });

  test('should initialize 100ms SDK', () => {
    const { SDK } = require('@100mslive/server-sdk');
    const hms = new SDK(
      process.env.HMS_ACCESS_KEY || 'test_access_key',
      process.env.HMS_SECRET || 'test_secret'
    );
    
    expect(hms).toBeDefined();
    expect(hms.rooms).toBeDefined();
    expect(hms.auth).toBeDefined();
    expect(hms.recordings).toBeDefined();
  });

  test('should validate template ID format', () => {
    const templateId = process.env.HMS_TEMPLATE_ID || 'test_template_id';
    expect(typeof templateId).toBe('string');
    expect(templateId.length).toBeGreaterThan(0);
  });
});