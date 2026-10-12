import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECK ALL PESISIR IN LPS DB ===');
  const pesisirArmadas = await prisma.armada.findMany({
    where: {
      OR: [
        { kelurahan: { nama: { contains: 'Pesisir', mode: 'insensitive' } } },
        { namaLps: { contains: 'Pesisir', mode: 'insensitive' } },
        { noIzinOperasi: { contains: '16/DLHK', mode: 'insensitive' } },
        { wilayahKerja: { contains: 'Pesisir', mode: 'insensitive' } }
      ]
    },
    include: {
      kelurahan: { include: { kecamatan: true } },
      wasteLogs: true
    }
  });
  console.log('Total Pesisir armadas:', pesisirArmadas.length);
  pesisirArmadas.forEach(a => console.log({
    id: a.id,
    platNomor: a.platNomor,
    namaLps: a.namaLps,
    kelurahan: a.kelurahan?.nama,
    noIzinOperasi: a.noIzinOperasi,
    nomorSkLps: a.nomorSkLps,
    wilayahKerja: a.wilayahKerja,
    qrCode: a.qrCode,
    wasteLogsCount: a.wasteLogs.length
  }));

  console.log('\n=== CHECK ALL RINTIS IN LPS DB ===');
  const rintisArmadas = await prisma.armada.findMany({
    where: {
      OR: [
        { kelurahan: { nama: { contains: 'Rintis', mode: 'insensitive' } } },
        { namaLps: { contains: 'Rintis', mode: 'insensitive' } }
      ]
    },
    include: {
      kelurahan: { include: { kecamatan: true } },
      wasteLogs: true
    }
  });
  console.log('Total Rintis armadas:', rintisArmadas.length);
  rintisArmadas.forEach(a => console.log({
    id: a.id,
    platNomor: a.platNomor,
    namaLps: a.namaLps,
    kelurahan: a.kelurahan?.nama,
    noIzinOperasi: a.noIzinOperasi,
    nomorSkLps: a.nomorSkLps,
    wilayahKerja: a.wilayahKerja,
    qrCode: a.qrCode,
    wasteLogsCount: a.wasteLogs.length
  }));

  await prisma.$disconnect();
}

main().catch(console.error);
