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
            isVerified: true // Google accounts are pre-verified
          }
        });
        
        const profile = await tx.userProfile.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            profilePicture: picture
          }
        });
        
        // Create wallet
        await tx.wallet.create({
          data: {
            userId: newUser.id
          }
        });
        
        return { ...newUser, profile };
      });
      
      user = result;
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
}

module.exports = new AuthService();