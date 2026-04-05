import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const wilayahData = [
  {
    kode: "14.71.08",
    nama: "Binawidya",
    kelurahan: ["Binawidya", "Delima", "Simpang Baru", "Tobek Godang", "Sungai Sibam"]
  },
  {
    kode: "14.71.07",
    nama: "Bukit Raya",
    kelurahan: ["Air Dingin", "Simpang Tiga", "Tangkerang Labuai", "Tangkerang Selatan", "Tangkerang Utara"]
  },
  {
    kode: "14.71.14",
    nama: "Kulim",
    kelurahan: ["Kulim", "Mentangor", "Sialangrampai", "Pebatuan", "Pematangkapau"]
  },
  {
    kode: "14.71.04",
    nama: "Lima Puluh",
    kelurahan: ["Pesisir", "Rintis", "Tanjung Rhu", "Sekip"]
  },
  {
    kode: "14.71.09",
    nama: "Marpoyan Damai",
    kelurahan: ["Maharatu", "Perhentian Marpoyan", "Sidomulyo Timur", "Tangkerang Barat", "Tangkerang Tengah", "Wonorejo"]
  },
  {
    kode: "14.71.11",
    nama: "Payung Sekaki",
    kelurahan: ["Air Hitam", "Bandar Raya", "Labuh Baru Barat", "Labuh Baru Timur", "Tampan", "Tirta Siak"]
  },
  {
    kode: "14.71.02",
    nama: "Pekanbaru Kota",
    kelurahan: ["Simpang Empat", "Sumahilang", "Tanah Datar", "Kota Baru", "Sukaramai", "Kota Tinggi"]
  },
  {
    kode: "14.71.06",
    nama: "Rumbai Barat",
    kelurahan: ["Agrowisata", "Maharani", "Muara Fajar Barat", "Muara Fajar Timur", "Rantau Panjang", "Rumbai Bukit"]
  },
  {
    kode: "14.71.12",
    nama: "Rumbai",
    kelurahan: ["Sri Meranti", "Umban Sari", "Palas", "Lembah Damai", "Limbungan Baru", "Meranti Pandak"]
  },
  {
    kode: "14.71.15",
    nama: "Rumbai Timur",
    kelurahan: ["Lembah Sari", "Limbungan", "Sungai Ambang", "Sungai Ukai", "Tebing Tinggi Okura"]
  },
  {
    kode: "14.71.03",
    nama: "Sail",
    kelurahan: ["Cinta Raja", "Sukamaju", "Sukamulya"]
  },
  {
    kode: "14.71.05",
    nama: "Senapelan",
    kelurahan: ["Kampung Bandar", "Kampung Baru", "Kampung Dalam", "Padang Bulan", "Padang Terubuk", "Sago"]
  },
  {
    kode: "14.71.01",
    nama: "Sukajadi",
    kelurahan: ["Harjosari", "Jadirejo", "Kampung Melayu", "Kampung Tengah", "Kedung Sari", "Pulau Karam", "Sukajadi"]
  },
  {
    kode: "14.71.13",
    nama: "Tuah Madani",
    kelurahan: ["Tuah Karya", "Tuah Madani", "Air Putih", "Sialang Munggu", "Sidomulyo Barat"]
  },
  {
    kode: "14.71.10",
    nama: "Tenayan Raya",
    kelurahan: ["Bambu Kuning", "Bencah Lesung", "Industri Tenayan", "Melebung", "Rejosari", "Sialang Sakti", "Tangkerang Timur", "Tuah Negeri"]
  }
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.wasteLog.deleteMany();
  await prisma.armada.deleteMany();
  await prisma.kelurahan.deleteMany();
  await prisma.kecamatan.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lps.pekanbaru.go.id',
      passwordHash: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN'
    }
  });
  console.log('✅ Created admin user:', admin.email);

  // Create operator for Transdepo Harapan Jaya
  const operatorHJ = await prisma.user.create({
    data: {
      email: 'operator.hj@lps.com',
      passwordHash: await bcrypt.hash('operator123', 10),
      name: 'Operator Harapan Jaya',
      role: 'OPERATOR',
      transdepo: 'HARAPAN_JAYA'
    }
  });
  console.log('✅ Created operator user:', operatorHJ.email);

  // Create operator for Transdepo Air Hitam
  const operatorAH = await prisma.user.create({
    data: {
      email: 'operator.ah@lps.com',
      passwordHash: await bcrypt.hash('operator123', 10),
      name: 'Operator Air Hitam',
      role: 'OPERATOR',
      transdepo: 'AIR_HITAM'
    }
  });
  console.log('✅ Created operator user:', operatorAH.email);

  // Create gatekeeper user
  const gatekeeper = await prisma.user.create({
    data: {
      email: 'gatekeeper@lps.pekanbaru.go.id',
      passwordHash: await bcrypt.hash('gate123', 10),
      name: 'Petugas TPA',
      role: 'GATEKEEPER'
    }
  });
  console.log('✅ Created gatekeeper user:', gatekeeper.email);

  // Create kecamatan and kelurahan
  let kelurahanCounter = 1;
  let totalKelurahan = 0;

  for (const kec of wilayahData) {
    const kecamatan = await prisma.kecamatan.create({
      data: {
        kodeKemendagri: kec.kode,
        nama: kec.nama,
      }
    });

    for (const kel of kec.kelurahan) {
      const kelCode = `${kec.kode}.${String(kelurahanCounter).padStart(3, '0')}`;
      await prisma.kelurahan.create({
        data: {
          kecamatanId: kecamatan.id,
          kodeKemendagri: kelCode,
          nama: kel,
          qrCode: `KEL-${kelCode.replace(/\./g, '')}`,
        }
      });
      kelurahanCounter++;
      totalKelurahan++;
    }
  }
  console.log(`✅ Created ${wilayahData.length} kecamatan and ${totalKelurahan} kelurahan`);

  // Create sample armada
  // Create sample armada
  const armadaData = [
    { namaLps: 'LPS Binawidya 1', platNomor: 'BM 8001 AA', namaSupir: 'Ahmad Rizki', namaKetuaLps: 'Budi' },
    { namaLps: 'LPS Bukit Raya 1', platNomor: 'BM 8002 AB', namaSupir: 'Budi Santoso', namaKetuaLps: 'Andi' },
    { namaLps: 'LPS Kulim 1', platNomor: 'BM 8003 AC', namaSupir: 'Cahyo Pratama', namaKetuaLps: 'Citra' },
    { namaLps: 'LPS Lima Puluh 1', platNomor: 'BM 8004 AD', namaSupir: 'Dedi Kurniawan', namaKetuaLps: 'Doni' },
    { namaLps: 'LPS Marpoyan 1', platNomor: 'BM 8005 AE', namaSupir: 'Eko Wijaya', namaKetuaLps: 'Eka' },
  ];

  for (const armada of armadaData) {
    await prisma.armada.create({
      data: {
        ...armada,
        qrCode: `ARM-${armada.platNomor.replace(/\s/g, '')}`,
      }
    });
  }
  console.log(`✅ Created ${armadaData.length} armada`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
