require('dotenv').config({ path: '.env.test' });

// Mock external services for testing
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123456789',
        amount: 9999,
        currency: 'INR',
        receipt: 'order_test',
        status: 'created'
      })
    },
    payments: {
      refund: jest.fn().mockResolvedValue({
        id: 'rfnd_test123456789',
        amount: 9999,
        currency: 'INR',
        status: 'processed'
      })
    }
  }));
});

jest.mock('@100mslive/server-sdk', () => ({
  SDK: jest.fn().mockImplementation(() => ({
    rooms: {
      create: jest.fn().mockResolvedValue({
        id: 'room_test123456789',
        name: 'test-room',
        enabled: true,
        created_at: new Date().toISOString()
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'room_test123456789',
        name: 'test-room',
        created_at: new Date().toISOString(),
        disabled: false
      }),
      disable: jest.fn().mockResolvedValue({
        id: 'room_test123456789',
        disabled: true
      })
    },
    auth: {
      getAuthToken: jest.fn().mockResolvedValue('test_auth_token_123456789')
    },
    recordings: {
      start: jest.fn().mockResolvedValue({
        id: 'rec_test123456789',
        status: 'started'
      }),
      stop: jest.fn().mockResolvedValue({
        id: 'rec_test123456789',
        status: 'stopped'
      }),
      list: jest.fn().mockResolvedValue([
        {
          id: 'rec_test123456789',
          status: 'completed',
          started_at: new Date().toISOString(),
          stopped_at: new Date().toISOString(),
          duration: 3600,
          size: 1024000,
          location: 'https://test-recordings.s3.amazonaws.com/test.mp4'
        }
      ])
    }
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.RAZORPAY_KEY_ID = 'rzp_test_1234567890';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_key';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.HMS_ACCESS_KEY = 'test_hms_access_key';
process.env.HMS_SECRET = 'test_hms_secret';
process.env.HMS_TEMPLATE_ID = 'test_template_id';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/tradeskills_test';

// Global test setup
beforeAll(async () => {
  // Ensure test database is clean
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('Cleaning up test environment...');
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for database operations
jest.setTimeout(30000);