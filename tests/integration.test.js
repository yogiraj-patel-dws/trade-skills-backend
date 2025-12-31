const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { generateToken } = require('../src/config/jwt');

describe('Integration: Payment + Meet Flow', () => {
  let hostToken;
  let participantToken;
  let testHost;
  let testParticipant;
  let testPackage;
  let testSkill;
  let testSession;

  beforeAll(async () => {
    // Create test payment package
    testPackage = await prisma.paymentPackage.create({
      data: {
        name: 'Integration Test Package',
        description: 'Credits for integration testing',
        credits: 200,
        price: 199.99,
        currency: 'INR',
        isActive: true
      }
    });

    // Create test skill
    testSkill = await prisma.skill.create({
      data: {
        name: 'Integration Test Skill',
        description: 'Skill for integration testing',
        category: 'Technology',
        isActive: true
      }
    });

    // Create host user
    testHost = await prisma.user.create({
      data: {
        email: 'integration.host@test.com',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Integration',
            lastName: 'Host'
          }
        },
        wallet: {
          create: {
            availableCredits: 0,
            lockedCredits: 0
          }
        }
      }
    });

    // Create participant user
    testParticipant = await prisma.user.create({
      data: {
        email: 'integration.participant@test.com',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Integration',
            lastName: 'Participant'
          }
        },
        wallet: {
          create: {
            availableCredits: 0,
            lockedCredits: 0
          }
        }
      }
    });

    hostToken = generateToken({ userId: testHost.id });
    participantToken = generateToken({ userId: testParticipant.id });
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    if (testSession) {
      await prisma.sessionParticipant.deleteMany({ where: { sessionId: testSession.id } });
      await prisma.session.delete({ where: { id: testSession.id } });
    }
    
    await prisma.transaction.deleteMany({ where: { wallet: { userId: testHost.id } } });
    await prisma.transaction.deleteMany({ where: { wallet: { userId: testParticipant.id } } });
    await prisma.payment.deleteMany({ where: { userId: testHost.id } });
    await prisma.payment.deleteMany({ where: { userId: testParticipant.id } });
    await prisma.wallet.delete({ where: { userId: testHost.id } });
    await prisma.wallet.delete({ where: { userId: testParticipant.id } });
    await prisma.userProfile.delete({ where: { userId: testHost.id } });
    await prisma.userProfile.delete({ where: { userId: testParticipant.id } });
    await prisma.user.delete({ where: { id: testHost.id } });
    await prisma.user.delete({ where: { id: testParticipant.id } });
    await prisma.skill.delete({ where: { id: testSkill.id } });
    await prisma.paymentPackage.delete({ where: { id: testPackage.id } });
  });

  describe('Complete Flow: Purchase Credits → Create Session → Meet', () => {
    test('Step 1: Participant purchases credits', async () => {
      // Create payment order
      const orderResponse = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ packageId: testPackage.id })
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      const { payment, razorpayOrder } = orderResponse.body.data;

      // Simulate payment verification
      const crypto = require('crypto');
      const razorpayPaymentId = 'pay_integration_test';
      const body = razorpayOrder.id + '|' + razorpayPaymentId;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const verifyResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: signature
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);

      // Verify credits were added
      const walletResponse = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(walletResponse.body.data.availableCredits).toBe(testPackage.credits);
    });

    test('Step 2: Host creates session', async () => {
      const sessionData = {
        title: 'Integration Test Session',
        description: 'Complete integration test session',
        skillId: testSkill.id,
        sessionType: 'ONE_ON_ONE',
        maxParticipants: 1,
        creditCost: 100,
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        duration: 60
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      testSession = response.body.data;
      expect(testSession.hostId).toBe(testHost.id);
      expect(testSession.status).toBe('PENDING');
    });

    test('Step 3: Participant joins session', async () => {
      const response = await request(app)
        .post(`/api/sessions/${testSession.id}/join`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.status).toBe('CONFIRMED');

      // Verify credits were locked
      const walletResponse = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(walletResponse.body.data.lockedCredits).toBe(100);
      expect(walletResponse.body.data.availableCredits).toBe(100); // 200 - 100 locked
    });

    test('Step 4: Host creates meeting room', async () => {
      const response = await request(app)
        .post('/api/meet/create-room')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ sessionId: testSession.id })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roomId).toBeDefined();
      expect(response.body.data.meetingLink).toBeDefined();
      expect(response.body.data.session.status).toBe('CONFIRMED');
    });

    test('Step 5: Both users join meeting', async () => {
      // Host joins
      const hostJoinResponse = await request(app)
        .get(`/api/meet/join/${testSession.id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(hostJoinResponse.body.success).toBe(true);
      expect(hostJoinResponse.body.data.isHost).toBe(true);
      expect(hostJoinResponse.body.data.authToken).toBeDefined();

      // Participant joins
      const participantJoinResponse = await request(app)
        .get(`/api/meet/join/${testSession.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(participantJoinResponse.body.success).toBe(true);
      expect(participantJoinResponse.body.data.isHost).toBe(false);
      expect(participantJoinResponse.body.data.authToken).toBeDefined();
    });

    test('Step 6: Host starts session', async () => {
      const response = await request(app)
        .post(`/api/meet/start/${testSession.id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
      expect(response.body.data.actualStartTime).toBeDefined();
    });

    test('Step 7: Record attendance', async () => {
      // Participant joins meeting
      const joinResponse = await request(app)
        .post(`/api/meet/attendance/${testSession.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ action: 'join' })
        .expect(200);

      expect(joinResponse.body.success).toBe(true);

      // Get session stats
      const statsResponse = await request(app)
        .get(`/api/meet/stats/${testSession.id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.participantCount).toBe(1);
      expect(statsResponse.body.data.participants[0].joinedAt).toBeDefined();
    });

    test('Step 8: Complete session and release credits', async () => {
      // End meeting
      const endResponse = await request(app)
        .post(`/api/meet/end/${testSession.id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(endResponse.body.success).toBe(true);
      expect(endResponse.body.data.actualEndTime).toBeDefined();

      // Complete session
      const completeResponse = await request(app)
        .post(`/api/sessions/${testSession.id}/complete`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
      expect(completeResponse.body.data.status).toBe('COMPLETED');

      // Verify credits were transferred
      const participantWallet = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      const hostWallet = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(participantWallet.body.data.lockedCredits).toBe(0);
      expect(participantWallet.body.data.availableCredits).toBe(100); // 200 - 100 spent
      expect(hostWallet.body.data.availableCredits).toBe(100); // Earned from session
    });

    test('Step 9: Verify transaction history', async () => {
      // Check participant transactions
      const participantTxResponse = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(participantTxResponse.body.success).toBe(true);
      const participantTx = participantTxResponse.body.data;
      expect(participantTx.length).toBeGreaterThan(0);
      
      // Should have credit purchase and session payment
      const creditPurchase = participantTx.find(tx => tx.type === 'CREDIT_PURCHASE');
      const sessionPayment = participantTx.find(tx => tx.type === 'SESSION_PAYMENT');
      expect(creditPurchase).toBeDefined();
      expect(sessionPayment).toBeDefined();

      // Check host transactions
      const hostTxResponse = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(hostTxResponse.body.success).toBe(true);
      const hostTx = hostTxResponse.body.data;
      
      // Should have session earning
      const sessionEarning = hostTx.find(tx => tx.type === 'SESSION_EARNING');
      expect(sessionEarning).toBeDefined();
      expect(sessionEarning.amount).toBe(100);
    });

    test('Step 10: Check payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const completedPayment = response.body.data.find(p => p.status === 'COMPLETED');
      expect(completedPayment).toBeDefined();
      expect(completedPayment.creditsAwarded).toBe(testPackage.credits);
    });
  });

  describe('Error Scenarios', () => {
    test('Should handle insufficient credits gracefully', async () => {
      // Create user with no credits
      const poorUser = await prisma.user.create({
        data: {
          email: 'poor@test.com',
          password: 'hashedpassword',
          role: 'USER',
          isActive: true,
          profile: {
            create: {
              firstName: 'Poor',
              lastName: 'User'
            }
          },
          wallet: {
            create: {
              availableCredits: 10, // Not enough for session
              lockedCredits: 0
            }
          }
        }
      });

      const poorToken = generateToken({ userId: poorUser.id });

      // Try to join expensive session
      const expensiveSession = await prisma.session.create({
        data: {
          title: 'Expensive Session',
          hostId: testHost.id,
          sessionType: 'ONE_ON_ONE',
          status: 'PENDING',
          creditCost: 500, // More than user has
          scheduledAt: new Date(Date.now() + 3600000),
          duration: 60
        }
      });

      const response = await request(app)
        .post(`/api/sessions/${expensiveSession.id}/join`)
        .set('Authorization', `Bearer ${poorToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient credits');

      // Cleanup
      await prisma.session.delete({ where: { id: expensiveSession.id } });
      await prisma.wallet.delete({ where: { userId: poorUser.id } });
      await prisma.userProfile.delete({ where: { userId: poorUser.id } });
      await prisma.user.delete({ where: { id: poorUser.id } });
    });

    test('Should handle meeting room creation failure', async () => {
      // Create session
      const failSession = await prisma.session.create({
        data: {
          title: 'Fail Session',
          hostId: testHost.id,
          sessionType: 'ONE_ON_ONE',
          status: 'PENDING',
          creditCost: 50,
          scheduledAt: new Date(Date.now() + 3600000),
          duration: 60
        }
      });

      // Mock 100ms failure
      const originalCreate = require('@100mslive/server-sdk').SDK.prototype.rooms.create;
      require('@100mslive/server-sdk').SDK.prototype.rooms.create = jest.fn()
        .mockRejectedValue(new Error('100ms service unavailable'));

      const response = await request(app)
        .post('/api/meet/create-room')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ sessionId: failSession.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to create meeting room');

      // Restore mock
      require('@100mslive/server-sdk').SDK.prototype.rooms.create = originalCreate;

      // Cleanup
      await prisma.session.delete({ where: { id: failSession.id } });
    });
  });
});