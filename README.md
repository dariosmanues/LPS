# Aplikasi Dashboard LPS (Lembaga Pengelola Sampah)

Aplikasi ini adalah sistem informasi berbasis web yang dibangun menggunakan **Next.js** untuk mengelola data operasional Lembaga Pengelola Sampah (LPS). Sistem ini memfasilitasi pencatatan data armada, log penimbangan sampah, laporan bulanan kinerja LPS, serta laporan masyarakat.

## 🚀 Teknologi Utama

- **Framework**: [Next.js](https://nextjs.org) (App Router, v16)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: SQLite (Development)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Autentikasi**: [NextAuth.js](https://next-auth.js.org/)
- **Lain-lain**: Recharts (Grafik), HTML5-QRCode (Scanner), ExcelJS (Export/Import), SerialPort (Integrasi Timbangan)

## 🌟 Fitur Utama

1. **Manajemen Pengguna & Peran (Role-Based Access)**
   - Mendukung berbagai peran: `ADMIN`, `OPERATOR`, `LPS_KETUA`, `LPS_SEKRETARIS`, dan `LPS_BENDAHARA`.
   - Akses dasbor yang disesuaikan berdasarkan peran dan Kelurahan.

2. **Manajemen Armada & QR Code**
   - Pendaftaran kendaraan pengangkut sampah (Armada).
   - Pembuatan QR Code otomatis untuk setiap armada.
   - Fitur _Scanner_ untuk mencatat log keluar-masuk armada dan berat sampah.

3. **Pencatatan Log Sampah (Waste Logs)**
   - Integrasi pencatatan berat sampah (mendukung integrasi dengan timbangan digital via serial port).
   - Pemantauan data masuk dan keluar sampah dari depo (Transdepo).

4. **Laporan Bulanan Kinerja LPS**
   - Pencatatan kinerja angkutan (jumlah armada, rumah tangga, dll).
   - Pencatatan kinerja pengolahan sampah (organik/anorganik).
   - Pencatatan laporan keuangan dan iuran warga.

5. **Laporan Masyarakat via WhatsApp**
   - Fitur untuk menerima dan mengelola aduan/laporan dari masyarakat yang dikirimkan melalui WhatsApp.

6. **Manajemen Rapat & Tugas (To-Do)**
   - Pencatatan ringkasan rapat (Meeting Notes) dan To-Do list.

## ⚙️ Persyaratan Sistem

- Node.js versi 18 atau lebih baru (disarankan Node 20+)
- NPM, Yarn, atau PNPM

## 🛠️ Instalasi & Menjalankan Aplikasi

1. **Clone repository ini** (jika belum).
2. **Install dependensi:**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment:**
   Buat file `.env` di root folder (bisa menyalin dari `.env.example` jika tersedia) dan atur variabel yang dibutuhkan, seperti:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   NEXTAUTH_URL="http://localhost:3000"
   ```
4. **Setup Database (Prisma):**
   Jalankan migrasi skema database ke SQLite lokal, lalu jalankan seed data awal jika perlu.
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
6. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🗄️ Struktur Database (Schema Prisma)

Database dibagi menjadi beberapa entitas/model utama:
- **`User`**: Data pengguna sistem beserta peran (role).
- **`Kecamatan` & `Kelurahan`**: Data wilayah administratif.
- **`Armada`**: Data kendaraan operasional milik LPS.
- **`WasteLog`**: Catatan harian berat timbangan sampah per armada.
- **`LaporanBulanan`**: Laporan agregat yang diisi oleh pengurus LPS setiap bulan (mencakup Kinerja Angkutan, Pengolahan, dan Iuran).
- **`LaporanMasyarakat`**: Data aduan warga (terintegrasi dengan pesan WhatsApp).
- **`MeetingNote`, `ToDo`, `MeetingSummary`**: Fitur produktivitas untuk mencatat rapat dan tugas.

## 🔧 Script NPM yang Tersedia

- `npm run dev`: Menjalankan aplikasi dalam mode development.
- `npm run build`: Mem-build aplikasi untuk production (termasuk generate Prisma client).
- `npm run start`: Menjalankan aplikasi production setelah di-build.
- `npm run lint`: Menjalankan linter untuk mendeteksi error pada kode.
- `npm run db:push`: Sinkronisasi skema Prisma dengan database tanpa perlu membuat file migrasi manual (cocok untuk development/prototyping).
- `npm run db:seed`: Mengisi database dengan data awal.
- `npm run db:studio`: Membuka antarmuka grafis Prisma Studio untuk melihat dan mengedit data langsung di browser.

---

## 📢 Dokumentasi Fitur: Laporan Masyarakat

Fitur **Laporan Masyarakat** memungkinkan warga untuk mengirimkan aduan atau laporan terkait pengelolaan sampah melalui **WhatsApp**, dan admin LPS dapat mengelola serta membalas laporan tersebut dari dashboard web.

### Arsitektur & Alur Kerja

```
Warga (WhatsApp) ──► Meta Cloud API ──► /api/wa-webhook (POST)
                                              │
                                              ├─ Parse pesan (parseWebhookMessage)
                                              ├─ Deteksi kategori otomatis (detectKategori)
                                              ├─ Simpan ke database (LaporanMasyarakat)
                                              └─ Kirim auto-reply ke warga (sendAutoReply)
                                              
Admin Dashboard (/dashboard/laporan-masyarakat)
       │
       ├─ Lihat semua laporan ──► GET /api/laporan-masyarakat
       ├─ Ubah status/kategori ──► PATCH /api/laporan-masyarakat/:id
       ├─ Balas via WhatsApp ──► PATCH /api/laporan-masyarakat/:id (+ sendAdminReply)
       └─ Hapus laporan ──► DELETE /api/laporan-masyarakat/:id
```

### Model Database (`LaporanMasyarakat`)

| Field          | Tipe       | Keterangan                                                                 |
|----------------|------------|----------------------------------------------------------------------------|
| `id`           | `String`   | UUID, Primary Key                                                          |
| `waMessageId`  | `String?`  | ID pesan WhatsApp (unique, untuk mencegah duplikasi)                       |
| `senderPhone`  | `String`   | Nomor telepon pengirim                                                     |
| `senderName`   | `String?`  | Nama profil pengirim dari WhatsApp                                         |
| `message`      | `String`   | Isi pesan/aduan dari warga                                                 |
| `mediaUrl`     | `String?`  | ID media (gambar/dokumen) jika ada lampiran                                |
| `kategori`     | `String`   | Kategori laporan (default: `LAINNYA`)                                      |
| `status`       | `String`   | Status penanganan (default: `BARU`)                                        |
| `adminNotes`   | `String?`  | Catatan internal admin                                                     |
| `replyMessage` | `String?`  | Pesan balasan yang dikirim ke warga                                        |
| `repliedAt`    | `DateTime?`| Waktu balasan dikirim                                                      |
| `createdAt`    | `DateTime` | Waktu laporan diterima                                                     |
| `updatedAt`    | `DateTime` | Waktu terakhir diperbarui                                                  |

### Kategori Laporan

Kategori terdeteksi secara **otomatis** berdasarkan kata kunci dalam pesan warga:

| Kategori                | Kata Kunci Pemicu                                                   | Emoji |
|-------------------------|----------------------------------------------------------------------|-------|
| `SAMPAH_MENUMPUK`       | "sampah" + "menumpuk", "numpuk", "banyak", "berserakan"             | 🗑️    |
| `ARMADA_TIDAK_DATANG`   | "armada", "truk", "mobil sampah", "tidak datang", "tidak lewat"     | 🚛    |
| `JADWAL_PENGANGKUTAN`   | "jadwal", "kapan", "jam berapa"                                      | 📅    |
| `IURAN`                 | "iuran", "bayar", "tagihan", "biaya"                                | 💰    |
| `LAINNYA`               | Jika tidak terdeteksi kata kunci di atas                             | 📋    |

### Status Penanganan

| Status      | Warna   | Keterangan                                      |
|-------------|---------|--------------------------------------------------|
| `BARU`      | 🔵 Biru   | Laporan baru masuk, belum ditangani              |
| `DIPROSES`  | 🟡 Kuning | Sedang dalam proses penanganan admin             |
| `SELESAI`   | 🟢 Hijau  | Laporan telah selesai ditangani                  |
| `DITOLAK`   | 🔴 Merah  | Laporan ditolak (bukan ranah LPS, spam, dll)     |

### API Endpoints

#### 1. WhatsApp Webhook — `/api/wa-webhook`

| Method | Deskripsi                                                        |
|--------|------------------------------------------------------------------|
| `GET`  | Verifikasi webhook dari Meta (hub.mode, hub.verify_token, hub.challenge) |
| `POST` | Menerima pesan masuk dari WhatsApp Cloud API. Pesan akan di-parse, disimpan ke database, dan auto-reply akan dikirim ke pengirim. |

#### 2. Laporan Masyarakat — `/api/laporan-masyarakat`

| Method | Deskripsi                                                        |
|--------|------------------------------------------------------------------|
| `GET`  | Mengambil daftar laporan dengan dukungan filter (`status`, `kategori`, `search`) dan paginasi (`page`, `limit`). Mengembalikan data, statistik per status, dan info paginasi. |
| `POST` | Membuat laporan secara manual (untuk admin/testing). Body: `{ senderPhone, senderName?, message, kategori? }` |

#### 3. Detail Laporan — `/api/laporan-masyarakat/:id`

| Method   | Deskripsi                                                      |
|----------|----------------------------------------------------------------|
| `GET`    | Mengambil detail satu laporan berdasarkan ID                   |
| `PATCH`  | Memperbarui status, kategori, catatan admin, dan/atau mengirim balasan WhatsApp. Body: `{ status?, kategori?, adminNotes?, replyMessage? }` |
| `DELETE` | Menghapus laporan                                              |

### Dashboard UI (`/dashboard/laporan-masyarakat`)

Halaman dashboard untuk admin mengelola laporan masyarakat, terdiri dari:

1. **Statistik Card** — Menampilkan jumlah laporan per status (Total, Baru, Diproses, Selesai, Ditolak)
2. **Filter & Pencarian** — Filter berdasarkan status, kategori, dan pencarian teks bebas (nama, nomor HP, isi pesan)
3. **Tabel Laporan** — Daftar laporan dengan kolom: Pengirim, Pesan, Kategori, Status, Waktu, dan Aksi cepat (Proses / Selesai)
4. **Modal Detail** — Klik baris untuk melihat detail lengkap, mengubah kategori/status, menulis catatan admin, dan mengirim balasan WhatsApp

### WhatsApp Cloud API Client (`src/lib/wa-client.ts`)

Library helper untuk integrasi dengan WhatsApp Business Cloud API:

| Fungsi                 | Deskripsi                                                               |
|------------------------|-------------------------------------------------------------------------|
| `sendWhatsAppMessage`  | Mengirim pesan teks ke nomor WhatsApp via Cloud API                     |
| `sendAutoReply`        | Mengirim balasan otomatis saat laporan baru diterima                    |
| `sendAdminReply`       | Mengirim balasan manual dari admin ke warga                             |
| `verifyWebhook`        | Memverifikasi challenge dari Meta saat registrasi webhook               |
| `parseWebhookMessage`  | Mem-parse payload webhook masuk menjadi objek terstruktur               |
| `detectKategori`       | Mendeteksi kategori laporan secara otomatis dari teks pesan             |

### Konfigurasi Environment (`.env`)

Untuk mengaktifkan integrasi WhatsApp, tambahkan variabel berikut ke file `.env`:

```env
# WhatsApp Cloud API (Meta for Developers)
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_ACCESS_TOKEN="your_permanent_access_token"
WHATSAPP_VERIFY_TOKEN="lps_verify_token_2026"
```

> **Catatan:** Jika variabel WhatsApp tidak dikonfigurasi, sistem tetap berjalan normal tetapi fitur pengiriman pesan WhatsApp (auto-reply dan balasan admin) akan dilewati secara _graceful_ tanpa error.

### Cara Setup Webhook WhatsApp

1. Buka [Meta for Developers](https://developers.facebook.com/) dan buat/pilih aplikasi WhatsApp Business.
2. Di menu **Webhooks**, klik **Subscribe** dan isi:
   - **Callback URL**: `https://your-domain.com/api/wa-webhook`
   - **Verify Token**: Sesuaikan dengan nilai `WHATSAPP_VERIFY_TOKEN` di `.env`
3. Subscribe ke field: `messages`
4. Pastikan nomor telepon WhatsApp Business sudah terdaftar dan aktif.
