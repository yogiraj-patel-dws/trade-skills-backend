const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.secret);
};

module.exports = {
  JWT_CONFIG,
  generateToken,
  verifyToken
};