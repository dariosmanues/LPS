'use client';

import { useState } from 'react';

const guideSections = [
    {
        id: 'overview',
        title: 'Pengenalan Sistem (Overview)',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        content: (
            <div className="space-y-4 text-gray-600">
                <p>
                    Aplikasi Dashboard LPS adalah sistem informasi yang digunakan untuk mengelola data operasional Lembaga Pengelola Sampah (LPS).
                </p>
                <p>
                    Sistem ini terbagi dalam beberapa tingkatan peran (role) akses:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>ADMIN:</strong> Memiliki akses penuh terhadap seluruh fitur dan data di semua wilayah.</li>
                    <li><strong>OPERATOR:</strong> Bertanggung jawab mencatat operasional harian seperti penimbangan sampah, scanner QR, dan membalas aduan warga.</li>
                    <li><strong>LPS KETUA, SEKRETARIS, BENDAHARA:</strong> Akses khusus bagi pengurus LPS untuk melihat laporan, statistik, dan pencatatan notulen rapat.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'armada',
        title: 'Manajemen Armada & QR Code',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
        content: (
            <div className="space-y-4 text-gray-600">
                <p>
                    Menu <strong>Armada</strong> digunakan untuk mencatat dan mendaftarkan kendaraan pengangkut sampah (Gerobak/Truk) yang beroperasi.
                </p>
                <h4 className="font-semibold text-gray-800">Cara Mendaftarkan Armada Baru:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                    <li>Buka menu <span className="font-medium">Armada</span> di panel samping.</li>
                    <li>Klik tombol <span className="font-medium text-purple-600">Tambah Armada</span>.</li>
                    <li>Isi formulir seperti Nomor Polisi, Jenis Kendaraan, Nama Penanggung Jawab, dan pilih Kelurahan operasional.</li>
                    <li>Klik <strong>Simpan</strong>. Sistem akan otomatis menghasilkan QR Code unik untuk kendaraan tersebut.</li>
                </ol>
                <h4 className="font-semibold text-gray-800 mt-4">Mencetak QR Code:</h4>
                <p>Buka menu <strong>QR Codes</strong>. Pilih armada dan cetak QR Code. Tempelkan QR Code yang telah dicetak pada kendaraan armada fisik.</p>
            </div>
        )
    },
    {
        id: 'scanner',
        title: 'Scanner & Pencatatan Log Timbangan',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        ),
        content: (
            <div className="space-y-4 text-gray-600">
                <p>
                    Saat armada masuk ke Transdepo, operator akan menggunakan fitur Scanner untuk mencatat berat sampah.
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                    <li>Buka menu <span className="font-medium">Scan QR Code</span> dari halaman utama (jika menggunakan HP/Tablet).</li>
                    <li>Arahkan kamera ke QR Code yang tertempel di armada.</li>
                    <li>Sistem akan mendeteksi identitas armada.</li>
                    <li>Isi berat sampah pada form yang muncul (jika timbangan terintegrasi, angka mungkin muncul otomatis).</li>
                    <li>Pilih Tipe Log: <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">MASUK</span> (Saat membawa sampah penuh) atau <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">KELUAR</span> (Saat membawa residu).</li>
                    <li>Klik <strong>Simpan Log</strong>. Data historis ini dapat dilihat pada menu <strong>Riwayat</strong>.</li>
                </ol>
            </div>
        )
    },
    {
        id: 'laporan-warga',
        title: 'Manajemen Aduan Warga (WhatsApp)',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        ),
        content: (
            <div className="space-y-4 text-gray-600">
                <p>
                    Warga dapat melaporkan aduan terkait layanan (misal: sampah menumpuk, armada belum datang) langsung ke nomor WhatsApp sistem. Pesan tersebut otomatis masuk ke Dashboard.
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                    <li>Buka menu <span className="font-medium">Aduan Warga</span>.</li>
                    <li>Anda akan melihat laporan dengan status <strong>Baru</strong> (Biru).</li>
                    <li>Klik laporan tersebut untuk membuka detail.</li>
                    <li>Ubah status menjadi <strong>Diproses</strong> jika sedang ditindaklanjuti.</li>
                    <li>Ketik balasan untuk warga pada kolom <span className="font-medium">Balas Pesan WA</span>, lalu klik Kirim. Pesan akan terkirim langsung ke WA pelapor.</li>
                    <li>Ubah status menjadi <strong>Selesai</strong> jika aduan telah tertangani dengan baik.</li>
                </ol>
            </div>
        )
    },
    {
        id: 'laporan-lps',
        title: 'Pengisian Laporan Bulanan LPS',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        content: (
            <div className="space-y-4 text-gray-600">
                <p>
                    Setiap bulan, pengurus (Ketua/Sekretaris/Bendahara) perlu mengisi data Kinerja Angkutan, Pengolahan, dan Laporan Iuran.
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                    <li>Buka menu <span className="font-medium">Laporan LPS</span>.</li>
                    <li>Klik <strong>Tambah Laporan</strong> untuk bulan berjalan.</li>
                    <li>Isi jumlah KK yang dilayani, frekuensi angkutan, produksi sampah organik/anorganik, dan data iuran finansial (Target Iuran & Realisasi).</li>
                    <li>Sistem akan secara otomatis memvisualisasikan data tersebut pada chart/grafik di Halaman Utama Dashboard (Overview).</li>
                </ol>
            </div>
        )
    },
    {
        id: 'notes',
        title: 'Catatan Rapat & To-Do',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        content: (
            <div className="space-y-4 text-gray-600">
                <p>
                    Gunakan fitur <strong>Catatan Rapat</strong> untuk mencatat hasil diskusi, merencanakan tindak lanjut (To-Do List), dan menugaskan pihak-pihak yang bertanggung jawab.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Tambahkan Rapat Baru, tentukan tanggal, topik, dan peserta.</li>
                    <li>Buat poin-poin keputusan rapat pada bagian Catatan.</li>
                    <li>Tambahkan <strong>To-Do</strong> item jika ada tindak lanjut. To-do ini bisa dicentang (selesai) setelah dikerjakan.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'transform-pembelian',
        title: 'Transform Laporan Pembelian',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        ),
        content: (
            <div className="space-y-4 text-gray-600">
                <p>
                    Fitur <strong>Transform Laporan Pembelian</strong> digunakan untuk mengkonversi data laporan transaksi pembelian (format Excel .xls/.xlsx) ke format rekapitulasi standar yang digunakan sistem.
                </p>
                <h4 className="font-semibold text-gray-800">Cara Menggunakan Fitur Transform:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                    <li>Buka menu <span className="font-medium">Transform Pembelian</span>.</li>
                    <li>Siapkan file sumber laporan pembelian dalam format Excel (.xlsx atau .xls).</li>
                    <li>Upload file dengan cara drag & drop ke area yang disediakan, atau klik untuk memilih file dari komputer Anda.</li>
                    <li>Klik tombol <span className="font-medium text-emerald-600">Transform & Download</span>.</li>
                    <li>Sistem akan memproses file dan secara otomatis mengunduh hasil rekapitulasi berupa file baru (<span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-sm">Rekapitulasi_Pembelian.xlsx</span>).</li>
                </ol>
                <h4 className="font-semibold text-gray-800 mt-4">Aturan Pemetaan Kolom:</h4>
                <p>Sistem secara otomatis menyesuaikan kolom dari file sumber Anda. Pastikan file sumber memiliki kolom dengan nama berikut (atau mendekati):</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>No. Transaksi</strong> diubah menjadi <strong>NO TIKET</strong></li>
                    <li><strong>Plat No</strong> diubah menjadi <strong>NO POLISI</strong></li>
                    <li><strong>Nama Supir</strong> diubah menjadi <strong>NAMA SUPIR</strong></li>
                    <li><strong>Nama Kebun</strong> diubah menjadi <strong>PENGIRIM</strong> (simbol khusus dibersihkan otomatis)</li>
                    <li><strong>Transaksi Timbang 1</strong> diubah menjadi <strong>GROSS (KG)</strong></li>
                    <li><strong>Transaksi Timbang 2</strong> diubah menjadi <strong>TARE (KG)</strong></li>
                </ul>
                <p className="text-sm mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    Sistem juga akan menambahkan kolom hitungan otomatis seperti <strong>NETTO 1</strong> (Gross − Tare), <strong>NETTO 2</strong> (sama dengan Netto 1), <strong>RAFAKSI</strong> (selalu 0), dan nomor urut.
                </p>
            </div>
        )
    }
];

export default function UserGuidePage() {
    const [openSection, setOpenSection] = useState<string | null>('overview');

    const toggleSection = (id: string) => {
        setOpenSection(openSection === id ? null : id);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Panduan Pengguna (User Guide)
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Pelajari cara menggunakan berbagai fitur di Aplikasi Dashboard LPS secara efektif.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {guideSections.map((section) => (
                        <div key={section.id} className="group">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50/50 transition-colors duration-200"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className={`p-2 rounded-xl flex-shrink-0 transition-colors duration-200 ${
                                        openSection === section.id 
                                            ? 'bg-purple-100 text-purple-600' 
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-500'
                                    }`}>
                                        {section.icon}
                                    </div>
                                    <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                                        openSection === section.id ? 'text-purple-900' : 'text-gray-900 group-hover:text-purple-700'
                                    }`}>
                                        {section.title}
                                    </h3>
                                </div>
                                <div className={`ml-4 flex-shrink-0 transform transition-transform duration-200 ${
                                    openSection === section.id ? 'rotate-180' : ''
                                }`}>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === section.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-6 pt-0 pb-8 pl-16">
                                    <div className="prose prose-purple max-w-none">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-blue-900">Butuh Bantuan Lain?</h4>
                        <p className="mt-1 text-blue-700">
                            Jika Anda mengalami kendala atau membutuhkan bantuan lebih lanjut terkait sistem, silakan hubungi tim Administrator Teknis (IT Support) di wilayah Anda atau melalui saluran dukungan resmi.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
