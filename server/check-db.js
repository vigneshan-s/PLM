const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.part.findMany({ select: { id: true, partNumber: true, name: true, type: true } });
  const boms = await prisma.bomItem.findMany();
  console.log('PARTS:', JSON.stringify(parts, null, 2));
  console.log('\nBOM ITEMS count:', boms.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
