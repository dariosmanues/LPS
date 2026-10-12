const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const allHarapanJaya = await prisma.armada.findMany({
    where: {
      OR: [
        { lokasiTransdepo: { contains: 'HARAPAN', mode: 'insensitive' } },
        { wilayahKerja: { contains: 'HARAPAN', mode: 'insensitive' } }
      ]
    },
    include: { kelurahan: { include: { kecamatan: true } } }
  });
  console.log('Total Harapan Jaya in lps-app:', allHarapanJaya.length);
  console.log('Sample plates:', allHarapanJaya.slice(0, 10).map(a => ({
    plat: a.platNomor,
    lokasi: a.lokasiTransdepo,
    wilayah: a.wilayahKerja,
    lps: a.namaLps,
    kelurahan: a.kelurahan?.nama
  })));
  
  const allArmadas = await prisma.armada.findMany({
    select: { lokasiTransdepo: true }
  });
  const lokasiCounts = {};
  for (const a of allArmadas) {
    const l = a.lokasiTransdepo || 'NULL';
    lokasiCounts[l] = (lokasiCounts[l] || 0) + 1;
  }
  console.log('Lokasi counts in LPS-app:', lokasiCounts);
}

run().catch(console.error).finally(() => prisma.$disconnect());
