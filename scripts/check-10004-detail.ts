import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sync = await prisma.timbangQrSync.findUnique({
    where: { ticketNumber: 'INV/26/10004' },
    include: { wasteLog: true }
  });
  console.log('INV/26/10004 in LPS DB:', sync);
  await prisma.$disconnect();
}

main().catch(console.error);
