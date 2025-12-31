const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('Admin123!@#', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tradeskills.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      updatedAt: BigInt(Date.now())
    }
  });
  
  await prisma.userProfile.create({
    data: {
      userId: admin.id,
      firstName: 'Admin',
      lastName: 'User',
      updatedAt: BigInt(Date.now())
    }
  });
  
  await prisma.wallet.create({
    data: {
      userId: admin.id,
      availableCredits: 1000,
      updatedAt: BigInt(Date.now())
    }
  });
  
  console.log('✅ Admin created');
  await prisma.$disconnect();
}

createAdmin();