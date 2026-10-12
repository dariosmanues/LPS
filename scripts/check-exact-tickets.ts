import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const syncs = await prisma.timbangQrSync.findMany({
    select: {
      ticketNumber: true,
      wasteLogId: true,
      wasteLog: {
        select: {
          recordedAt: true,
          beratKg: true,
          armada: {
            select: { platNomor: true, namaLps: true }
          }
        }
      }
    }
  });

  console.log(`Total timbangQrSync records in LPS DB: ${syncs.length}`);
  const tickets = syncs.map(s => s.ticketNumber).sort();
  console.log('Tickets in LPS DB:', tickets);

  const checkTargets = ['INV/26/10005', 'INV/26/10006', 'INV/26/10007', 'INV/26/10008', 'INV/26/10009', 'INV/26/10010'];
  for (const t of checkTargets) {
    const found = syncs.find(s => s.ticketNumber === t);
    console.log(`${t}:`, found ? `ADA di LPS DB (recordedAt: ${found.wasteLog?.recordedAt.toISOString()}, kg: ${found.wasteLog?.beratKg})` : 'TIDAK ADA di LPS DB');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
