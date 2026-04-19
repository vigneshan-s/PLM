const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBom() {
  console.log('🌱 Seeding BOM structure...');

  // BOM Structure:
  // ASM-001 (Main Chassis Assembly) [id:1]
  //   ├── PRT-010  Drive Shaft         [id:2]  qty:1
  //   ├── PRT-011  Bearing Housing     [id:3]  qty:4
  //   ├── PRT-012  Control PCB         [id:4]  qty:1
  //   └── ASM-002  Cooling Module      [id:5]  qty:1
  //         ├── PRT-020  Heat Sink     [id:6]  qty:2
  //         └── PRT-021  Fan Unit 80mm [id:7]  qty:1
  //
  // ASM-003 (Sensor Array Module) [id:10]
  //   ├── PRT-030  Power Supply Unit   [id:8]  qty:1
  //   └── PRT-031  Battery Pack 48V   [id:9]  qty:1

  const boms = [
    { parentPartId: 1, childPartId: 2, quantity: 1 },  // ASM-001 → Drive Shaft
    { parentPartId: 1, childPartId: 3, quantity: 4 },  // ASM-001 → Bearing Housing x4
    { parentPartId: 1, childPartId: 4, quantity: 1 },  // ASM-001 → Control PCB
    { parentPartId: 1, childPartId: 5, quantity: 1 },  // ASM-001 → Cooling Module
    { parentPartId: 5, childPartId: 6, quantity: 2 },  // Cooling Module → Heat Sink x2
    { parentPartId: 5, childPartId: 7, quantity: 1 },  // Cooling Module → Fan Unit
    { parentPartId: 10, childPartId: 8, quantity: 1 }, // ASM-003 → Power Supply
    { parentPartId: 10, childPartId: 9, quantity: 1 }, // ASM-003 → Battery Pack
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
