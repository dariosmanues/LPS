# 📚 Dokumentasi API Sistem Informasi LPS (Lembaga Pengelola Sampah)

Dokumentasi lengkap REST API untuk Sistem Informasi Lembaga Pengelola Sampah (LPS) Kota Pekanbaru.

- **Base URL (Local)**: `http://localhost:3000/api`
- **Base URL (Production)**: `https://lps-app-iota.vercel.app/api`
- **Format Data**: JSON (`application/json`)
- **Autentikasi**: Cookie-based Session via NextAuth / Token Header

---

## 📑 Daftar Isi

1. [Autentikasi & Pengguna (Auth & Users)](#1-autentikasi--pengguna-auth--users)
2. [Manajemen Armada (Armada Management)](#2-manajemen-armada-armada-management)
3. [Pencatatan Timbangan & Log Sampah (Waste Logs)](#3-pencatatan-timbangan--log-sampah-waste-logs)
4. [Laporan Bulanan Kinerja LPS (Monthly Reports)](#4-laporan-bulanan-kinerja-lps-monthly-reports)
5. [Laporan Masyarakat & WhatsApp Webhook](#5-laporan-masyarakat--whatsapp-webhook)
6. [Master Wilayah Administratif](#6-master-wilayah-administratif)
7. [Statistik & Analitik (Dashboard Metrics)](#7-statistik--analitik-dashboard-metrics)
8. [Produktivitas: Tugas & Catatan Rapat (To-Do & Notes)](#8-produktivitas-tugas--catatan-rapat-to-do--notes)
9. [Integrasi Perangkat Keras: Timbangan Digital (Serial Port)](#9-integrasi-perangkat-keras-timbangan-digital-serial-port)

---

## 1. Autentikasi & Pengguna (Auth & Users)

### 1.1 Login Pengguna
- **Endpoint**: `POST /auth/login`
- **Deskripsi**: Autentikasi kredensial pengguna dan pembuatan sesi.
- **Request Body**:
```json
{
  "email": "admin@lps.pekanbaru.go.id",
  "password": "admin123"
}
```
- **Response `200 OK`**:
```json
{
  "user": {
    "id": "uuid-string",
    "email": "admin@lps.pekanbaru.go.id",
    "name": "Administrator",
    "role": "ADMIN",
    "transdepo": null,
    "kelurahanId": null
  }
}
```

### 1.2 Logout Pengguna
- **Endpoint**: `POST /auth/logout`
- **Deskripsi**: Menghapus session cookie pengguna.

### 1.3 Ambil Semua Pengguna
- **Endpoint**: `GET /users`
- **Deskripsi**: Mengambil daftar seluruh pengguna sistem beserta relasi kelurahan.
- **Response `200 OK`**:
```json
[
  {
    "id": "c1f7b0a9-...",
    "email": "operator.hj@lps.com",
    "name": "Operator Harapan Jaya",
    "role": "OPERATOR",
    "transdepo": "HARAPAN_JAYA",
    "kelurahanId": null,
    "kelurahan": null,
    "createdAt": "2026-08-18T09:40:58.000Z"
  }
]
```

### 1.4 Tambah Pengguna Baru
- **Endpoint**: `POST /users`
- **Request Body**:
```json
{
  "email": "ketua.tuahkarya@lps.com",
  "password": "password123",
  "name": "Ketua LPS Tuah Karya",
  "role": "LPS_KETUA",
  "kelurahanId": "kelurahan-uuid",
  "transdepo": null
}
```

### 1.5 Update / Hapus Pengguna
- `GET /users/[id]` — Mengambil profil pengguna berdasarkan ID.
- `PUT /users/[id]` — Memperbarui data pengguna, peran, atau password.
- `DELETE /users/[id]` — Menghapus pengguna dari sistem.

---

## 2. Manajemen Armada (Armada Management)

### 2.1 Ambil Daftar Armada
- **Endpoint**: `GET /armada`
- **Query Parameters**:
  - `sortBy`: `createdAt` (default), `kelurahan`, `namaLps`, `platNomor`
- **Response `200 OK`**:
```json
[
  {
    "id": "789092ee-3204-4418-8cc7-d8125d0c02bb",
    "namaLps": "Pemuda Maharani",
    "kelurahanId": "7bc0b4e9-0c33-459a-a7c0-f24d0295784c",
    "platNomor": "BM 8205 TK",
    "noIzinOperasi": "219/DLHK/I-OPS/I/2026",
    "namaSupir": "Ahmad",
    "namaKetuaLps": "MUHAMMAD SIDIQ",
    "noTlpKetuaLps": "08123456789",
    "alamatLps": "JL TENGKU MAHARATU GG. VILLA",
    "wilayahKerja": "KELURAHAN MAHARANI",
    "nomorSkLps": "06.1",
    "tanggalSkLps": "2025-04-30T00:00:00.000Z",
    "tanggalTerbitIzin": "2026-01-18T17:00:00.000Z",
    "lokasiTransdepo": "AIRHITAM",
    "jenisArmada": "PICKUP",
    "qrCode": "ARMADA-BM8205TK",
    "isActive": true,
    "createdAt": "2026-08-18T09:41:18.579Z",
    "updatedAt": "2026-08-18T09:41:18.579Z",
    "kelurahan": {
      "nama": "Maharani",
      "kecamatan": {
        "nama": "Rumbai Barat"
      }
    }
  }
]
```

### 2.2 Daftarkan Armada Baru
- **Endpoint**: `POST /armada`
- **Request Body**:
```json
{
  "namaLps": "LPS Berkah Abadi",
  "kelurahanId": "kelurahan-uuid",
  "platNomor": "BM 1234 XY",
  "noIzinOperasi": "300/DLHK/I-OPS/II/2026",
  "namaSupir": "Budi Santoso",
  "namaKetuaLps": "H. Rahman",
  "noTlpKetuaLps": "081298765432",
  "alamatLps": "Jl. Tuah Karya No. 10",
  "wilayahKerja": "RW 01, RW 02, RW 03",
  "nomorSkLps": "12/SK/LPS/2025",
  "tanggalSkLps": "2025-05-01T00:00:00.000Z",
  "tanggalTerbitIzin": "2026-01-15T00:00:00.000Z",
  "lokasiTransdepo": "HARAPANJAYA",
  "jenisArmada": "PICKUP"
}
```

### 2.3 Update & Hapus Armada
- **Endpoint**: `PATCH /armada/[id]` — Update data armada atau status aktif (`isActive: boolean`).
- **Endpoint**: `DELETE /armada/[id]`
  - Query parameter: `?force=true` untuk menghapus armada beserta seluruh log penimbangan terkait.

### 2.4 Import Excel Armada (Bulk Import)
- **Endpoint**: `POST /armada/import`
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: File Excel (`.xlsx` atau `.xls`)
- **Fitur Cerdas**:
  - Auto-detection baris header tabel Excel.
  - Normalisasi plat nomor dan pencocokan idempoten.
  - Parsing otomatis format tanggal teks Indonesia maupun nomor serial Excel.
  - Auto-matching nama kelurahan ke database.
- **Response `200 OK`**:
```json
{
  "message": "Import processed",
  "stats": {
    "total": 220,
    "created": 180,
    "updated": 40,
    "errors": 0,
    "details": []
  }
}
```

### 2.5 Deteksi Anomali Data Armada
- **Endpoint**: `GET /armada/anomalies`
- **Deskripsi**: Mengidentifikasi data armada yang belum memiliki kelurahan, nomor polisi tidak valid, atau tanggal izin kedaluwarsa.

---

## 3. Pencatatan Timbangan & Log Sampah (Waste Logs)

### 3.1 Ambil Log Penimbangan Sampah
- **Endpoint**: `GET /waste-logs`
- **Query Parameters**:
  - `page`: nomor halaman (default: `1`)
  - `limit`: jumlah data per halaman (default: `50`)
  - `transdepo`: filter transdepo (`AIR_HITAM`, `HARAPAN_JAYA`)
  - `kelurahanId`: filter kelurahan
  - `status`: `MASUK` atau `KELUAR`
  - `startDate`: filter tanggal mulai (`YYYY-MM-DD`)
  - `endDate`: filter tanggal selesai (`YYYY-MM-DD`)
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "log-uuid",
      "armadaId": "armada-uuid",
      "kelurahanId": "kelurahan-uuid",
      "recordedBy": "user-uuid",
      "beratKg": 1450.50,
      "status": "MASUK",
      "recordedAt": "2026-08-18T10:15:00.000Z",
      "armada": {
        "platNomor": "BM 8205 TK",
        "namaLps": "Pemuda Maharani",
        "jenisArmada": "PICKUP"
      },
      "kelurahan": {
        "nama": "Maharani"
      },
      "user": {
        "name": "Operator Air Hitam"
      }
    }
  ],
  "pagination": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "totalPages": 25
  }
}
```

### 3.2 Catat Log Penimbangan Baru (Scanner / Timbangan)
- **Endpoint**: `POST /waste-logs`
- **Request Body**:
```json
{
  "armadaId": "armada-uuid",
  "kelurahanId": "kelurahan-uuid",
  "beratKg": 1620.0,
  "status": "MASUK",
  "metadata": "{\"timbangan_source\":\"SERIAL_COM3\",\"scale_id\":\"INDICATOR_XK3190\"}"
}
```

### 3.3 Validasi QR Code Scanner
- **Endpoint**: `GET /validate-qr?code=ARMADA-BM8205TK`
- **Deskripsi**: Memvalidasi QR Code armada saat masuk/keluar gerbang transdepo dan mengembalikan profil armada & kelurahan terkait.

---

## 4. Laporan Bulanan Kinerja LPS (Monthly Reports)

### 4.1 Ambil Daftar Laporan Bulanan
- **Endpoint**: `GET /laporan-lps`
- **Query Parameters**:
  - `bulan`: Format `YYYY-MM` (contoh: `2026-08`)
  - `kelurahan`: Nama kelurahan (contoh: `Tuah Karya`)

### 4.2 Buat Laporan Bulanan Lengkap
- **Endpoint**: `POST /laporan-lps`
- **Request Body**:
```json
{
  "bulan": "2026-08",
  "kelurahan": "Tuah Karya",
  "latarBelakang": "Laporan evaluasi operasional pengangkutan sampah bulan Agustus 2026.",
  "tujuan": "Meningkatkan kepatuhan retribusi dan efisiensi pengangkutan.",
  "manfaat": "Lingkungan bersih dan teratur.",
  "strukturLPS": "{\"ketua\":\"Andi\",\"sekretaris\":\"Budi\",\"bendahara\":\"Citra\"}",
  "layanan": "Pengangkutan sampah rumah tangga setiap hari Selasa, Kamis, Sabtu.",
  "kinerjaAngkutan": {
    "jumlahArmada": 4,
    "jumlahRumahTangga": "{\"RW01\":120,\"RW02\":140,\"RW03\":110}",
    "jumlahUMKM": 15,
    "jumlahBadanUsaha": 3,
    "permasalahan": "Akses jalan sempit di RW 02",
    "aksiYangDilakukan": "Menggunakan armada bentor untuk gang sempit"
  },
  "kinerjaPengolahan": {
    "programPengolahan": "Bank Sampah Unit & Komposting",
    "volumePemilahanOrganik": 450.0,
    "volumePemilahanUnorganik": 320.0,
    "volumePenjualanOrganik": 200.0,
    "volumePenjualanUnorganik": 300.0,
    "rincianAnorganik": "{\"plastik_kg\":150,\"kardus_kg\":120,\"besi_kg\":30}",
    "programEdukasi": "Sosialisasi pemilahan sampah di RT 01",
    "permasalahan": "Kesadaran warga masih rendah",
    "aksiYangDilakukan": "Edukasi door-to-door"
  },
  "kinerjaIuran": {
    "penerimaanIuran": 12500000,
    "iuranPerRT": 25000,
    "penerimaanLain": 500000,
    "sewaArmada": 2000000,
    "bbm": 2500000,
    "tenagaKerja": 4000000,
    "administrasi": 500000,
    "biayaRapat": 300000,
    "feePetugasPungut": 1000000,
    "gajiPengurus": 1500000,
    "pemanfaatanIuran": "Operasional armada dan upah petugas",
    "permasalahan": "Tunggakan iuran di RW 03",
    "aksiYangDilakukan": "Penagihan intensif"
  }
}
```

### 4.3 Detail, Edit & Hapus Laporan Bulanan
- `GET /laporan-lps/[id]` — Mengambil seluruh sub-laporan kinerja (Angkutan, Pengolahan, Iuran).
- `PUT /laporan-lps/[id]` — Memperbarui data laporan bulanan.
- `DELETE /laporan-lps/[id]` — Menghapus laporan bulanan beserta relasinya.

---

## 5. Laporan Masyarakat & WhatsApp Webhook

### 5.1 WhatsApp Cloud API Webhook Verification
- **Endpoint**: `GET /wa-webhook`
- **Query Parameters**:
  - `hub.mode`: `subscribe`
  - `hub.verify_token`: Nilai `WHATSAPP_VERIFY_TOKEN`
  - `hub.challenge`: Challenge string dari Meta

### 5.2 Menerima Pesan Aduan Warga (WhatsApp Inbound)
- **Endpoint**: `POST /wa-webhook`
- **Deskripsi**: Menerima pesan masuk WhatsApp secara otomatis, mendeteksi kategori laporan (`SAMPAH_MENUMPUK`, `ARMADA_TIDAK_DATANG`, `JADWAL_PENGANGKUTAN`, `IURAN`, `LAINNYA`), menyimpan ke database, dan membalas otomatis (*auto-reply*).

### 5.3 Ambil Daftar Aduan Masyarakat
- **Endpoint**: `GET /laporan-masyarakat`
- **Query Parameters**:
  - `page`: nomor halaman
  - `limit`: limit data
  - `status`: `BARU`, `DIPROSES`, `SELESAI`, `DITOLAK`
  - `kategori`: kategori laporan
  - `search`: cari nomor pengirim / nama / isi aduan

### 5.4 Update Status Aduan & Balas via WhatsApp
- **Endpoint**: `PATCH /laporan-masyarakat/[id]`
- **Request Body**:
```json
{
  "status": "SELESAI",
  "adminNotes": "Armada telah dikerahkan ke lokasi untuk pengangkutan sampah.",
  "replyMessage": "Halo Bpk/Ibu, laporan Anda telah kami tangani. Armada sudah mengangkut sampah di lokasi Anda. Terima kasih."
}
```

---

## 6. Master Wilayah Administratif

### 6.1 Ambil Seluruh Wilayah (Kecamatan & Kelurahan Berjenjang)
- **Endpoint**: `GET /wilayah`
- **Response `200 OK`**:
```json
[
  {
    "id": "kec-uuid",
    "kodeKemendagri": "14.71.08",
    "nama": "Binawidya",
    "kelurahan": [
      {
        "id": "kel-uuid",
        "kodeKemendagri": "14.71.08.001",
        "nama": "Binawidya",
        "qrCode": "KEL-147108001"
      }
    ]
  }
]
```

### 6.2 Ambil Daftar Rata Kelurahan
- **Endpoint**: `GET /kelurahan`
- **Deskripsi**: Daftar seluruh kelurahan kota Pekanbaru beserta relasi kecamatannya.

---

## 7. Statistik & Analitik (Dashboard Metrics)

### 7.1 Ringkasan KPI Utama
- **Endpoint**: `GET /waste-stats`
- **Response `200 OK`**:
```json
{
  "totalTonase": 1420.75,
  "totalLogs": 890,
  "activeArmadaCount": 269,
  "todayWeightKg": 18450.0,
  "transdepoStats": {
    "AIR_HITAM": 780.25,
    "HARAPAN_JAYA": 640.50
  }
}
```

### 7.2 Tren Bulanan Sampah
- **Endpoint**: `GET /waste-stats/monthly`
- **Response `200 OK`**: Data tonase sampah teragregasi per bulan untuk visualisasi diagram Recharts.

---

## 8. Produktivitas: Tugas & Catatan Rapat (To-Do & Notes)

### 8.1 Manajemen To-Do Task
- `GET /todos` — Ambil daftar tugas agenda kegiatan.
- `POST /todos` — Tambah tugas baru (`{ text, category, date }`).
- `PUT /todos` — Update status selesai (`{ id, isDone }`).
- `DELETE /todos` — Hapus tugas.

### 8.2 Catatan & Ringkasan Rapat (Meeting Notes & Summaries)
- `GET /meeting-notes` / `POST /meeting-notes` — Upload & lihat berkas lampiran rapat (PDF/gambar).
- `GET /meeting-summary` / `POST /meeting-summary` — Mengelola notula rapat aktif.
- `GET /meeting-summary/archive` / `POST /meeting-summary/archive` — Mengarsipkan notula rapat terdahulu.

---

## 9. Integrasi Perangkat Keras: Timbangan Digital (Serial Port)

### 9.1 Komunikasi Serial Port Timbangan Digital
- **Endpoint**: `GET /serial`
  - Mengambil daftar port COM / Serial yang terdeteksi di perangkat (misal: `COM1`, `COM3`, `/dev/ttyUSB0`).
- **Endpoint**: `POST /serial`
  - Membuka koneksi serial port ke indikator timbangan digital (*Weighbridge Indicator*) dan membaca berat stabil secara real-time.
- **Request Body**:
```json
{
  "port": "COM3",
  "baudRate": 9600
}
```

---

## 🔒 Standar Kode Status HTTP

| Kode HTTP | Arti | Keterangan |
|---|---|---|
| `200 OK` | Sukses | Permintaan berhasil diproses. |
| `201 Created` | Data Dibuat | Data baru berhasil ditambahkan ke database. |
| `400 Bad Request` | Permintaan Tidak Valid | Parameter atau body JSON tidak lengkap/salah format. |
| `401 Unauthorized` | Belum Terautentikasi | Pengguna belum login atau token tidak valid. |
| `403 Forbidden` | Akses Ditolak | Peran pengguna tidak memiliki hak akses endpoint ini. |
| `404 Not Found` | Tidak Ditemukan | Resource atau ID yang diminta tidak ada. |
| `409 Conflict` | Konflik Data | Data unik sudah ada (misal Plat Nomor) atau terikat relasi. |
| `500 Server Error` | Kesalahan Server | Kesalahan internal saat memproses request. |
