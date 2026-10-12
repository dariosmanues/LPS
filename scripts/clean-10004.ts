import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sync = await prisma.timbangQrSync.findUnique({
    where: { ticketNumber: 'INV/26/10004' },
    include: { wasteLog: true }
  });

  if (sync) {
    console.log('Deleting obsolete/voided ticket INV/26/10004 from LPS DB...');
    await prisma.$transaction([
      prisma.timbangQrSync.delete({ where: { ticketNumber: 'INV/26/10004' } }),
      prisma.wasteLog.delete({ where: { id: sync.wasteLogId! } })
    ]);
    console.log('✅ INV/26/10004 deleted.');
  } else {
    console.log('INV/26/10004 already not in DB.');
  }

  // Re-verify October 2026 in LPS DB
  const octLogs = await prisma.wasteLog.findMany({
    where: {
      recordedAt: {
        gte: new Date('2026-10-01T00:00:00Z'),
        lt: new Date('2026-11-01T00:00:00Z')
      }
    }
  });

  console.log(`\nVerified LPS DB Oct 2026: ${octLogs.length} logs`);
  const totalKg = octLogs.reduce((s, l) => s + Number(l.beratKg), 0);
  console.log(`Verified LPS DB Oct 2026 Total Kg: ${totalKg.toLocaleString('id-ID')} kg`);

  await prisma.$disconnect();
}

main().catch(console.error);
