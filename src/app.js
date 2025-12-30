const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ApiResponse = require('./utils/ApiResponse');
const { swaggerUi, specs } = require('./config/swagger');
require('dotenv').config();

const app = express();

// Trust proxy for production deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());

// CORS configuration based on environment
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    return ['https://incognizant-yarely-annamaria.ngrok-free.dev', 'https://tradeskills.vercel.app'];
  }
  
  const frontendUrls = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [];
  return ['http://localhost:3000', 'http://localhost:5174', 'http://localhost:3001', ...frontendUrls];
};

const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: ApiResponse.error('Too many requests from this IP, please try again later.', 429)
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json(ApiResponse.success({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }, 'Server is healthy', 200));
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// API Routes
app.use('/api/public', require('./routes/public'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/meet', require('./routes/meet'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json(ApiResponse.error('Validation Error', 400, err.details));
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(ApiResponse.error('Unauthorized', 401));
  }
  
  res.status(500).json(ApiResponse.error('Internal Server Error', 500));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(ApiResponse.error('Route not found', 404));
});

const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 8000 : 3000);

const server = app.listen(PORT, () => {
  console.log(`🚀 Trade Skills Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;