const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRevisions() {
  console.log('🌱 Seeding revision history...');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) { console.error('No admin user found. Run seed.js first.'); return; }

  // Revisions for BV-ASM-001-A (id:1)
  const revs = [
    { partId: 1, revString: 'Rev A', pushedBy: admin.name, changes: 'Initial release. Full Bench Vice structure base-lined.' },
    { partId: 2, revString: 'Rev A', pushedBy: admin.name, changes: 'Initial design for Base. Cast iron poured.' },
    { partId: 3, revString: 'Rev A', pushedBy: admin.name, changes: 'Initial design for Base Plate. Defined 4 mounting holes.' },
    { partId: 4, revString: 'Rev A', pushedBy: admin.name, changes: 'Vice Jaw assembly designed for parallel clamping.' },
    { partId: 5, revString: 'Rev A', pushedBy: admin.name, changes: 'Rubber Bar Gloves specified to protect workpieces.' },
    { partId: 6, revString: 'Rev A', pushedBy: admin.name, changes: 'Jaw Screws tolerance set.' },
    { partId: 7, revString: 'Rev A', pushedBy: admin.name, changes: 'Lead Screw threaded.' },
    { partId: 8, revString: 'Rev A', pushedBy: admin.name, changes: 'Handle Rod specified with 4140 Steel for high stress.' },
    { partId: 9, revString: 'Rev A', pushedBy: admin.name, changes: 'Clamping Plate initial draft.' },
    { partId: 10, revString: 'Rev A', pushedBy: admin.name, changes: 'Fixing screw dimensions tightened due to clearance limits.' },
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
