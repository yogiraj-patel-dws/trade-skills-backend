const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create payment packages
  const packages = [
    {
      name: 'Starter Pack',
      description: 'Perfect for trying out the platform',
      credits: 50,
      price: 9.99,
      currency: 'USD'
    },
    {
      name: 'Learning Pack',
      description: 'Great for regular learners',
      credits: 150,
      price: 24.99,
      currency: 'USD'
    },
    {
      name: 'Pro Pack',
      description: 'Best value for active users',
      credits: 300,
      price: 44.99,
      currency: 'USD'
    },
    {
      name: 'Expert Pack',
      description: 'For power users and teachers',
      credits: 500,
      price: 69.99,
      currency: 'USD'
    }
  ];

  for (const pkg of packages) {
    await prisma.paymentPackage.create({
      data: {
        ...pkg,
        createdAt: BigInt(Date.now())
      }
    });
  }

  console.log('✅ Payment packages created');

  // Create skill categories and skills
  const skills = [
    // Technology
    { name: 'JavaScript Programming', category: 'Technology', description: 'Learn modern JavaScript development' },
    { name: 'Python Programming', category: 'Technology', description: 'Master Python for web and data science' },
    { name: 'React Development', category: 'Technology', description: 'Build modern web applications with React' },
    { name: 'Node.js Backend', category: 'Technology', description: 'Server-side development with Node.js' },
    { name: 'Database Design', category: 'Technology', description: 'SQL and NoSQL database design principles' },
    
    // Design
    { name: 'UI/UX Design', category: 'Design', description: 'User interface and experience design' },
    { name: 'Graphic Design', category: 'Design', description: 'Visual design and branding' },
    { name: 'Web Design', category: 'Design', description: 'Modern web design principles' },
    { name: 'Logo Design', category: 'Design', description: 'Brand identity and logo creation' },
    
    // Business
    { name: 'Digital Marketing', category: 'Business', description: 'Online marketing strategies' },
    { name: 'Content Writing', category: 'Business', description: 'Professional content creation' },
    { name: 'Project Management', category: 'Business', description: 'Agile and traditional project management' },
    { name: 'Business Strategy', category: 'Business', description: 'Strategic planning and execution' },
    
    // Languages
    { name: 'English Conversation', category: 'Languages', description: 'Improve English speaking skills' },
    { name: 'Spanish Learning', category: 'Languages', description: 'Learn Spanish from basics to advanced' },
    { name: 'French Tutoring', category: 'Languages', description: 'French language instruction' },
    
    // Creative
    { name: 'Photography', category: 'Creative', description: 'Digital photography techniques' },
    { name: 'Video Editing', category: 'Creative', description: 'Professional video editing skills' },
    { name: 'Music Production', category: 'Creative', description: 'Digital music creation and production' },
    { name: 'Writing & Storytelling', category: 'Creative', description: 'Creative writing and narrative techniques' }
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        ...skill,
        createdAt: BigInt(Date.now())
      },
      create: {
        ...skill,
        createdAt: BigInt(Date.now())
      }
    });
  }

  console.log('✅ Skills created');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@tradeskills.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@tradeskills.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      updatedAt: BigInt(Date.now()),
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          bio: 'Platform Administrator',
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now())
        }
      },
      wallet: {
        create: {
          availableCredits: 1000,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now())
        }
      }
    }
  });

  console.log('✅ Admin user created');

  // Create sample demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@tradeskills.com' },
    update: {},
    create: {
      email: 'demo@tradeskills.com',
      password: demoPassword,
      role: 'USER',
      isActive: true,
      isVerified: true,
      updatedAt: BigInt(Date.now()),
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'User',
          bio: 'Demo user for testing the platform',
          rating: 4.8,
          totalReviews: 25,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now())
        }
      },
      wallet: {
        create: {
          availableCredits: 100,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now())
        }
      }
    }
  });

  console.log('✅ Demo user created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });