import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== RESTORING DATA PESISIR FOR BM 9601 TZ ===\n');

  const kelurahanPesisir = await prisma.kelurahan.findFirst({
    where: { nama: { equals: 'Pesisir', mode: 'insensitive' } }
  });

  if (!kelurahanPesisir) {
    throw new Error('Kelurahan Pesisir not found!');
  }
  console.log(`Kelurahan Pesisir found: ID ${kelurahanPesisir.id} (${kelurahanPesisir.nama})`);

  // Target record for Pesisir with qrCode 'ARMADA-BM9601TZ-PESI'
  const targetId = 'd2d722a7-dc61-426b-8bf5-01b9603eefd3';

  const updatedPesisir = await prisma.armada.update({
    where: { id: targetId },
    data: {
      namaLps: 'Pesisir Bersih',
      kelurahanId: kelurahanPesisir.id,
      platNomor: 'BM 9601 TZ',
      noIzinOperasi: '16/DLHK/I-OPS/I/2026',
      nomorSkLps: '47',
      tanggalSkLps: new Date('2025-04-29T00:00:00.000Z'),
      tanggalTerbitIzin: new Date('2026-01-05T00:00:00.000Z'),
      namaKetuaLps: 'SULAIMAN ST',
      namaSupir: null,
      alamatLps: 'JL BAMBAMBU KUNING I',
      wilayahKerja: 'KELURAHAN PESISIR',
      lokasiTransdepo: 'HARAPANJAYA',
      jenisArmada: 'PICKUP',
      qrCode: 'ARMADA-BM9601TZ-PESI',
      isActive: true,
      updatedAt: new Date(),
    },
    include: {
      kelurahan: {
        include: { kecamatan: true }
      }
    }
  });

  console.log('\n✅ Successfully restored Pesisir armada data:');
  console.log({
    id: updatedPesisir.id,
    platNomor: updatedPesisir.platNomor,
    namaLps: updatedPesisir.namaLps,
    kelurahan: updatedPesisir.kelurahan?.nama,
    kecamatan: updatedPesisir.kelurahan?.kecamatan?.nama,
    noIzinOperasi: updatedPesisir.noIzinOperasi,
    nomorSkLps: updatedPesisir.nomorSkLps,
    namaKetuaLps: updatedPesisir.namaKetuaLps,
    alamatLps: updatedPesisir.alamatLps,
    wilayahKerja: updatedPesisir.wilayahKerja,
    lokasiTransdepo: updatedPesisir.lokasiTransdepo,
    qrCode: updatedPesisir.qrCode,
    isActive: updatedPesisir.isActive
  });

  // Verify both armadas now
  console.log('\n=== VERIFYING BOTH BM 9601 TZ ARMADAS IN LPS DB ===');
  const all9601 = await prisma.armada.findMany({
    where: { platNomor: 'BM 9601 TZ' },
    include: {
      kelurahan: { include: { kecamatan: true } },
      wasteLogs: true
    }
  });

  all9601.forEach((a, idx) => {
    console.log(`\n[Armada ${idx + 1}] ID: ${a.id}`);
    console.log(`  Plat: ${a.platNomor}`);
    console.log(`  LPS: ${a.namaLps}`);
    console.log(`  Kelurahan: ${a.kelurahan?.nama} (Kec: ${a.kelurahan?.kecamatan?.nama})`);
    console.log(`  No Izin: ${a.noIzinOperasi}`);
    console.log(`  SK: ${a.nomorSkLps}`);
    console.log(`  Ketua: ${a.namaKetuaLps}`);
    console.log(`  Wilayah: ${a.wilayahKerja}`);
    console.log(`  Transdepo: ${a.lokasiTransdepo}`);
    console.log(`  QR Code: ${a.qrCode}`);
    console.log(`  Active: ${a.isActive}`);
    console.log(`  Waste Logs: ${a.wasteLogs.length}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
