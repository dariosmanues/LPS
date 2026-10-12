import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const armada = await prisma.armada.findFirst({
    where: { platNomor: 'BM 8716 QK' }
  });
  if (!armada) throw new Error('Armada not found');

  const existingSync = await prisma.timbangQrSync.findUnique({
    where: { ticketNumber: 'INV/26/10075' }
  });

  if (!existingSync) {
    const integrationUser = await prisma.user.upsert({
      where: { email: 'integration@timbangqr.local' },
      update: { transdepo: 'HARAPAN_JAYA', name: 'Integrasi TimbangQR' },
      create: {
        email: 'integration@timbangqr.local',
        passwordHash: 'INTEGRATION_ONLY_NO_LOGIN',
        name: 'Integrasi TimbangQR',
        role: 'SYSTEM_INTEGRATION',
        transdepo: 'HARAPAN_JAYA'
      }
    });

    const metadata = JSON.stringify({
      source: 'TimbangQR',
      ticketNumber: 'INV/26/10075',
      grossKg: 2480,
      tareKg: 1280,
      rafaksiKg: 0,
      driverName: 'JALIUS',
      vehicleType: 'PICKUP',
      wasteType: 'SAMPAH RUMAH TANGGA',
      indicatorRaw: 'OCR_LED:CONFIRMED:2480'
    });

    const recordedAt = new Date('2026-10-12T07:32:00.000Z');

    const result = await prisma.$transaction(async (tx) => {
      const wasteLog = await tx.wasteLog.create({
        data: {
          armadaId: armada.id,
          kelurahanId: armada.kelurahanId,
          recordedBy: integrationUser.id,
          beratKg: 1200,
          status: 'MASUK',
          recordedAt,
          metadata
        }
      });

      const sync = await tx.timbangQrSync.create({
        data: {
          ticketNumber: 'INV/26/10075',
          plateNumber: 'BM 8716 QK',
          lpsName: 'LPS SUMAHILANG',
          transdepo: 'HARAPAN_JAYA',
          grossKg: 2480,
          tareKg: 1280,
          rafaksiKg: 0,
          nettoKg: 1200,
          weighedAt: recordedAt,
          wasteLogId: wasteLog.id,
          payload: JSON.stringify({
            ticketNumber: 'INV/26/10075',
            plateNumber: 'BM 8716 QK',
            driverName: 'JALIUS',
            lpsName: 'LPS SUMAHILANG',
            transdepo: 'HARAPAN_JAYA',
            grossKg: 2480,
            tareKg: 1280,
            nettoKg: 1200,
            weighedAt: recordedAt.toISOString()
          })
        }
      });

      return { wasteLog, sync };
    });

    console.log('✅ Tiket INV/26/10075 berhasil disinkronkan ke LPS DB:', {
      wasteLogId: result.wasteLog.id,
      ticketNumber: result.sync.ticketNumber,
      beratKg: result.wasteLog.beratKg
    });
  } else {
    console.log('Tiket INV/26/10075 sudah ada di LPS DB.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
