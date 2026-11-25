export interface TreeSpeciesEntry {
  jenisPohon: string;
  jumlah: number;
}

export interface RthTreeLocation {
  id: string;
  seq: number;
  excelNo: number;
  namaJalan: string;
  alamat: string;
  kecamatan: string;
  rthNo: number | null;
  lat: number;
  lng: number;
  trees: TreeSpeciesEntry[];
  totalPohon: number;
}

export interface TreeSpeciesSummary {
  jenisPohon: string;
  totalPohon: number;
  jumlahLokasi: number;
}

export const RTH_TREE_SUMMARY_2026 = {
  tahun: 2026,
  judul: 'Rekapitulasi Pendataan Pohon Bidang Pertamanan DLHK Kota Pekanbaru Tahun 2026',
  totalPohon: 17196,
  totalLokasiJalan: 36,
  totalJenisPohon: 47,
};

export const RTH_TREE_LOCATIONS_2026: RthTreeLocation[] = [
  {
    "id": "pohon-loc-1",
    "seq": 1,
    "excelNo": 1,
    "namaJalan": "Jl. OK M Jamil",
    "alamat": "Jl. OK M. Jamil, Simpang Tiga, Kec. Bukit Raya, Kota Pekanbaru",
    "kecamatan": "Bukit Raya",
    "rthNo": 165,
    "lat": 0.476139,
    "lng": 101.459139,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 92
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 14
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 3
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 2
      },
      {
        "jenisPohon": "Mangga Thailand",
        "jumlah": 2
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 2
      },
      {
        "jenisPohon": "Jambu air",
        "jumlah": 1
      },
      {
        "jenisPohon": "Jakaranda",
        "jumlah": 1
      },
      {
        "jenisPohon": "Jati",
        "jumlah": 1
      }
    ],
    "totalPohon": 118
  },
  {
    "id": "pohon-loc-2",
    "seq": 2,
    "excelNo": 2,
    "namaJalan": "Jl. Nursery 1",
    "alamat": "Nurseri Mayang Terurai I, Jl. OK M. Jamil, Simpang Tiga, Kec. Bukit Raya",
    "kecamatan": "Bukit Raya",
    "rthNo": 165,
    "lat": 0.4765,
    "lng": 101.4595,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 7
      },
      {
        "jenisPohon": "Mangga Thailand",
        "jumlah": 6
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 2
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 2
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 1
      },
      {
        "jenisPohon": "Jati",
        "jumlah": 1
      },
      {
        "jenisPohon": "Bintaro",
        "jumlah": 1
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 1
      },
      {
        "jenisPohon": "Jambu air",
        "jumlah": 1
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 1
      }
    ],
    "totalPohon": 23
  },
  {
    "id": "pohon-loc-3",
    "seq": 3,
    "excelNo": 3,
    "namaJalan": "Jl. Jend Sudirman",
    "alamat": "Jl. Jend. Sudirman, Kota Pekanbaru",
    "kecamatan": "Pekanbaru Kota / Bukit Raya",
    "rthNo": 34,
    "lat": 0.487814,
    "lng": 101.454456,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 992
      },
      {
        "jenisPohon": "Palam Raja",
        "jumlah": 247
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 233
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 164
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 120
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 43
      },
      {
        "jenisPohon": "Bungur",
        "jumlah": 36
      },
      {
        "jenisPohon": "Bintaro",
        "jumlah": 27
      },
      {
        "jenisPohon": "Zahra",
        "jumlah": 25
      },
      {
        "jenisPohon": "Kerai Payung",
        "jumlah": 21
      },
      {
        "jenisPohon": "Pakis Brazil",
        "jumlah": 18
      },
      {
        "jenisPohon": "Glodokan Tiang",
        "jumlah": 17
      },
      {
        "jenisPohon": "Jati",
        "jumlah": 17
      },
      {
        "jenisPohon": "Palam Putri",
        "jumlah": 16
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 12
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 12
      },
      {
        "jenisPohon": "Spathodea",
        "jumlah": 10
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 9
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 8
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 5
      },
      {
        "jenisPohon": "Mangga Thailand",
        "jumlah": 4
      },
      {
        "jenisPohon": "Sungkai",
        "jumlah": 4
      },
      {
        "jenisPohon": "Pinus",
        "jumlah": 2
      },
      {
        "jenisPohon": "Kayu putih",
        "jumlah": 1
      }
    ],
    "totalPohon": 2043
  },
  {
    "id": "pohon-loc-4",
    "seq": 4,
    "excelNo": 3,
    "namaJalan": "Jl. Gajah Mada",
    "alamat": "Jl. Gajah Mada, Simpang Empat, Kec. Pekanbaru Kota",
    "kecamatan": "Pekanbaru Kota",
    "rthNo": 65,
    "lat": 0.517589,
    "lng": 101.452169,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 118
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 2
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 1
      }
    ],
    "totalPohon": 121
  },
  {
    "id": "pohon-loc-5",
    "seq": 5,
    "excelNo": 4,
    "namaJalan": "Jl. Pattimura",
    "alamat": "Jl. Pattimura, Simpang Empat, Kec. Pekanbaru Kota",
    "kecamatan": "Pekanbaru Kota",
    "rthNo": 70,
    "lat": 0.509636,
    "lng": 101.449811,
    "trees": [
      {
        "jenisPohon": "Tanjung",
        "jumlah": 49
      },
      {
        "jenisPohon": "Palam Putri",
        "jumlah": 45
      },
      {
        "jenisPohon": "Kerai Payung",
        "jumlah": 16
      },
      {
        "jenisPohon": "Mahoni",
        "jumlah": 14
      },
      {
        "jenisPohon": "Bintaro",
        "jumlah": 9
      },
      {
        "jenisPohon": "Palam Raja",
        "jumlah": 4
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 2
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 1
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 1
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 1
      },
      {
        "jenisPohon": "Beringin roda",
        "jumlah": 1
      }
    ],
    "totalPohon": 143
  },
  {
    "id": "pohon-loc-6",
    "seq": 6,
    "excelNo": 5,
    "namaJalan": "Jl. Diponegoro",
    "alamat": "Jl. Diponegoro, Kec. Sail / Lima Puluh, Kota Pekanbaru",
    "kecamatan": "Sail / Lima Puluh",
    "rthNo": 32,
    "lat": 0.521528,
    "lng": 101.4525,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 219
      },
      {
        "jenisPohon": "Bungur",
        "jumlah": 139
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 52
      },
      {
        "jenisPohon": "Bintaro",
        "jumlah": 49
      },
      {
        "jenisPohon": "Palam Raja",
        "jumlah": 28
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 20
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 18
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 11
      },
      {
        "jenisPohon": "Glodokan Tiang",
        "jumlah": 9
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 6
      },
      {
        "jenisPohon": "Asam Jawa",
        "jumlah": 6
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 4
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 2
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 2
      },
      {
        "jenisPohon": "Palam Putri",
        "jumlah": 1
      },
      {
        "jenisPohon": "Flamboyan",
        "jumlah": 1
      }
    ],
    "totalPohon": 567
  },
  {
    "id": "pohon-loc-7",
    "seq": 7,
    "excelNo": 6,
    "namaJalan": "Jl. Cut Nyak Din",
    "alamat": "Jl. Cut Nyak Dhien, Jadirejo, Kec. Sukajadi, Kota Pekanbaru",
    "kecamatan": "Sukajadi",
    "rthNo": 31,
    "lat": 0.518611,
    "lng": 101.446111,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 249
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 78
      },
      {
        "jenisPohon": "Palam Putri",
        "jumlah": 33
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 30
      },
      {
        "jenisPohon": "Palam Raja",
        "jumlah": 14
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 11
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 9
      },
      {
        "jenisPohon": "Asam Jawa",
        "jumlah": 9
      },
      {
        "jenisPohon": "Matoa",
        "jumlah": 8
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 3
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 1
      },
      {
        "jenisPohon": "Kerai Payung",
        "jumlah": 1
      },
      {
        "jenisPohon": "Bungur",
        "jumlah": 1
      }
    ],
    "totalPohon": 447
  },
  {
    "id": "pohon-loc-8",
    "seq": 8,
    "excelNo": 7,
    "namaJalan": "Jl. Sultan Syarif Qasim",
    "alamat": "Jl. Sultan Syarif Qasim, Kec. Lima Puluh, Kota Pekanbaru",
    "kecamatan": "Lima Puluh",
    "rthNo": 45,
    "lat": 0.525833,
    "lng": 101.453667,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 30
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 17
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 4
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 3
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 1
      }
    ],
    "totalPohon": 55
  },
  {
    "id": "pohon-loc-9",
    "seq": 9,
    "excelNo": 8,
    "namaJalan": "Jl. T. Umar",
    "alamat": "Jl. Teuku Umar, Rintis, Kec. Pekanbaru Kota",
    "kecamatan": "Pekanbaru Kota",
    "rthNo": 131,
    "lat": 0.532186,
    "lng": 101.453036,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 36
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 16
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 12
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 2
      }
    ],
    "totalPohon": 66
  },
  {
    "id": "pohon-loc-10",
    "seq": 10,
    "excelNo": 9,
    "namaJalan": "Jl. Gatot Subroto",
    "alamat": "Jl. Gatot Subroto, Kota Tinggi, Kec. Pekanbaru Kota",
    "kecamatan": "Pekanbaru Kota",
    "rthNo": 99,
    "lat": 0.529792,
    "lng": 101.453136,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 4
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 3
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 2
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 1
      }
    ],
    "totalPohon": 10
  },
  {
    "id": "pohon-loc-11",
    "seq": 11,
    "excelNo": 10,
    "namaJalan": "Jl. Ahmad Yani",
    "alamat": "Jl. Jend. Ahmad Yani, Kota Pekanbaru",
    "kecamatan": "Senapelan / Pekanbaru Kota",
    "rthNo": 78,
    "lat": 0.519281,
    "lng": 101.444117,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 70
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 39
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 33
      },
      {
        "jenisPohon": "Glodokan Tiang",
        "jumlah": 19
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 12
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 8
      },
      {
        "jenisPohon": "Jati",
        "jumlah": 7
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 2
      },
      {
        "jenisPohon": "Matoa",
        "jumlah": 1
      },
      {
        "jenisPohon": "Akasia",
        "jumlah": 1
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 1
      }
    ],
    "totalPohon": 193
  },
  {
    "id": "pohon-loc-12",
    "seq": 12,
    "excelNo": 11,
    "namaJalan": "Jl. Arifin Ahmad",
    "alamat": "Jl. Arifin Ahmad, Sidomulyo Tim., Kec. Marpoyan Damai",
    "kecamatan": "Marpoyan Damai",
    "rthNo": 28,
    "lat": 0.480167,
    "lng": 101.434556,
    "trees": [
      {
        "jenisPohon": "Pulai",
        "jumlah": 480
      },
      {
        "jenisPohon": "Mahoni",
        "jumlah": 466
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 254
      },
      {
        "jenisPohon": "Spathodea",
        "jumlah": 35
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 17
      },
      {
        "jenisPohon": "Palam Putri",
        "jumlah": 8
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 6
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 5
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 5
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 4
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 4
      },
      {
        "jenisPohon": "Jati",
        "jumlah": 3
      },
      {
        "jenisPohon": "Sengon",
        "jumlah": 2
      },
      {
        "jenisPohon": "Palam Raja",
        "jumlah": 2
      },
      {
        "jenisPohon": "Mangga Thailand",
        "jumlah": 2
      },
      {
        "jenisPohon": "Pinus",
        "jumlah": 2
      },
      {
        "jenisPohon": "Dadap merah",
        "jumlah": 1
      },
      {
        "jenisPohon": "Glodokan Tiang",
        "jumlah": 1
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 1
      }
    ],
    "totalPohon": 1298
  },
  {
    "id": "pohon-loc-13",
    "seq": 13,
    "excelNo": 12,
    "namaJalan": "Jl. KH Nasution",
    "alamat": "Jl. Kaharuddin Nasution, Maharatu, Kec. Marpoyan Damai",
    "kecamatan": "Marpoyan Damai",
    "rthNo": 48,
    "lat": 0.430833,
    "lng": 101.442528,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 179
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 19
      },
      {
        "jenisPohon": "Glodokan Tiang",
        "jumlah": 4
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 3
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 3
      },
      {
        "jenisPohon": "Mangga Thailand",
        "jumlah": 1
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 1
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 1
      },
      {
        "jenisPohon": "Bintaro",
        "jumlah": 1
      },
      {
        "jenisPohon": "Akasia",
        "jumlah": 1
      }
    ],
    "totalPohon": 213
  },
  {
    "id": "pohon-loc-14",
    "seq": 14,
    "excelNo": 13,
    "namaJalan": "RTH Kaca Mayang",
    "alamat": "RTH Taman Putri Kaca Mayang, Jl. Jend. Sudirman No.474, Kec. Sukajadi",
    "kecamatan": "Sukajadi",
    "rthNo": 9,
    "lat": 0.513722,
    "lng": 101.448339,
    "trees": [
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 67
      },
      {
        "jenisPohon": "Spathodea",
        "jumlah": 47
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 43
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 26
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 19
      },
      {
        "jenisPohon": "Dadap Merah",
        "jumlah": 5
      },
      {
        "jenisPohon": "Palam Raja",
        "jumlah": 3
      },
      {
        "jenisPohon": "Sungkai",
        "jumlah": 3
      },
      {
        "jenisPohon": "Kerai Payung",
        "jumlah": 1
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 1
      },
      {
        "jenisPohon": "Pinus",
        "jumlah": 1
      },
      {
        "jenisPohon": "Mangga Thailand",
        "jumlah": 1
      },
      {
        "jenisPohon": "Bintaro",
        "jumlah": 1
      }
    ],
    "totalPohon": 218
  },
  {
    "id": "pohon-loc-15",
    "seq": 15,
    "excelNo": 14,
    "namaJalan": "Jl. Datuk Wan Abdul Jamal",
    "alamat": "Jl. Datuk Wan Abdul Jamal, Simpang Tiga, Kec. Bukit Raya",
    "kecamatan": "Bukit Raya",
    "rthNo": 64,
    "lat": 0.480939,
    "lng": 101.457103,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 1
      }
    ],
    "totalPohon": 1
  },
  {
    "id": "pohon-loc-16",
    "seq": 16,
    "excelNo": 15,
    "namaJalan": "Jl. Soekarno Hatta",
    "alamat": "Jl. Soekarno Hatta, Kota Pekanbaru",
    "kecamatan": "Marpoyan Damai / Payung Sekaki",
    "rthNo": 44,
    "lat": 0.461417,
    "lng": 101.418333,
    "trees": [
      {
        "jenisPohon": "Ketapang",
        "jumlah": 289
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 288
      },
      {
        "jenisPohon": "Spathodea",
        "jumlah": 257
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 202
      },
      {
        "jenisPohon": "Mahoni",
        "jumlah": 94
      },
      {
        "jenisPohon": "Kayu Putih",
        "jumlah": 39
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 32
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 17
      },
      {
        "jenisPohon": "Bungur",
        "jumlah": 16
      },
      {
        "jenisPohon": "Flamboyan",
        "jumlah": 3
      },
      {
        "jenisPohon": "Glodogan tiang",
        "jumlah": 3
      },
      {
        "jenisPohon": "Mangga Thailand",
        "jumlah": 1
      }
    ],
    "totalPohon": 1241
  },
  {
    "id": "pohon-loc-17",
    "seq": 17,
    "excelNo": 16,
    "namaJalan": "Jl. Siak 2",
    "alamat": "Jl. Siak II, Kec. Payung Sekaki / Rumbai, Kota Pekanbaru",
    "kecamatan": "Payung Sekaki / Rumbai",
    "rthNo": null,
    "lat": 0.5485,
    "lng": 101.4082,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 172
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 102
      },
      {
        "jenisPohon": "Spatodhea",
        "jumlah": 25
      },
      {
        "jenisPohon": "Akasia",
        "jumlah": 17
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 11
      },
      {
        "jenisPohon": "Kapuk (Waru)",
        "jumlah": 6
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 5
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 1
      }
    ],
    "totalPohon": 339
  },
  {
    "id": "pohon-loc-18",
    "seq": 18,
    "excelNo": 17,
    "namaJalan": "Jl. Riau",
    "alamat": "Jl. Riau, Kota Pekanbaru",
    "kecamatan": "Senapelan / Payung Sekaki",
    "rthNo": 73,
    "lat": 0.535961,
    "lng": 101.442969,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 148
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 126
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 79
      },
      {
        "jenisPohon": "Spatodhea",
        "jumlah": 15
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 13
      },
      {
        "jenisPohon": "Glodogan",
        "jumlah": 10
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 9
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 2
      }
    ],
    "totalPohon": 402
  },
  {
    "id": "pohon-loc-19",
    "seq": 19,
    "excelNo": 18,
    "namaJalan": "Jl. Tuanku Tambusai",
    "alamat": "Jl. Tuanku Tambusai (Nangka), Kota Pekanbaru",
    "kecamatan": "Payung Sekaki / Marpoyan Damai",
    "rthNo": 46,
    "lat": 0.498083,
    "lng": 101.399361,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 791
      },
      {
        "jenisPohon": "Glodogan",
        "jumlah": 419
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 367
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 268
      },
      {
        "jenisPohon": "Spatodhea",
        "jumlah": 177
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 121
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 38
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 20
      },
      {
        "jenisPohon": "Pucuk Merah",
        "jumlah": 17
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 5
      },
      {
        "jenisPohon": "Petai",
        "jumlah": 5
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 2
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 2
      }
    ],
    "totalPohon": 2232
  },
  {
    "id": "pohon-loc-20",
    "seq": 20,
    "excelNo": 19,
    "namaJalan": "Jl. HR Seobrantas",
    "alamat": "Jl. HR. Soebrantas, Kec. Tampan, Kota Pekanbaru",
    "kecamatan": "Tampan",
    "rthNo": 33,
    "lat": 0.464278,
    "lng": 101.379306,
    "trees": [
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 1079
      },
      {
        "jenisPohon": "Mahoni",
        "jumlah": 322
      },
      {
        "jenisPohon": "Pucuk Merah",
        "jumlah": 36
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 28
      },
      {
        "jenisPohon": "Bungur",
        "jumlah": 27
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 21
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 18
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 11
      },
      {
        "jenisPohon": "Palam Ekor Tupai",
        "jumlah": 6
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 4
      },
      {
        "jenisPohon": "Cemara",
        "jumlah": 1
      },
      {
        "jenisPohon": "Kerai Payung",
        "jumlah": 1
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 1
      },
      {
        "jenisPohon": "Kapuk (Waru)",
        "jumlah": 1
      }
    ],
    "totalPohon": 1556
  },
  {
    "id": "pohon-loc-21",
    "seq": 21,
    "excelNo": 20,
    "namaJalan": "Jl. SM Amin",
    "alamat": "Jl. SM. Amin, Kec. Tampan / Payung Sekaki, Kota Pekanbaru",
    "kecamatan": "Tampan / Payung Sekaki",
    "rthNo": 42,
    "lat": 0.498833,
    "lng": 101.394389,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 749
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 486
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 125
      },
      {
        "jenisPohon": "Pucuk Merah",
        "jumlah": 53
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 42
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 10
      },
      {
        "jenisPohon": "Spatodhea",
        "jumlah": 7
      },
      {
        "jenisPohon": "Sengon",
        "jumlah": 4
      },
      {
        "jenisPohon": "Mangga",
        "jumlah": 1
      },
      {
        "jenisPohon": "Jakaranda",
        "jumlah": 1
      },
      {
        "jenisPohon": "Akasia",
        "jumlah": 1
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 1
      }
    ],
    "totalPohon": 1480
  },
  {
    "id": "pohon-loc-22",
    "seq": 22,
    "excelNo": 21,
    "namaJalan": "Jl. Kartama",
    "alamat": "Jl. Kartama (Inpres), Maharatu, Kec. Marpoyan Damai",
    "kecamatan": "Marpoyan Damai",
    "rthNo": null,
    "lat": 0.4521,
    "lng": 101.4302,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 29
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 5
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 1
      }
    ],
    "totalPohon": 35
  },
  {
    "id": "pohon-loc-23",
    "seq": 23,
    "excelNo": 22,
    "namaJalan": "JL. M Yamin",
    "alamat": "Jl. Prof. Moh. Yamin, Kec. Pekanbaru Kota",
    "kecamatan": "Pekanbaru Kota / Senapelan",
    "rthNo": null,
    "lat": 0.5318,
    "lng": 101.4465,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 9
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 7
      },
      {
        "jenisPohon": "Glodogan",
        "jumlah": 2
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 1
      }
    ],
    "totalPohon": 19
  },
  {
    "id": "pohon-loc-24",
    "seq": 24,
    "excelNo": 23,
    "namaJalan": "Jl. Parit Indah",
    "alamat": "Jl. Parit Indah, Tengkerang Labuai, Kec. Bukit Raya",
    "kecamatan": "Bukit Raya",
    "rthNo": 69,
    "lat": 0.478342,
    "lng": 101.468656,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 108
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 102
      },
      {
        "jenisPohon": "Tanjung",
        "jumlah": 82
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 67
      },
      {
        "jenisPohon": "Tabebuya Kuning",
        "jumlah": 38
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 34
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 29
      }
    ],
    "totalPohon": 460
  },
  {
    "id": "pohon-loc-25",
    "seq": 25,
    "excelNo": 24,
    "namaJalan": "Jl. Imam Bonjol",
    "alamat": "Jl. Imam Bonjol, Kec. Pekanbaru Kota",
    "kecamatan": "Pekanbaru Kota",
    "rthNo": null,
    "lat": 0.5256,
    "lng": 101.4488,
    "trees": [
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 31
      }
    ],
    "totalPohon": 31
  },
  {
    "id": "pohon-loc-26",
    "seq": 26,
    "excelNo": 25,
    "namaJalan": "Jl. Ir. Juanda",
    "alamat": "Jl. Ir. H. Juanda, Kp. Dalam, Kec. Senapelan",
    "kecamatan": "Senapelan",
    "rthNo": 67,
    "lat": 0.535897,
    "lng": 101.447414,
    "trees": [
      {
        "jenisPohon": "Kamboja Bali",
        "jumlah": 7
      },
      {
        "jenisPohon": "Mahoni",
        "jumlah": 4
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 1
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 0
      }
    ],
    "totalPohon": 12
  },
  {
    "id": "pohon-loc-27",
    "seq": 27,
    "excelNo": 26,
    "namaJalan": "Jl. Samratulangi",
    "alamat": "Jl. Sam Ratulangi, Kec. Senapelan, Kota Pekanbaru",
    "kecamatan": "Senapelan",
    "rthNo": null,
    "lat": 0.5349,
    "lng": 101.4439,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 23
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 2
      },
      {
        "jenisPohon": "Beringin",
        "jumlah": 1
      }
    ],
    "totalPohon": 26
  },
  {
    "id": "pohon-loc-28",
    "seq": 28,
    "excelNo": 27,
    "namaJalan": "Jl. Balam Sukajadi",
    "alamat": "Jl. Balam, Kp. Melayu, Kec. Sukajadi, Kota Pekanbaru",
    "kecamatan": "Sukajadi",
    "rthNo": null,
    "lat": 0.5179,
    "lng": 101.4368,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 44
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 16
      }
    ],
    "totalPohon": 60
  },
  {
    "id": "pohon-loc-29",
    "seq": 29,
    "excelNo": 28,
    "namaJalan": "Jl. Air Hitam",
    "alamat": "Jl. Air Hitam, Kec. Payung Sekaki, Kota Pekanbaru",
    "kecamatan": "Payung Sekaki",
    "rthNo": 62,
    "lat": 0.502597,
    "lng": 101.384525,
    "trees": [
      {
        "jenisPohon": "Angsana",
        "jumlah": 545
      },
      {
        "jenisPohon": "Mahoni",
        "jumlah": 392
      },
      {
        "jenisPohon": "Trembesi",
        "jumlah": 160
      },
      {
        "jenisPohon": "Spatodhea",
        "jumlah": 90
      },
      {
        "jenisPohon": "Waru Merah",
        "jumlah": 80
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 70
      }
    ],
    "totalPohon": 1337
  },
  {
    "id": "pohon-loc-30",
    "seq": 30,
    "excelNo": 29,
    "namaJalan": "Jl. Harapan Raya",
    "alamat": "Jl. Harapan Raya (H. Imam Munandar), Kota Pekanbaru",
    "kecamatan": "Bukit Raya / Tenayan Raya",
    "rthNo": null,
    "lat": 0.4986,
    "lng": 101.4648,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 303
      },
      {
        "jenisPohon": "Tabebuya",
        "jumlah": 15
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 15
      },
      {
        "jenisPohon": "Tabebuya Rosea",
        "jumlah": 8
      },
      {
        "jenisPohon": "Spatodhea",
        "jumlah": 5
      },
      {
        "jenisPohon": "Pucuk Merah",
        "jumlah": 3
      }
    ],
    "totalPohon": 349
  },
  {
    "id": "pohon-loc-31",
    "seq": 31,
    "excelNo": 30,
    "namaJalan": "Jl. Rajawali",
    "alamat": "Jl. Rajawali, Kp. Melayu, Kec. Sukajadi, Kota Pekanbaru",
    "kecamatan": "Sukajadi",
    "rthNo": 39,
    "lat": 0.508825,
    "lng": 101.433808,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 10
      },
      {
        "jenisPohon": "Jati",
        "jumlah": 3
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 1
      }
    ],
    "totalPohon": 14
  },
  {
    "id": "pohon-loc-32",
    "seq": 32,
    "excelNo": 31,
    "namaJalan": "Jl. KH Ahmad Dahlan",
    "alamat": "Jl. KH. Ahmad Dahlan, Kec. Sukajadi, Kota Pekanbaru",
    "kecamatan": "Sukajadi",
    "rthNo": 94,
    "lat": 0.518917,
    "lng": 101.437772,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 5
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 3
      }
    ],
    "totalPohon": 8
  },
  {
    "id": "pohon-loc-33",
    "seq": 33,
    "excelNo": 32,
    "namaJalan": "Jl. Kuantan Raya",
    "alamat": "Jl. Kuantan Raya, Kec. Lima Puluh / Tenayan Raya",
    "kecamatan": "Lima Puluh / Tenayan Raya",
    "rthNo": 125,
    "lat": 0.536336,
    "lng": 101.468225,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 17
      }
    ],
    "totalPohon": 17
  },
  {
    "id": "pohon-loc-34",
    "seq": 34,
    "excelNo": 33,
    "namaJalan": "Jl. Ronggowarsito",
    "alamat": "Jl. Ronggo Warsito, Suka Maju, Kec. Sail, Kota Pekanbaru",
    "kecamatan": "Sail",
    "rthNo": 56,
    "lat": 0.5132,
    "lng": 101.456361,
    "trees": [
      {
        "jenisPohon": "Tanjung",
        "jumlah": 20
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 16
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 7
      },
      {
        "jenisPohon": "Mahoni",
        "jumlah": 6
      }
    ],
    "totalPohon": 49
  },
  {
    "id": "pohon-loc-35",
    "seq": 35,
    "excelNo": 34,
    "namaJalan": "Jl. Hangtuah",
    "alamat": "Jl. Hangtuah, Kota Pekanbaru",
    "kecamatan": "Tenayan Raya / Sail",
    "rthNo": 66,
    "lat": 0.525331,
    "lng": 101.447778,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 290
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 41
      },
      {
        "jenisPohon": "Tabebuya Kuning",
        "jumlah": 35
      },
      {
        "jenisPohon": "Ketapang",
        "jumlah": 14
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 6
      },
      {
        "jenisPohon": "Pulai",
        "jumlah": 5
      }
    ],
    "totalPohon": 391
  },
  {
    "id": "pohon-loc-36",
    "seq": 36,
    "excelNo": 35,
    "namaJalan": "Jl. Yos Sudarso",
    "alamat": "Jl. Yos Sudarso, Kec. Rumbai / Rumbai Pesisir",
    "kecamatan": "Rumbai / Rumbai Pesisir",
    "rthNo": 47,
    "lat": 0.60175,
    "lng": 101.421694,
    "trees": [
      {
        "jenisPohon": "Mahoni",
        "jumlah": 973
      },
      {
        "jenisPohon": "Ketapang Kencana",
        "jumlah": 185
      },
      {
        "jenisPohon": "Palam Putri",
        "jumlah": 162
      },
      {
        "jenisPohon": "Pucuk Merah",
        "jumlah": 141
      },
      {
        "jenisPohon": "Angsana",
        "jumlah": 129
      },
      {
        "jenisPohon": "Spatodhea",
        "jumlah": 32
      }
    ],
    "totalPohon": 1622
  }
];

export const RTH_TREE_SPECIES_SUMMARY_2026: TreeSpeciesSummary[] = [
  {
    "jenisPohon": "Mahoni",
    "totalPohon": 6966,
    "jumlahLokasi": 34
  },
  {
    "jenisPohon": "Angsana",
    "totalPohon": 2654,
    "jumlahLokasi": 27
  },
  {
    "jenisPohon": "Tabebuya",
    "totalPohon": 1751,
    "jumlahLokasi": 14
  },
  {
    "jenisPohon": "Ketapang",
    "totalPohon": 818,
    "jumlahLokasi": 17
  },
  {
    "jenisPohon": "Pulai",
    "totalPohon": 761,
    "jumlahLokasi": 17
  },
  {
    "jenisPohon": "Ketapang Kencana",
    "totalPohon": 454,
    "jumlahLokasi": 12
  },
  {
    "jenisPohon": "Glodogan",
    "totalPohon": 431,
    "jumlahLokasi": 3
  },
  {
    "jenisPohon": "Tanjung",
    "totalPohon": 361,
    "jumlahLokasi": 15
  },
  {
    "jenisPohon": "Spatodhea",
    "totalPohon": 351,
    "jumlahLokasi": 7
  },
  {
    "jenisPohon": "Spathodea",
    "totalPohon": 349,
    "jumlahLokasi": 4
  },
  {
    "jenisPohon": "Tabebuya Rosea",
    "totalPohon": 333,
    "jumlahLokasi": 9
  },
  {
    "jenisPohon": "Palam Raja",
    "totalPohon": 298,
    "jumlahLokasi": 6
  },
  {
    "jenisPohon": "Palam Putri",
    "totalPohon": 265,
    "jumlahLokasi": 6
  },
  {
    "jenisPohon": "Pucuk Merah",
    "totalPohon": 250,
    "jumlahLokasi": 5
  },
  {
    "jenisPohon": "Trembesi",
    "totalPohon": 248,
    "jumlahLokasi": 11
  },
  {
    "jenisPohon": "Bungur",
    "totalPohon": 219,
    "jumlahLokasi": 5
  },
  {
    "jenisPohon": "Palam Ekor Tupai",
    "totalPohon": 99,
    "jumlahLokasi": 9
  },
  {
    "jenisPohon": "Bintaro",
    "totalPohon": 88,
    "jumlahLokasi": 6
  },
  {
    "jenisPohon": "Waru Merah",
    "totalPohon": 80,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Tabebuya Kuning",
    "totalPohon": 73,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Glodokan Tiang",
    "totalPohon": 50,
    "jumlahLokasi": 5
  },
  {
    "jenisPohon": "Kerai Payung",
    "totalPohon": 40,
    "jumlahLokasi": 5
  },
  {
    "jenisPohon": "Kayu Putih",
    "totalPohon": 39,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Jati",
    "totalPohon": 32,
    "jumlahLokasi": 6
  },
  {
    "jenisPohon": "Zahra",
    "totalPohon": 25,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Beringin",
    "totalPohon": 24,
    "jumlahLokasi": 10
  },
  {
    "jenisPohon": "Akasia",
    "totalPohon": 20,
    "jumlahLokasi": 4
  },
  {
    "jenisPohon": "Pakis Brazil",
    "totalPohon": 18,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Mangga Thailand",
    "totalPohon": 17,
    "jumlahLokasi": 7
  },
  {
    "jenisPohon": "Asam Jawa",
    "totalPohon": 15,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Matoa",
    "totalPohon": 9,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Sungkai",
    "totalPohon": 7,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Kapuk (Waru)",
    "totalPohon": 7,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Kamboja Bali",
    "totalPohon": 7,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Sengon",
    "totalPohon": 6,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Pinus",
    "totalPohon": 5,
    "jumlahLokasi": 3
  },
  {
    "jenisPohon": "Dadap Merah",
    "totalPohon": 5,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Petai",
    "totalPohon": 5,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Flamboyan",
    "totalPohon": 4,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Glodogan tiang",
    "totalPohon": 3,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Jambu air",
    "totalPohon": 2,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Jakaranda",
    "totalPohon": 2,
    "jumlahLokasi": 2
  },
  {
    "jenisPohon": "Kayu putih",
    "totalPohon": 1,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Beringin roda",
    "totalPohon": 1,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Dadap merah",
    "totalPohon": 1,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Cemara",
    "totalPohon": 1,
    "jumlahLokasi": 1
  },
  {
    "jenisPohon": "Mangga",
    "totalPohon": 1,
    "jumlahLokasi": 1
  }
];
