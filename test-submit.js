const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = {
    bulan: "2026-07",
    kelurahanId: "cmrphplum001i14isga6utwhj", // Cinta Raja
    // minimal data based on route.ts
  };

  try {
    const rumahTanggaCreate = Object.entries(data.kinerjaAngkutan?.jumlahRumahTangga || {}).map(([rtRw, item]) => ({
      rtRw,
      jumlah: Number(item.jumlah),
      hari: String(item.hari || '')
    }))

    const rincianAnorganikCreate = Object.entries(data.kinerjaPengolahan?.rincianAnorganik || {}).map(([kategori, volume]) => ({
      kategori,
      volume: Number(volume)
    }))

    const iuranRWCreate = Array.isArray(data.kinerjaIuran?.iuranPerRW)
        ? data.kinerjaIuran.iuranPerRW.map((item) => ({
            rw: String(item.rw || ''),
            nilai: Number(item.nilai || 0)
          }))
        : []

    const laporan = await prisma.laporan.create({
      data: {
        bulan: data.bulan,
        kelurahanId: data.kelurahanId,
        latarBelakang: data.latarBelakang || '',
        tujuan: data.tujuan || '',
        manfaat: data.manfaat || '',
        strukturLPS: data.strukturLPS || '',
        layanan: data.layanan || '',
        perkembanganLPS: data.perkembanganLPS || '',
        laporanKeuangan: data.laporanKeuangan || '',

        kinerjaAngkutan: {
          create: {
            jumlahArmada: Number(data.kinerjaAngkutan?.jumlahArmada || 0),
            jumlahUMKM: Number(data.kinerjaAngkutan?.jumlahUMKM || 0),
            jumlahBadanUsaha: Number(data.kinerjaAngkutan?.jumlahBadanUsaha || 0),
            persentasePartisipasi: Number(data.kinerjaAngkutan?.persentasePartisipasi || 0),
            permasalahan: data.kinerjaAngkutan?.permasalahan || '',
            aksiYangDilakukan: data.kinerjaAngkutan?.aksiYangDilakukan || '',
            rumahTangga: {
              create: rumahTanggaCreate
            }
          }
        },

        kinerjaPengolahan: {
          create: {
            programPengolahan: data.kinerjaPengolahan?.programPengolahan || '',
            volumePemilahanOrganik: Number(data.kinerjaPengolahan?.volumePemilahanOrganik || 0),
            volumePemilahanUnorganik: Number(data.kinerjaPengolahan?.volumePemilahanUnorganik || 0),
            volumePenjualanOrganik: Number(data.kinerjaPengolahan?.volumePenjualanOrganik || 0),
            volumePenjualanUnorganik: Number(data.kinerjaPengolahan?.volumePenjualanUnorganik || 0),
            programEdukasi: data.kinerjaPengolahan?.programEdukasi || '',
            permasalahan: data.kinerjaPengolahan?.permasalahan || '',
            aksiYangDilakukan: data.kinerjaPengolahan?.aksiYangDilakukan || '',
            rincianAnorganik: {
              create: rincianAnorganikCreate
            }
          }
        },

        kinerjaIuran: {
          create: {
            penerimaanIuran: Number(data.kinerjaIuran?.penerimaanIuran || 0),
            iuranPerRW: {
              create: iuranRWCreate
            },
            nilaiIuran: Array.isArray(data.kinerjaIuran?.nilaiIuran) 
                ? data.kinerjaIuran.nilaiIuran.map(Number) 
                : [],
            penerimaanLain: Number(data.kinerjaIuran?.penerimaanLain || 0),
            sewaArmada: Number(data.kinerjaIuran?.sewaArmada || 0),
            bbm: Number(data.kinerjaIuran?.bbm || 0),
            tenagaKerja: Number(data.kinerjaIuran?.tenagaKerja || 0),
            administrasi: Number(data.kinerjaIuran?.administrasi || 0),
            biayaRapat: Number(data.kinerjaIuran?.biayaRapat || 0),
            feePetugasPungut: Number(data.kinerjaIuran?.feePetugasPungut || 0),
            gajiPengurus: Number(data.kinerjaIuran?.gajiPengurus || 0),
            biayaLainLain: Number(data.kinerjaIuran?.biayaLainLain || 0),
            pemanfaatanIuran: data.kinerjaIuran?.pemanfaatanIuran || '',
            permasalahan: data.kinerjaIuran?.permasalahan || '',
            aksiYangDilakukan: data.kinerjaIuran?.aksiYangDilakukan || ''
          }
        }
      }
    });
    console.log("Success:", laporan.id);
  } catch (error) {
    console.error("Prisma error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
