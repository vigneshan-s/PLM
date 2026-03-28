const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.activityLog.deleteMany();
  await prisma.changeOrder.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.part.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const arun = await prisma.user.create({
    data: { name: 'Arun Kumar', email: 'arun@smartplm.com', passwordHash, role: 'USER', department: 'Mechanical' }
  });
  const priya = await prisma.user.create({
    data: { name: 'Priya Sharma', email: 'priya.admin@smartplm.com', passwordHash, role: 'ADMIN', department: 'Engineering Lead' }
  });

  // Create Parts
  const gearShaft = await prisma.part.create({
    data: {
      partNumber: 'MEC-GS-012', name: 'Main Gear Shaft', type: 'PART', currentRev: 'Rev B',
      status: 'RELEASED', material: 'EN24 Steel', weight: '0.45 kg', cost: '$12.50', ownerId: arun.id
    }
  });

  const gearZ24 = await prisma.part.create({
    data: {
      partNumber: 'PRT-207', name: 'Spur Gear Z24', type: 'PART', currentRev: 'Rev B',
      status: 'REVIEW', material: 'POM Plastic', weight: '0.08 kg', cost: '$1.20', isLocked: true, ownerId: arun.id
    }
  });

  const bearing = await prisma.part.create({
    data: {
      partNumber: 'HW-BB-01', name: 'Ball Bearing', type: 'PART', currentRev: '-',
      status: 'RELEASED', material: 'Chrome Steel', weight: '0.12 kg', cost: '$4.00', ownerId: priya.id
    }
  });

  const gearbox = await prisma.part.create({
    data: {
      partNumber: 'ASM-160', name: 'GEAR-BOX', type: 'ASSEMBLY', currentRev: 'Rev C',
      status: 'REVIEW', ownerId: arun.id
    }
  });

  // Create BOM
  await prisma.bomItem.createMany({
    data: [
      { parentPartId: gearbox.id, childPartId: gearShaft.id, quantity: 1 },
      { parentPartId: gearbox.id, childPartId: gearZ24.id, quantity: 3 },
      { parentPartId: gearbox.id, childPartId: bearing.id, quantity: 4 },
    ]
  });

  // Create Revisions
  await prisma.revision.createMany({
    data: [
      { partId: gearShaft.id, revString: 'Rev A', pushedBy: 'System', changes: 'Initial Release baseline' },
      { partId: gearShaft.id, revString: 'Rev B', pushedBy: 'Arun Kumar', changes: 'Increase wall thickness +2mm' }
    ]
  });

  // Create ECNs
  await prisma.changeOrder.create({
    data: {
      ecnNumber: 'ECN-2045', title: 'Wall thickness +2mm for compliance', description: 'Increase thickness due to FEA reports.',
      priority: 'CRITICAL', status: 'PENDING', targetPartId: gearShaft.id, authorId: arun.id
    }
  });

  await prisma.changeOrder.create({
    data: {
      ecnNumber: 'ECN-2035', title: 'Vibration damper integration', description: 'Mounting update.',
      priority: 'HIGH', status: 'APPROVED', targetPartId: gearbox.id, authorId: priya.id
    }
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
