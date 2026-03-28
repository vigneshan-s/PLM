const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'admin@gmail.com';
  const plainPassword = '123';
  
  try {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    
    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Update password just in case
      await prisma.user.update({
        where: { email },
        data: { passwordHash, role: 'ADMIN' }
      });
      console.log('Super Admin updated successfully.');
    } else {
      // Create new
      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email,
          passwordHash,
          role: 'ADMIN',
          department: 'System Architecture'
        }
      });
      console.log('Super Admin created successfully.');
    }
  } catch (e) {
    console.error('Failed to create admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
