const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const prisma = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  async register(userData) {
    const { email, password, firstName, lastName } = userData;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    
    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          verificationToken: uuidv4()
        }
      });
      
      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName
        }
      });
      
      // Create wallet
      await tx.wallet.create({
        data: {
          userId: user.id
        }
      });
      
      return { user, profile };
    });
    
    // Generate token
    const token = generateToken({ userId: result.user.id, email: result.user.email });
    
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        profile: result.profile
      },
      token
    };
  }
  
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    });
    
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    const token = generateToken({ userId: user.id, email: user.email });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      token
    };
  }
  
  async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        profile: true
      }
    });
  }
}

module.exports = new AuthService();