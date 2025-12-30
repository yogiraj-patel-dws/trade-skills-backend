const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const prisma = require('../config/database');
const redis = require('../config/redis');
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
          verificationToken: uuidv4(),
          updatedAt: BigInt(Date.now())
        }
      });
      
      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          updatedAt: BigInt(Date.now())
        }
      });
      
      // Create wallet
      await tx.wallet.create({
        data: {
          userId: user.id,
          updatedAt: BigInt(Date.now())
        }
      });
      
      return { user, profile };
    });
    
    // Generate token
    const token = generateToken({ userId: result.user.id, email: result.user.email });
    
    // Store token in Redis (24 hours)
    await redis.set(`auth:${result.user.id}`, {
      token,
      userId: result.user.id,
      email: result.user.email,
      loginAt: Date.now()
    }, 24 * 60 * 60);
    
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        profile: {
          ...result.profile,
          createdAt: Number(result.profile.createdAt),
          updatedAt: Number(result.profile.updatedAt)
        }
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
    
    // Store token in Redis (24 hours)
    await redis.set(`auth:${user.id}`, {
      token,
      userId: user.id,
      email: user.email,
      loginAt: Date.now()
    }, 24 * 60 * 60);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile ? {
          ...user.profile,
          createdAt: Number(user.profile.createdAt),
          updatedAt: Number(user.profile.updatedAt)
        } : null
      },
      token
    };
  }
  
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
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

    if (user && user.profile) {
      user.profile.createdAt = Number(user.profile.createdAt);
      user.profile.updatedAt = Number(user.profile.updatedAt);
    }

    return user;
  }

  async googleLogin(googleData) {
    const { email, name, picture, googleId } = googleData;
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
          include: { profile: true }
        });
      }
    } else {
      // Create new user
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: '', // No password for Google users
            googleId,
            isVerified: true, // Google accounts are pre-verified
            updatedAt: BigInt(Date.now())
          }
        });
        
        const profile = await tx.userProfile.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            profilePicture: picture,
            updatedAt: BigInt(Date.now())
          }
        });
        
        // Create wallet
        await tx.wallet.create({
          data: {
            userId: newUser.id,
            updatedAt: BigInt(Date.now())
          }
        });
        
        return { ...newUser, profile };
      });
      
      user = result;
    }
    
    const token = generateToken({ userId: user.id, email: user.email });
    
    // Store token in Redis (24 hours)
    await redis.set(`auth:${user.id}`, {
      token,
      userId: user.id,
      email: user.email,
      loginAt: Date.now()
    }, 24 * 60 * 60);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile ? {
          ...user.profile,
          createdAt: Number(user.profile.createdAt),
          updatedAt: Number(user.profile.updatedAt)
        } : null
      },
      token
    };
  }

  async logout(userId) {
    // Remove token from Redis
    await redis.del(`auth:${userId}`);
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();