const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trade Skills Backend API',
      version: '1.0.0',
      description: 'API documentation for Trade Skills Platform - Skill exchange with credit-based economy',
      contact: {
        name: 'Trade Skills Team',
        email: 'prince@dolphinewebsolution.com'
      }
    },
    servers: [
      {
        url: 'https://incognizant-yarely-annamaria.ngrok-free.dev',
        description: 'Ngrok tunnel'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              description: 'Success status'
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
              type: 'object',
              description: 'Response data'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            profile: { $ref: '#/components/schemas/UserProfile' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            bio: { type: 'string' },
            rating: { type: 'number' },
            totalReviews: { type: 'integer' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};