const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { generateToken } = require('../src/config/jwt');

describe('Payment Flow Tests', () => {
  let authToken;
  let testUser;
  let testPackage;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@payment.com',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'User'
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

    // Create test payment package
    testPackage = await prisma.paymentPackage.create({
      data: {
        name: 'Test Package',
        description: 'Test credits package',
        credits: 100,
        price: 99.99,
        currency: 'INR',
        isActive: true
      }
    });

    authToken = generateToken({ userId: testUser.id });
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { userId: testUser.id } });
    await prisma.transaction.deleteMany({ where: { wallet: { userId: testUser.id } } });
    await prisma.wallet.delete({ where: { userId: testUser.id } });
    await prisma.userProfile.delete({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.paymentPackage.delete({ where: { id: testPackage.id } });
  });

  describe('GET /api/payments/packages', () => {
    test('should get payment packages', async () => {
      const response = await request(app)
        .get('/api/payments/packages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const pkg = response.body.data.find(p => p.id === testPackage.id);
      expect(pkg).toBeDefined();
      expect(pkg.name).toBe('Test Package');
      expect(pkg.credits).toBe(100);
      expect(pkg.price).toBe(99.99);
    });
  });

  describe('POST /api/payments/create-order', () => {
    test('should create payment order with valid package', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ packageId: testPackage.id })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.razorpayOrder).toBeDefined();
      expect(response.body.data.package).toBeDefined();
      
      const payment = response.body.data.payment;
      expect(payment.userId).toBe(testUser.id);
      expect(payment.packageId).toBe(testPackage.id);
      expect(payment.status).toBe('PENDING');
      expect(payment.gateway).toBe('RAZORPAY');
    });

    test('should fail with invalid package', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ packageId: 'invalid-package-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Payment package not found');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({ packageId: testPackage.id })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/verify', () => {
    let testPayment;
    let razorpayOrderId;

    beforeEach(async () => {
      // Create a test payment order first
      const orderResponse = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ packageId: testPackage.id });

      testPayment = orderResponse.body.data.payment;
      razorpayOrderId = orderResponse.body.data.razorpayOrder.id;
    });

    test('should verify payment with valid signature', async () => {
      const crypto = require('crypto');
      const razorpayPaymentId = 'pay_test123456789';
      
      // Generate valid signature
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
        .update(body.toString())
        .digest('hex');

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: signature
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.gatewayPaymentId).toBe(razorpayPaymentId);

      // Check if credits were added to wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: testUser.id }
      });
      expect(wallet.availableCredits).toBe(testPackage.credits);
    });

    test('should fail with invalid signature', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: 'pay_test123456789',
          razorpay_signature: 'invalid_signature'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid payment signature');
    });
  });

  describe('GET /api/payments/history', () => {
    test('should get payment history for authenticated user', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should contain payments for this user
      const userPayments = response.body.data.filter(p => p.userId === testUser.id);
      expect(userPayments.length).toBeGreaterThan(0);
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/payments/history?status=PENDING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(payment => {
        expect(payment.status).toBe('PENDING');
      });
    });
  });

  describe('POST /api/payments/webhook', () => {
    test('should process webhook with valid signature', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook123',
              order_id: 'order_webhook123',
              status: 'captured'
            }
          }
        }
      };

      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret')
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.processed).toBe(true);
    });

    test('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {}
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature')
        .send(webhookPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

// Test environment setup validation
describe('Payment Environment Tests', () => {
  test('should have required Razorpay environment variables', () => {
    // In test environment, these might be mock values
    expect(process.env.RAZORPAY_KEY_ID).toBeDefined();
    expect(process.env.RAZORPAY_KEY_SECRET).toBeDefined();
  });

  test('should initialize Razorpay client', () => {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
    });
    
    expect(razorpay).toBeDefined();
    expect(razorpay.orders).toBeDefined();
    expect(razorpay.payments).toBeDefined();
  });
});