const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRevisions() {
  console.log('🌱 Seeding revision history...');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) { console.error('No admin user found. Run seed.js first.'); return; }

  // Revisions for ASM-001 (id:1) - Main Chassis Assembly
  const revs = [
    { partId: 1, revString: 'Rev A', pushedBy: admin.name, changes: 'Initial release. Base material set to Aluminium 6061-T6. Wall thickness 4mm.' },
    { partId: 2, revString: 'Rev A', pushedBy: admin.name, changes: 'Initial design. Drive shaft diameter 32mm, length 480mm.' },
    { partId: 2, revString: 'Rev B', pushedBy: admin.name, changes: 'Increased shaft diameter to 35mm to handle higher torque loads. Surface finish Ra 0.8.' },
    { partId: 3, revString: 'Rev A', pushedBy: admin.name, changes: 'Bearing housing initial release. Cast Iron grade GG25. Bore tolerance H7.' },
    { partId: 4, revString: 'Rev A', pushedBy: admin.name, changes: 'PCB first spin. 4-layer FR4, 1oz copper. MCU: STM32F407.' },
    { partId: 4, revString: 'Rev B', pushedBy: admin.name, changes: 'Added bypass capacitors on VDD rails. Fixed silkscreen errors on J3 connector.' },
    { partId: 4, revString: 'Rev C', pushedBy: admin.name, changes: 'Migrated to STM32H743 for higher compute. Expanded flash to 2MB. Updated BOM.' },
    { partId: 5, revString: 'Rev A', pushedBy: admin.name, changes: 'Cooling module initial draft. Aluminium extrusion baseplate 120x80mm.' },
    { partId: 6, revString: 'Rev A', pushedBy: admin.name, changes: 'Heat sink fin design. 24 fins, 2mm pitch, 30mm height. Thermal resistance 0.8 C/W.' },
    { partId: 7, revString: 'Rev A', pushedBy: admin.name, changes: 'Fan unit 80x80x25mm, 2000 RPM, dual ball bearing.' },
    { partId: 7, revString: 'Rev B', pushedBy: admin.name, changes: 'Upgraded to PWM-controlled fan. Added tachometer feedback wire.' },
    { partId: 10, revString: 'Rev A', pushedBy: admin.name, changes: 'Sensor array initial layout. IMU + LIDAR + Ultrasonic grouped on common I2C bus.' },
    { partId: 10, revString: 'Rev B', pushedBy: admin.name, changes: 'Isolated LIDAR on separate SPI bus to reduce latency. Added ESD protection.' },
  ];

  for (const rev of revs) {
    try {
      await prisma.revision.upsert({
        where: { partId_revString: { partId: rev.partId, revString: rev.revString } },
        update: {},
        create: rev,
      });
      console.log(`  ✅ Part ${rev.partId} ${rev.revString}`);
    } catch (e) {
      console.log(`  ⚠️  Skipped Part ${rev.partId} ${rev.revString}: ${e.message}`);
    }
  }

  // Seed activity logs for revision-related events
  const parts = await prisma.part.findMany({ select: { id: true, partNumber: true } });
  for (const part of parts.slice(0, 5)) {
    await prisma.activityLog.create({
      data: { userId: admin.id, action: `Released ${part.partNumber} to production`, entityType: 'Part', entityId: part.id }
    });
  }

  console.log('\n🎉 Revisions seeded!');
}

seedRevisions().catch(console.error).finally(() => prisma.$disconnect());
