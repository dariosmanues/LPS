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
  console.log('🌱 Starting safe, non-destructive seed...');

  // 1. Seed Users safely using upsert (will not delete existing data or duplicate)
  const defaultUsers = [
    {
      email: 'admin@lps.pekanbaru.go.id',
      password: 'admin123',
      name: 'Administrator',
      role: 'ADMIN',
      transdepo: null,
    },
    {
      email: 'operator.hj@lps.com',
      password: 'operator123',
      name: 'Operator Harapan Jaya',
      role: 'OPERATOR',
      transdepo: 'HARAPAN_JAYA',
    },
    {
      email: 'operator.ah@lps.com',
      password: 'operator123',
      name: 'Operator Air Hitam',
      role: 'OPERATOR',
      transdepo: 'AIR_HITAM',
    },
    {
      email: 'gatekeeper@lps.pekanbaru.go.id',
      password: 'gate123',
      name: 'Petugas TPA',
      role: 'GATEKEEPER',
      transdepo: null,
    }
  ];

  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // keep existing user data intact
      create: {
        email: user.email,
        passwordHash: hashedPassword,
        name: user.name,
        role: user.role,
        transdepo: user.transdepo,
      }
    });
  }
  console.log('✅ Users verified and seeded.');

  // 2. Seed Kecamatan & Kelurahan master reference data using upsert
  let kelurahanCounter = 1;
  let totalKelurahan = 0;

  for (const kec of wilayahData) {
    const kecamatan = await prisma.kecamatan.upsert({
      where: { kodeKemendagri: kec.kode },
      update: { nama: kec.nama },
      create: {
        kodeKemendagri: kec.kode,
        nama: kec.nama,
      }
    });

    for (const kel of kec.kelurahan) {
      const kelCode = `${kec.kode}.${String(kelurahanCounter).padStart(3, '0')}`;
      await prisma.kelurahan.upsert({
        where: { kodeKemendagri: kelCode },
        update: { nama: kel, kecamatanId: kecamatan.id },
        create: {
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
  console.log(`✅ Verified ${wilayahData.length} kecamatan and ${totalKelurahan} kelurahan master data.`);
  console.log('🎉 Safe seed completed successfully! (Armada records are preserved)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
