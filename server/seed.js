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
    { partNumber: 'BV-ASM-001-A', name: 'Bench Vice Assembly', type: 'ASSEMBLY', currentRev: 'Rev A', status: 'RELEASED', material: 'Cast Iron/Steel', weight: '8.5 kg', cost: '$120' },
    { partNumber: 'BV-BAS-001-A', name: 'Base',                type: 'PART',     currentRev: 'Rev A', status: 'RELEASED', material: 'Cast Iron',     weight: '4.2 kg', cost: '$45'  },
    { partNumber: 'BV-BPL-001-A', name: 'Base Plate',          type: 'PART',     currentRev: 'Rev A', status: 'RELEASED', material: 'Cast Iron',     weight: '1.1 kg', cost: '$15'  },
    { partNumber: 'BV-JAW-001-A', name: 'Vice Jaw',            type: 'ASSEMBLY', currentRev: 'Rev A', status: 'RELEASED', material: 'Mixed',         weight: '2.1 kg', cost: '$35'  },
    { partNumber: 'BV-JAW-002-A', name: 'Bar Gloves',          type: 'PART',     currentRev: 'Rev A', status: 'RELEASED', material: 'Rubber',        weight: '0.1 kg', cost: '$5'   },
    { partNumber: 'BV-JSC-001-A', name: 'Jaw Screw',           type: 'PART',     currentRev: 'Rev A', status: 'RELEASED', material: 'Steel 4140',    weight: '0.3 kg', cost: '$10'  },
    { partNumber: 'BV-SCR-001-A', name: 'Lead Screw',          type: 'ASSEMBLY', currentRev: 'Rev A', status: 'RELEASED', material: 'Steel 4140',    weight: '0.6 kg', cost: '$18'  },
    { partNumber: 'BV-HND-001-A', name: 'Handle Rod',          type: 'PART',     currentRev: 'Rev A', status: 'RELEASED', material: 'Steel 4140',    weight: '0.4 kg', cost: '$12'  },
    { partNumber: 'BV-CLP-001-A', name: 'Clamping Plate',      type: 'PART',     currentRev: 'Rev A', status: 'RELEASED', material: 'Cast Iron',     weight: '0.5 kg', cost: '$8'   },
    { partNumber: 'BV-FST-001-A', name: 'Fixing Screw',        type: 'PART',     currentRev: 'Rev A', status: 'RELEASED', material: 'Stainless',     weight: '0.1 kg', cost: '$2'   },
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
