import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const octLogs = await prisma.wasteLog.findMany({
    where: {
      recordedAt: {
        gte: new Date('2026-10-01T00:00:00Z'),
        lt: new Date('2026-11-01T00:00:00Z')
      }
    },
    select: {
      id: true,
      beratKg: true,
      recordedAt: true,
      timbangQrSync: { select: { ticketNumber: true } }
    }
  });

  console.log(`Total October 2026 logs in LPS DB: ${octLogs.length}`);
  const totalKg = octLogs.reduce((sum, l) => sum + Number(l.beratKg), 0);
  console.log(`Total October 2026 Kg in LPS DB: ${totalKg.toLocaleString('id-ID')} kg`);

  await prisma.$disconnect();
}

main().catch(console.error);
