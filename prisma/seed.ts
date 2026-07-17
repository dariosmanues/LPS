import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Daftar 83 Kelurahan di 15 Kecamatan Kota Pekanbaru
// Sumber: Wikipedia / Perda Kota Pekanbaru No. 2 Tahun 2020
const kelurahanData: { nama: string; kecamatan: string }[] = [
  // 1. Kecamatan Binawidya (5 kelurahan)
  { nama: 'Binawidya', kecamatan: 'Binawidya' },
  { nama: 'Delima', kecamatan: 'Binawidya' },
  { nama: 'Simpang Baru', kecamatan: 'Binawidya' },
  { nama: 'Tobek Godang', kecamatan: 'Binawidya' },
  { nama: 'Sungai Sibam', kecamatan: 'Binawidya' },

  // 2. Kecamatan Bukit Raya (5 kelurahan)
  { nama: 'Air Dingin', kecamatan: 'Bukit Raya' },
  { nama: 'Simpang Tiga', kecamatan: 'Bukit Raya' },
  { nama: 'Tangkerang Labuai', kecamatan: 'Bukit Raya' },
  { nama: 'Tangkerang Selatan', kecamatan: 'Bukit Raya' },
  { nama: 'Tangkerang Utara', kecamatan: 'Bukit Raya' },

  // 3. Kecamatan Kulim (5 kelurahan)
  { nama: 'Kulim', kecamatan: 'Kulim' },
  { nama: 'Mentangor', kecamatan: 'Kulim' },
  { nama: 'Sialangrampai', kecamatan: 'Kulim' },
  { nama: 'Pebatuan', kecamatan: 'Kulim' },
  { nama: 'Pematangkapau', kecamatan: 'Kulim' },

  // 4. Kecamatan Lima Puluh (4 kelurahan)
  { nama: 'Pesisir', kecamatan: 'Lima Puluh' },
  { nama: 'Rintis', kecamatan: 'Lima Puluh' },
  { nama: 'Tanjung Rhu', kecamatan: 'Lima Puluh' },
  { nama: 'Sekip', kecamatan: 'Lima Puluh' },

  // 5. Kecamatan Marpoyan Damai (6 kelurahan)
  { nama: 'Maharatu', kecamatan: 'Marpoyan Damai' },
  { nama: 'Perhentian Marpoyan', kecamatan: 'Marpoyan Damai' },
  { nama: 'Sidomulyo Timur', kecamatan: 'Marpoyan Damai' },
  { nama: 'Tangkerang Barat', kecamatan: 'Marpoyan Damai' },
  { nama: 'Tangkerang Tengah', kecamatan: 'Marpoyan Damai' },
  { nama: 'Wonorejo', kecamatan: 'Marpoyan Damai' },

  // 6. Kecamatan Payung Sekaki (6 kelurahan)
  { nama: 'Air Hitam', kecamatan: 'Payung Sekaki' },
  { nama: 'Bandar Raya', kecamatan: 'Payung Sekaki' },
  { nama: 'Labuh Baru Barat', kecamatan: 'Payung Sekaki' },
  { nama: 'Labuh Baru Timur', kecamatan: 'Payung Sekaki' },
  { nama: 'Tampan', kecamatan: 'Payung Sekaki' },
  { nama: 'Tirta Siak', kecamatan: 'Payung Sekaki' },

  // 7. Kecamatan Pekanbaru Kota (6 kelurahan)
  { nama: 'Simpang Empat', kecamatan: 'Pekanbaru Kota' },
  { nama: 'Sumahilang', kecamatan: 'Pekanbaru Kota' },
  { nama: 'Tanah Datar', kecamatan: 'Pekanbaru Kota' },
  { nama: 'Kota Baru', kecamatan: 'Pekanbaru Kota' },
  { nama: 'Sukaramai', kecamatan: 'Pekanbaru Kota' },
  { nama: 'Kota Tinggi', kecamatan: 'Pekanbaru Kota' },

  // 8. Kecamatan Rumbai (6 kelurahan)
  { nama: 'Sri Meranti', kecamatan: 'Rumbai' },
  { nama: 'Umban Sari', kecamatan: 'Rumbai' },
  { nama: 'Palas', kecamatan: 'Rumbai' },
  { nama: 'Lembah Damai', kecamatan: 'Rumbai' },
  { nama: 'Limbungan Baru', kecamatan: 'Rumbai' },
  { nama: 'Meranti Pandak', kecamatan: 'Rumbai' },

  // 9. Kecamatan Rumbai Barat (6 kelurahan)
  { nama: 'Agrowisata', kecamatan: 'Rumbai Barat' },
  { nama: 'Maharani', kecamatan: 'Rumbai Barat' },
  { nama: 'Muara Fajar Barat', kecamatan: 'Rumbai Barat' },
  { nama: 'Muara Fajar Timur', kecamatan: 'Rumbai Barat' },
  { nama: 'Rantau Panjang', kecamatan: 'Rumbai Barat' },
  { nama: 'Rumbai Bukit', kecamatan: 'Rumbai Barat' },

  // 10. Kecamatan Rumbai Timur (5 kelurahan)
  { nama: 'Lembah Sari', kecamatan: 'Rumbai Timur' },
  { nama: 'Limbungan', kecamatan: 'Rumbai Timur' },
  { nama: 'Sungai Ambang', kecamatan: 'Rumbai Timur' },
  { nama: 'Sungai Ukai', kecamatan: 'Rumbai Timur' },
  { nama: 'Tebing Tinggi Okura', kecamatan: 'Rumbai Timur' },

  // 11. Kecamatan Sail (3 kelurahan)
  { nama: 'Cinta Raja', kecamatan: 'Sail' },
  { nama: 'Sukamaju', kecamatan: 'Sail' },
  { nama: 'Sukamulya', kecamatan: 'Sail' },

  // 12. Kecamatan Senapelan (6 kelurahan)
  { nama: 'Kampung Bandar', kecamatan: 'Senapelan' },
  { nama: 'Kampung Baru', kecamatan: 'Senapelan' },
  { nama: 'Kampung Dalam', kecamatan: 'Senapelan' },
  { nama: 'Padang Bulan', kecamatan: 'Senapelan' },
  { nama: 'Padang Terubuk', kecamatan: 'Senapelan' },
  { nama: 'Sago', kecamatan: 'Senapelan' },

  // 13. Kecamatan Sukajadi (7 kelurahan)
  { nama: 'Harjosari', kecamatan: 'Sukajadi' },
  { nama: 'Jadirejo', kecamatan: 'Sukajadi' },
  { nama: 'Kampung Melayu', kecamatan: 'Sukajadi' },
  { nama: 'Kampung Tengah', kecamatan: 'Sukajadi' },
  { nama: 'Kedung Sari', kecamatan: 'Sukajadi' },
  { nama: 'Pulau Karam', kecamatan: 'Sukajadi' },
  { nama: 'Sukajadi', kecamatan: 'Sukajadi' },

  // 14. Kecamatan Tenayan Raya (8 kelurahan)
  { nama: 'Bambu Kuning', kecamatan: 'Tenayan Raya' },
  { nama: 'Bencah Lesung', kecamatan: 'Tenayan Raya' },
  { nama: 'Industri Tenayan', kecamatan: 'Tenayan Raya' },
  { nama: 'Melebung', kecamatan: 'Tenayan Raya' },
  { nama: 'Rejosari', kecamatan: 'Tenayan Raya' },
  { nama: 'Sialang Sakti', kecamatan: 'Tenayan Raya' },
  { nama: 'Tangkerang Timur', kecamatan: 'Tenayan Raya' },
  { nama: 'Tuah Negeri', kecamatan: 'Tenayan Raya' },

  // 15. Kecamatan Tuah Madani (5 kelurahan)
  { nama: 'Tuah Karya', kecamatan: 'Tuah Madani' },
  { nama: 'Tuah Madani', kecamatan: 'Tuah Madani' },
  { nama: 'Air Putih', kecamatan: 'Tuah Madani' },
  { nama: 'Sialang Munggu', kecamatan: 'Tuah Madani' },
  { nama: 'Sidomulyo Barat', kecamatan: 'Tuah Madani' },
]

async function main() {
  console.log(`Seeding ${kelurahanData.length} kelurahan...`)

  let created = 0
  let updated = 0

  for (const kel of kelurahanData) {
    // Cek apakah sudah ada kelurahan dengan nama yang sama
    const existing = await prisma.kelurahan.findFirst({
      where: { nama: kel.nama, kecamatan: kel.kecamatan },
    })

    if (existing) {
      updated++
    } else {
      await prisma.kelurahan.create({
        data: {
          nama: kel.nama,
          kecamatan: kel.kecamatan,
        },
      })
      created++
    }
  }

  // Hapus kelurahan yang tidak ada di daftar 83 kelurahan (tanpa laporan terkait)
  const allKelurahan = await prisma.kelurahan.findMany({
    include: { laporan: { select: { id: true } } },
  })

  let deleted = 0
  for (const kel of allKelurahan) {
    const isInList = kelurahanData.some(
      (k) => k.nama === kel.nama && k.kecamatan === kel.kecamatan
    )
    if (!isInList && kel.laporan.length === 0) {
      await prisma.kelurahan.delete({ where: { id: kel.id } })
      deleted++
    } else if (!isInList) {
      console.log(`⚠️  Kelurahan "${kel.nama}" (${kel.kecamatan}) tidak ada di daftar 83, tapi memiliki ${kel.laporan.length} laporan terkait. Tidak dihapus.`)
    }
  }

  console.log(`✅ Selesai! Baru: ${created}, Sudah ada: ${updated}, Dihapus: ${deleted}`)
  console.log(`Total kelurahan sekarang: ${await prisma.kelurahan.count()}`)
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
