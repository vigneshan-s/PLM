const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBom() {
  console.log('🌱 Seeding BOM structure...');

  // BOM Structure:
  // BV-ASM-001-A (Bench Vice Assembly) [id:1]
  //   ├── BV-BAS-001-A Base             [id:2] qty:1
  //   ├── BV-BPL-001-A Base Plate       [id:3] qty:1
  //   ├── BV-JAW-001-A Vice Jaw         [id:4] qty:1
  //   │   ├── BV-JAW-002-A Bar Gloves   [id:5] qty:2
  //   │   └── BV-JSC-001-A Jaw Screw    [id:6] qty:2
  //   ├── BV-SCR-001-A Lead Screw       [id:7] qty:1
  //   │   └── BV-HND-001-A Handle Rod   [id:8] qty:1
  //   ├── BV-CLP-001-A Clamping Plate   [id:9] qty:1
  //   └── BV-FST-001-A Fixing Screw     [id:10] qty:4

  const boms = [
    { parentPartId: 1, childPartId: 2, quantity: 1 }, 
    { parentPartId: 1, childPartId: 3, quantity: 1 }, 
    { parentPartId: 1, childPartId: 4, quantity: 1 }, 
    { parentPartId: 4, childPartId: 5, quantity: 2 }, 
    { parentPartId: 4, childPartId: 6, quantity: 2 }, 
    { parentPartId: 1, childPartId: 7, quantity: 1 }, 
    { parentPartId: 7, childPartId: 8, quantity: 1 }, 
    { parentPartId: 1, childPartId: 9, quantity: 1 }, 
    { parentPartId: 1, childPartId: 10, quantity: 4 },
  ];

  for (const bom of boms) {
    await prisma.bomItem.upsert({
      where: { parentPartId_childPartId: { parentPartId: bom.parentPartId, childPartId: bom.childPartId } },
      update: { quantity: bom.quantity },
      create: bom,
    });
    console.log(`  ✅ Linked part ${bom.parentPartId} → ${bom.childPartId} (qty: ${bom.quantity})`);
  }

  console.log('\n🎉 BOM structure seeded! The Assembly Tree is now populated.');
}

seedBom().catch(console.error).finally(() => prisma.$disconnect());
