import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const startOfMonth = new Date(2026, 9, 1);
  const endOfMonth = new Date(2026, 10, 1);

  const logs = await prisma.wasteLog.findMany({
    where: { recordedAt: { gte: startOfMonth, lt: endOfMonth } },
    include: { timbangQrSync: true, user: true },
    orderBy: { recordedAt: 'asc' }
  });

  console.log(`Month logs count: ${logs.length}`);
  const nonHj = logs.filter(l => l.user?.transdepo !== 'HARAPAN_JAYA');
  if (nonHj.length > 0) {
    console.log(`Non-Harapan Jaya count: ${nonHj.length}`);
  }
  logs.forEach(l => {
    if (!l.timbangQrSync) {
      console.log('Log without timbangQrSync:', l);
    }
  });

  const tickets = logs.map(l => l.timbangQrSync?.ticketNumber).filter(Boolean);
  console.log(`Total tickets: ${tickets.length}`);

  // Tickets on or before Oct 10:
  logs.filter(l => l.recordedAt < new Date('2026-10-12T00:00:00+07:00')).forEach(l => {
    console.log('Before Oct 12:', l.timbangQrSync?.ticketNumber, l.recordedAt.toISOString(), Number(l.beratKg));
  });

  await prisma.$disconnect();
}

main().catch(console.error);
