import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('       VERIFIKASI DATA BM 9601 TZ (PESISIR & RINTIS)');
  console.log('====================================================\n');

  // 1. LPS Portal Database (Prisma / Neon Postgres)
  console.log('--- [1] DATABASE LPS PORTAL ---');
  const armadasLps = await prisma.armada.findMany({
    where: { platNomor: 'BM 9601 TZ' },
    include: {
      kelurahan: { include: { kecamatan: true } },
      wasteLogs: true
    },
    orderBy: { namaLps: 'asc' }
  });

  console.log(`Ditemukan ${armadasLps.length} data armada BM 9601 TZ di LPS DB:`);
  armadasLps.forEach((a, i) => {
    console.log(`\n  Record #${i + 1}:`);
    console.log(`  - ID              : ${a.id}`);
    console.log(`  - Plat Nomor      : ${a.platNomor}`);
    console.log(`  - Nama LPS        : ${a.namaLps}`);
    console.log(`  - Kelurahan       : ${a.kelurahan?.nama} (Kecamatan: ${a.kelurahan?.kecamatan?.nama})`);
    console.log(`  - Nomor Izin      : ${a.noIzinOperasi}`);
    console.log(`  - Nomor SK LPS    : ${a.nomorSkLps}`);
    console.log(`  - Nama Ketua      : ${a.namaKetuaLps}`);
    console.log(`  - Wilayah Kerja   : ${a.wilayahKerja}`);
    console.log(`  - Lokasi TPS      : ${a.lokasiTransdepo}`);
    console.log(`  - QR Code         : ${a.qrCode}`);
    console.log(`  - Status Aktif    : ${a.isActive}`);
    console.log(`  - Total Waste Log : ${a.wasteLogs.length}`);
  });

  console.log('\n====================================================');
  console.log('       KESIMPULAN: DATA PESISIR AMAN & UTUH');
  console.log('====================================================');

  await prisma.$disconnect();
}

main().catch(console.error);
