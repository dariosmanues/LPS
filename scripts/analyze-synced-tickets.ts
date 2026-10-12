import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const logs = await prisma.wasteLog.findMany({
    where: {
      recordedAt: { gte: today, lt: tomorrow }
    },
    include: {
      timbangQrSync: true,
      armada: true
    },
    orderBy: { recordedAt: 'asc' }
  });

  console.log(`=== ${logs.length} TODAY LOGS IN LPS DB ===`);
  const ticketNumbers = logs.map(l => l.timbangQrSync?.ticketNumber).filter(Boolean);
  console.log('Total tickets synced from TimbangQR:', ticketNumbers.length);
  console.log('First ticket:', ticketNumbers[0], 'recordedAt:', logs[0]?.recordedAt.toISOString());
  console.log('Last ticket:', ticketNumbers[ticketNumbers.length - 1], 'recordedAt:', logs[logs.length - 1]?.recordedAt.toISOString());

  // Also check logs NOT in today range that have timbangQrSync
  const allSynced = await prisma.timbangQrSync.findMany({
    include: {
      wasteLog: true
    },
    orderBy: { receivedAt: 'desc' }
  });
  console.log('\nTotal all timbangQrSync records in LPS DB:', allSynced.length);

  const allTickets = allSynced.map(s => s.ticketNumber);
  console.log('Ticket range in LPS:', allTickets[allTickets.length - 1], 'to', allTickets[0]);

  await prisma.$disconnect();
}

main().catch(console.error);
