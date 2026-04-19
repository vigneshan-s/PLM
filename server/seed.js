const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user
  const passwordHash = await bcrypt.hash('123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      name: 'Super Admin',
      email: 'admin@gmail.com',
      passwordHash,
      role: 'ADMIN',
      department: 'System Architecture',
    },
  });
  console.log(`✅ Admin user: ${admin.email} / password: 123`);

  // 2. Seed sample parts
  const parts = [
    { partNumber: 'ASM-001', name: 'Main Chassis Assembly',   type: 'ASSEMBLY', currentRev: 'Rev A', status: 'RELEASED',  material: 'Aluminium 6061', weight: '12.4 kg', cost: '$340' },
    { partNumber: 'PRT-010', name: 'Drive Shaft',             type: 'PART',     currentRev: 'Rev B', status: 'RELEASED',  material: 'Steel 4140',     weight: '1.8 kg',  cost: '$85'  },
    { partNumber: 'PRT-011', name: 'Bearing Housing',         type: 'PART',     currentRev: 'Rev A', status: 'REVIEW',    material: 'Cast Iron',      weight: '0.9 kg',  cost: '$42'  },
    { partNumber: 'PRT-012', name: 'Control PCB',             type: 'PART',     currentRev: 'Rev C', status: 'RELEASED',  material: 'FR4',            weight: '0.1 kg',  cost: '$120' },
    { partNumber: 'ASM-002', name: 'Cooling Module Assembly', type: 'ASSEMBLY', currentRev: 'Rev A', status: 'DRAFT',     material: 'Copper/Al',      weight: '3.2 kg',  cost: '$210' },
    { partNumber: 'PRT-020', name: 'Heat Sink',               type: 'PART',     currentRev: 'Rev A', status: 'RELEASED',  material: 'Aluminium 1060', weight: '0.6 kg',  cost: '$28'  },
    { partNumber: 'PRT-021', name: 'Fan Unit 80mm',           type: 'PART',     currentRev: 'Rev B', status: 'RELEASED',  material: 'ABS/Copper',     weight: '0.2 kg',  cost: '$15'  },
    { partNumber: 'PRT-030', name: 'Power Supply Unit',       type: 'PART',     currentRev: 'Rev D', status: 'RELEASED',  material: 'Steel/PCB',      weight: '1.1 kg',  cost: '$95'  },
    { partNumber: 'PRT-031', name: 'Battery Pack 48V',        type: 'PART',     currentRev: 'Rev A', status: 'REVIEW',    material: 'Li-Ion',         weight: '4.5 kg',  cost: '$450' },
    { partNumber: 'ASM-003', name: 'Sensor Array Module',     type: 'ASSEMBLY', currentRev: 'Rev B', status: 'DRAFT',     material: 'Mixed',          weight: '0.8 kg',  cost: '$310' },
  ];

  for (const part of parts) {
    await prisma.part.upsert({
      where: { partNumber: part.partNumber },
      update: {},
      create: { ...part, ownerId: admin.id },
    });
  }
  console.log(`✅ Seeded ${parts.length} parts`);

  console.log('\n🎉 Done! You can now log in and use the app.');
  console.log('   Email:    admin@gmail.com');
  console.log('   Password: 123');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
