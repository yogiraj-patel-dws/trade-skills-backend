const { verifyToken } = require('../config/jwt');
const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');

// Authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(ApiResponse.error('Access token required', 401));
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json(ApiResponse.error('Invalid or inactive user', 401));
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(ApiResponse.error('Token expired', 401));
    }
    
    return res.status(401).json(ApiResponse.error('Invalid token', 401));
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(ApiResponse.error('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(ApiResponse.error('Insufficient permissions', 403));
    }
    
    next();
  };
};

// Optional authentication
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true
        }
      });
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};