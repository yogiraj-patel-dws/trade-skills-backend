const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trade Skills Backend API',
      version: '1.0.0',
      description: 'Complete API documentation for Trade Skills Platform - A comprehensive skill exchange platform with credit-based economy, session management, and payment integration.',
      contact: {
        name: 'Trade Skills Team',
        email: 'prince@dolphinewebsolution.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://incognizant-yarely-annamaria.ngrok-free.dev',
        description: 'Production Server (Ngrok Tunnel)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      },
      {
        url: 'http://localhost:8000',
        description: 'Production Server (Local)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              description: 'Success status of the request'
            },
            code: {
              type: 'integer',
              description: 'HTTP status code'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              oneOf: [
                { type: 'object' },
                { type: 'array' },
                { type: 'null' }
              ],
              description: 'Response data (object, array, or null)'
            }
          },
          required: ['status', 'code', 'message']
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
            isActive: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            profile: { $ref: '#/components/schemas/UserProfile' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            bio: { type: 'string' },
            profilePicture: { type: 'string' },
            rating: { type: 'number', minimum: 0, maximum: 5 },
            totalReviews: { type: 'integer', minimum: 0 }
          }
        },
        UserSkill: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            skillId: { type: 'string', format: 'uuid' },
            level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
            yearsOfExperience: { type: 'integer', minimum: 0 },
            canTeach: { type: 'boolean' },
            wantsToLearn: { type: 'boolean' },
            skillTitle: { type: 'string', description: 'Custom teaching title' },
            bannerImage: { type: 'string', description: 'Banner image URL' },
            demoVideo: { type: 'string', description: 'Demo video URL' },
            teachingLanguage: { type: 'string', description: 'Teaching languages' },
            prerequisites: { type: 'string', description: 'Prerequisites text' },
            subcategory: { type: 'string', description: 'Skill subcategory' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            skill: { $ref: '#/components/schemas/Skill' }
          }
        },
        MediaUploadResponse: {
          type: 'object',
          properties: {
            bannerImage: { type: 'string', description: 'Uploaded banner image URL' },
            demoVideo: { type: 'string', description: 'Uploaded demo video URL' }
          }
        },
        Skill: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userTeachingSkillId: { type: 'string', format: 'uuid' },
            learnerId: { type: 'string', format: 'uuid' },
            hostId: { type: 'string', format: 'uuid' },
            totalDurationMinutes: { type: 'integer', minimum: 15 },
            totalCredits: { type: 'integer', minimum: 1 },
            hostCredits: { type: 'integer', minimum: 0 },
            adminCredits: { type: 'integer', minimum: 0 },
            learnerStatus: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'JOINED', 'LEFT', 'CANCELLED'] },
            hostStatus: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'JOINED', 'LEFT', 'CANCELLED'] },
            sessionStatus: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            availableCredits: { type: 'integer', minimum: 0 },
            lockedCredits: { type: 'integer', minimum: 0 },
            totalEarned: { type: 'integer', minimum: 0 },
            totalSpent: { type: 'integer', minimum: 0 }
          }
        },
        PaymentPackage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            credits: { type: 'integer', minimum: 1 },
            price: { type: 'number', minimum: 0 },
            currency: { type: 'string', default: 'USD' }
          }
        },
        CreateSessionRequest: {
          type: 'object',
          required: ['userTeachingSkillId', 'learnerId', 'totalDurationMinutes', 'totalCredits', 'hostCredits', 'adminCredits'],
          properties: {
            userTeachingSkillId: { type: 'string', format: 'uuid', description: 'ID of the UserSkill being taught' },
            learnerId: { type: 'string', format: 'uuid', description: 'ID of the user who wants to learn' },
            totalDurationMinutes: { type: 'integer', minimum: 15, maximum: 480, description: 'Session duration in minutes' },
            totalCredits: { type: 'integer', minimum: 1, description: 'Total credits for the session' },
            hostCredits: { type: 'integer', minimum: 0, description: 'Credits going to the host' },
            adminCredits: { type: 'integer', minimum: 0, description: 'Credits going to admin' }
          }
        },
        CreateReportRequest: {
          type: 'object',
          required: ['type', 'reason'],
          properties: {
            type: { type: 'string', enum: ['INAPPROPRIATE_BEHAVIOR', 'SPAM', 'FRAUD', 'TECHNICAL_ISSUE', 'OTHER'] },
            reason: { type: 'string', minLength: 10, maxLength: 100 },
            description: { type: 'string', maxLength: 1000 },
            reportedUserId: { type: 'string', format: 'uuid' },
            sessionId: { type: 'string', format: 'uuid' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Public',
        description: 'Public endpoints (no authentication required)'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User profile and account management'
      },
      {
        name: 'Skills',
        description: 'Skill catalog and discovery'
      },
      {
        name: 'Sessions',
        description: 'Session management and booking'
      },
      {
        name: 'Wallet',
        description: 'Credit wallet and transaction management'
      },
      {
        name: 'Payments',
        description: 'Payment processing and credit purchases'
      },
      {
        name: 'Meet',
        description: 'Video meeting and session management'
      },
      {
        name: 'Notifications',
        description: 'User notifications and alerts'
      },
      {
        name: 'Reports',
        description: 'User reports and dispute management'
      },
      {
        name: 'Reviews',
        description: 'User ratings and reviews'
      },
      {
        name: 'Admin',
        description: 'Administrative functions and platform management'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};