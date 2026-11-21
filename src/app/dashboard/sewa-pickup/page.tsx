'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { GlassCard } from '@/components/ui';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

interface ArmadaPickUp {
    no: number;
    plate: string;
    cleanPlate: string;
    qrCode: string;
    status: 'UTAMA' | 'UTAMA_OKT' | 'ROTASI_KIR';
    desc: string;
    stnk: boolean;
    kir: boolean;
    suratKir: boolean;
    kondisi: string;
    substitusiRef?: string;
}

const PICKUP_DATA: ArmadaPickUp[] = [
    { no: 1, plate: 'BM 8744 QG', cleanPlate: 'BM8744QG', qrCode: 'LPS-BM8744QG-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 01 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 2, plate: 'BM 8508 QR', cleanPlate: 'BM8508QR', qrCode: 'LPS-BM8508QR-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 02 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 3, plate: 'BM 8322 QQ', cleanPlate: 'BM8322QQ', qrCode: 'LPS-BM8322QQ-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 03 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 4, plate: 'BM 8549 QG', cleanPlate: 'BM8549QG', qrCode: 'LPS-BM8549QG-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 04 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 5, plate: 'BM 8244 CN', cleanPlate: 'BM8244CN', qrCode: 'LPS-BM8244CN-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 05 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 6, plate: 'BM 8687 QE', cleanPlate: 'BM8687QE', qrCode: 'LPS-BM8687QE-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 06 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 7, plate: 'BM 8984 QA', cleanPlate: 'BM8984QA', qrCode: 'LPS-BM8984QA-PERMANEN', status: 'UTAMA_OKT', desc: 'Unit Sewa 07 - Alokasi Utama Oktober', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BM 8489 SM' },
    { no: 8, plate: 'BM 8250 QG', cleanPlate: 'BM8250QG', qrCode: 'LPS-BM8250QG-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 08 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 9, plate: 'BM 8454 QG', cleanPlate: 'BM8454QG', qrCode: 'LPS-BM8454QG-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 09 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 10, plate: 'BM 8422 SK', cleanPlate: 'BM8422SK', qrCode: 'LPS-BM8422SK-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 10 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 11, plate: 'BM 8030 ZD', cleanPlate: 'BM8030ZD', qrCode: 'LPS-BM8030ZD-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 11 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 12, plate: 'BM 8483 QE', cleanPlate: 'BM8483QE', qrCode: 'LPS-BM8483QE-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 12 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 13, plate: 'BM 8418 QG', cleanPlate: 'BM8418QG', qrCode: 'LPS-BM8418QG-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 13 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 14, plate: 'BM 8589 QG', cleanPlate: 'BM8589QG', qrCode: 'LPS-BM8589QG-PERMANEN', status: 'UTAMA_OKT', desc: 'Unit Sewa 14 - Alokasi Utama Oktober', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BM 8377 PI' },
    { no: 15, plate: 'BM 8872 QM', cleanPlate: 'BM8872QM', qrCode: 'LPS-BM8872QM-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 15 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 16, plate: 'BM 8653 QI', cleanPlate: 'BM8653QI', qrCode: 'LPS-BM8653QI-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 16 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 17, plate: 'BM 8275 QM', cleanPlate: 'BM8275QM', qrCode: 'LPS-BM8275QM-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 17 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 18, plate: 'BA 8363 SAA', cleanPlate: 'BA8363SAA', qrCode: 'LPS-BA8363SAA-PERMANEN', status: 'UTAMA_OKT', desc: 'Unit Sewa 18 - Alokasi Utama Oktober', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BM 8296 QK' },
    { no: 19, plate: 'BM 8723 ZC', cleanPlate: 'BM8723ZC', qrCode: 'LPS-BM8723ZC-PERMANEN', status: 'UTAMA_OKT', desc: 'Unit Sewa 19 - Alokasi Utama Oktober', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BM 8122 CM' },
    { no: 20, plate: 'BM 8063 DS', cleanPlate: 'BM8063DS', qrCode: 'LPS-BM8063DS-PERMANEN', status: 'UTAMA', desc: 'Unit Sewa 20 - Pick Up 11 Kecamatan', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK' },
    { no: 21, plate: 'BM 8489 SM', cleanPlate: 'BM8489SM', qrCode: 'LPS-BM8489SM-PERMANEN', status: 'ROTASI_KIR', desc: 'Unit Rotasi 07b - Tercatat Uji KIR', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BM 8984 QA' },
    { no: 22, plate: 'BM 8377 PI', cleanPlate: 'BM8377PI', qrCode: 'LPS-BM8377PI-PERMANEN', status: 'ROTASI_KIR', desc: 'Unit Rotasi 14b - Tercatat Uji KIR', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BM 8589 QG' },
    { no: 23, plate: 'BM 8296 QK', cleanPlate: 'BM8296QK', qrCode: 'LPS-BM8296QK-PERMANEN', status: 'ROTASI_KIR', desc: 'Unit Rotasi 18b - Tercatat Uji KIR', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BA 8363 SAA' },
    { no: 24, plate: 'BM 8122 CM', cleanPlate: 'BM8122CM', qrCode: 'LPS-BM8122CM-PERMANEN', status: 'ROTASI_KIR', desc: 'Unit Rotasi 19b - Tercatat Uji KIR', stnk: true, kir: true, suratKir: true, kondisi: 'BAIK', substitusiRef: 'BM 8723 ZC' },
];

const CHECKLIST_ITEMS = [
    { no: 1, item: 'STNK', status: 'ADA', kondisi: 'BAIK / VALID', ket: 'Pajak & Pengesahan Aktif' },
    { no: 2, item: 'KIR', status: 'ADA', kondisi: 'BAIK / VALID', ket: 'Uji Berkala Dishub Terpenuhi' },
    { no: 3, item: 'BAN (Depan & Belakang)', status: 'ADA', kondisi: 'BAIK / TEBAL', ket: 'Kembang Ban Layak Jalan' },
    { no: 4, item: 'BAN SERAP', status: 'ADA', kondisi: 'BAIK', ket: 'Tekanan Angin Standar' },
    { no: 5, item: 'SPION (Kanan / Kiri / Belakang)', status: 'ADA', kondisi: 'LENGKAP & UTUH', ket: 'Pandangan Pengemudi Jelas' },
    { no: 6, item: 'LAMPU UTAMA (Depan)', status: 'ADA', kondisi: 'MENYALA NORMAL', ket: 'Jauh & Dekat Berfungsi' },
    { no: 7, item: 'LAMPU SIGN (Kanan / Kiri)', status: 'ADA', kondisi: 'MENYALA NORMAL', ket: 'Depan & Belakang Berfungsi' },
    { no: 8, item: 'LAMPU REM', status: 'ADA', kondisi: 'MENYALA NORMAL', ket: 'Aktif saat Pengereman' },
    { no: 9, item: 'KLAKSON', status: 'ADA', kondisi: 'BERBUNYI NYARING', ket: 'Standar Keselamatan' },
    { no: 10, item: 'BAK BARANG BELAKANG', status: 'ADA', kondisi: 'KOKOH & TERAWAT', ket: 'Kapasitas Angkut Sampah Standar' },
];

export default function SewaPickUpPage() {
    const { data: session } = useSession();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'UTAMA' | 'ROTASI_KIR'>('ALL');
    const [activeTab, setActiveTab] = useState<'armada' | 'checklist' | 'komparasi' | 'cetak_massal' | 'pengesahan'>('armada');
    const [selectedArmada, setSelectedArmada] = useState<ArmadaPickUp | null>(null);
    const [activeRoleView, setActiveRoleView] = useState<'dzakwan' | 'santi' | 'sal'>('dzakwan');
    const printAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const email = session?.user?.email?.toLowerCase() || '';
        if (email.includes('santi')) setActiveRoleView('santi');
        else if (email.includes('sal')) setActiveRoleView('sal');
        else if (email.includes('dzakwan')) setActiveRoleView('dzakwan');
    }, [session]);

    const filteredArmada = PICKUP_DATA.filter((a) => {
        const matchesSearch =
            a.plate.toLowerCase().includes(search.toLowerCase()) ||
            a.desc.toLowerCase().includes(search.toLowerCase()) ||
            a.qrCode.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === 'ALL'
                ? true
                : statusFilter === 'UTAMA'
                    ? a.status === 'UTAMA' || a.status === 'UTAMA_OKT'
                    : a.status === 'ROTASI_KIR';
        return matchesSearch && matchesStatus;
    });

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const armadaRows = [
            ['REKAPITULASI SEWA KENDARAAN PERSAMPAHAN (11 KECAMATAN) - DLHK KOTA PEKANBARU'],
            ['PERIODE 01 OKTOBER 2026 s/d 31 OKTOBER 2026 - JENIS: PICK UP'],
            ['STATUS: 100% MENGGUNAKAN QR PERMANEN'],
            [],
            ['NO', 'NO POLISI', 'ALOKASI UNIT', 'DESKRIPSI', 'TOKEN QR PERMANEN', 'STNK', 'KIR', 'KONDISI FISIK', 'SUBSTITUSI / ROTASI'],
            ...PICKUP_DATA.map((a) => [
                a.no,
                a.plate,
                a.status,
                a.desc,
                a.qrCode,
                a.stnk ? 'VALID' : 'TIDAK',
                a.kir ? 'VALID' : 'TIDAK',
                a.kondisi,
                a.substitusiRef || '-',
            ]),
        ];

        const checklistRows = [
            ['DAFTAR CHECKLIST FISIK KENDARAAN PICK UP SEWA DLHK PEKANBARU'],
            ['PETUGAS PEMERIKSA: SAL PRIADI (PENGAWAS LAPANGAN)'],
            [],
            ['NO', 'KOMPONEN KENDARAAN', 'STATUS', 'KONDISI', 'KETERANGAN'],
            ...CHECKLIST_ITEMS.map((c) => [c.no, c.item, c.status, c.kondisi, c.ket]),
        ];

        const pengesahanRows = [
            ['LEMBAR PENGESAHAN DOKUMEN SEWA KENDARAAN PICK UP'],
            ['DINAS LINGKUNGAN HIDUP DAN KEBERSIHAN KOTA PEKANBARU'],
            [],
            ['JABATAN', 'NAMA LENGKAP', 'NIP', 'PANGKAT / GOLONGAN'],
            ['Pejabat Pembuat Komitmen (PPK)', 'SHANTI RAHMAYANTI, ST', '19740922 200112 2 001', 'Penata Tk.1 (IIId)'],
            ['Pejabat Pelaksana Teknis Kegiatan (PPTK)', 'DZAKWAN ADIDZA, S.Tr.,IP', '19990314 202108 1 001', 'Penata Muda Tk.1 (IIIb)'],
            ['Pengawas Lapangan & Koordinator', 'SAL PRIADI', '-', 'Koordinator Lapangan 11 Kecamatan'],
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(armadaRows), 'ARMADA & QR PERMANEN');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(checklistRows), 'CHECKLIST FISIK');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pengesahanRows), 'PENGESAHAN');
        XLSX.writeFile(wb, 'REKAP_ARMADA_PICKUP_OKTOBER_2026_QR_PERMANEN.xlsx');
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="print:hidden relative overflow-hidden rounded-3xl bg-linear-to-r from-purple-700 via-indigo-700 to-emerald-600 p-6 md:p-8 shadow-xl text-white">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                                DATA MOBIL PICK UP OKTOBER 2026
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 shadow-xs">
                                100% QR PERMANEN
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                            Unit Sewa Kendaraan Persampahan (11 Kecamatan)
                        </h1>
                        <p className="text-purple-100 text-sm mt-1.5 max-w-2xl">
                            Dinas Lingkungan Hidup dan Kebersihan Kota Pekanbaru • Periode 01 Oktober 2026 s/d 31 Oktober 2026. Seluruh 24 armada pick-up menggunakan QR Code Permanen bebas hangus.
                        </p>
                    </div>

                    {/* Role View Switcher */}
                    <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/25 flex flex-col gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                            3 Akun Terotorisasi:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                onClick={() => setActiveRoleView('dzakwan')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeRoleView === 'dzakwan'
                                        ? 'bg-white text-purple-800 font-bold shadow-sm'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Dzakwan (PPTK)
                            </button>
                            <button
                                onClick={() => setActiveRoleView('santi')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeRoleView === 'santi'
                                        ? 'bg-white text-purple-800 font-bold shadow-sm'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Santi Rahmayanti (PPK)
                            </button>
                            <button
                                onClick={() => setActiveRoleView('sal')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeRoleView === 'sal'
                                        ? 'bg-white text-purple-800 font-bold shadow-sm'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Sal Priadi (Pengawas)
                            </button>
                        </div>
                        <div className="text-[11px] text-white/90 pt-1.5 border-t border-white/20 font-medium">
                            {activeRoleView === 'dzakwan' && '👤 DZAKWAN ADIDZA, S.Tr.,IP • NIP. 19990314 202108 1 001 (Penata Muda Tk.1 / IIIb)'}
                            {activeRoleView === 'santi' && '👤 SHANTI RAHMAYANTI, ST • NIP. 19740922 200112 2 001 (Penata Tk.1 / IIId)'}
                            {activeRoleView === 'sal' && '👤 SAL PRIADI • Koordinator & Pengawas Lapangan 11 Kecamatan'}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-5 border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Armada Pick Up</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-1">
                                24 <span className="text-sm font-medium text-gray-500">Unit</span>
                            </p>
                            <p className="text-xs text-purple-600 font-medium mt-1">20 Unit Utama + 4 Rotasi KIR</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl border border-purple-100">
                            🚚
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status QR Code</p>
                            <p className="text-3xl font-extrabold text-emerald-600 mt-1">100%</p>
                            <p className="text-xs text-emerald-700 font-medium mt-1">Permanen (Bebas Hangus)</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl border border-emerald-100">
                            📱
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelayakan Dokumen</p>
                            <p className="text-3xl font-extrabold text-blue-600 mt-1">24 / 24</p>
                            <p className="text-xs text-blue-700 font-medium mt-1">STNK & Kartu/Surat KIR Valid</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl border border-blue-100">
                            📄
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 border border-amber-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cakupan Wilayah</p>
                            <p className="text-3xl font-extrabold text-amber-600 mt-1">
                                11 <span className="text-sm font-medium text-gray-500">Kecamatan</span>
                            </p>
                            <p className="text-xs text-amber-700 font-medium mt-1">Air Hitam & Harapan Jaya</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl border border-amber-100">
                            🗺️
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Navigation Tabs */}
            <div className="print:hidden flex flex-wrap items-center gap-2 pb-2">
                <button
                    onClick={() => setActiveTab('armada')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'armada'
                            ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white shadow-md'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                >
                    📋 Master Armada & QR Permanen (24 Unit)
                </button>
                <button
                    onClick={() => setActiveTab('checklist')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'checklist'
                            ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white shadow-md'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                >
                    🔍 Checklist Fisik Kendaraan (10 Item)
                </button>
                <button
                    onClick={() => setActiveTab('komparasi')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'komparasi'
                            ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white shadow-md'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                >
                    🔄 Analisis Rotasi (Oktober vs KIR)
                </button>
                <button
                    onClick={() => setActiveTab('cetak_massal')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'cetak_massal'
                            ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white shadow-md'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                >
                    🖨️ Cetak Massal Kartu QR
                </button>
                <button
                    onClick={() => setActiveTab('pengesahan')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'pengesahan'
                            ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white shadow-md'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                >
                    ✍️ Berita Acara & Pengesahan
                </button>
            </div>

            {/* TAB 1: Master Armada & QR Permanen */}
            {activeTab === 'armada' && (
                <div className="space-y-4">
                    <GlassCard className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-gray-100" hover={false}>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            <input
                                type="text"
                                placeholder="Cari plat nomor, nomor unit, atau token QR..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 max-w-md bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'UTAMA' | 'ROTASI_KIR')}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 font-medium focus:outline-none focus:border-purple-500"
                            >
                                <option value="ALL">Semua Alokasi (24 Unit)</option>
                                <option value="UTAMA">Unit Utama Berjalan (20)</option>
                                <option value="ROTASI_KIR">Unit Rotasi / Uji KIR (4)</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 mr-1">
                                Menampilkan {filteredArmada.length} / 24 unit
                            </span>
                            <button
                                onClick={handleExportExcel}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                📥 Ekspor Excel (.xlsx)
                            </button>
                            <button
                                onClick={() => setActiveTab('cetak_massal')}
                                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                🖨️ Cetak Seluruh QR
                            </button>
                        </div>
                    </GlassCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredArmada.map((item) => {
                            const isRotasi = item.status === 'ROTASI_KIR';
                            return (
                                <GlassCard key={item.plate} className="p-5 flex flex-col justify-between border border-gray-100 hover:border-purple-300 transition">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                                #{item.no.toString().padStart(2, '0')}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {isRotasi && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                        ROTASI KIR
                                                    </span>
                                                )}
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    QR PERMANEN
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div
                                                className="bg-white p-2 rounded-xl shadow-xs border border-gray-200 shrink-0 cursor-pointer hover:border-purple-400 transition"
                                                onClick={() => setSelectedArmada(item)}
                                                title="Klik untuk memperbesar QR"
                                            >
                                                <QRCodeSVG value={item.qrCode} size={74} level="H" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-black text-gray-900 tracking-wider font-mono">
                                                    {item.plate}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{item.desc}</p>
                                                <p className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1.5 max-w-full truncate">
                                                    {item.qrCode}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center text-xs">
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <span className="block text-[10px] text-gray-500 font-medium">STNK</span>
                                                <span className="text-emerald-600 font-bold">✓ VALID</span>
                                            </div>
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <span className="block text-[10px] text-gray-500 font-medium">KIR</span>
                                                <span className="text-emerald-600 font-bold">✓ VALID</span>
                                            </div>
                                            <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                <span className="block text-[10px] text-gray-500 font-medium">KONDISI</span>
                                                <span className="text-emerald-600 font-bold">BAIK</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => setSelectedArmada(item)}
                                            className="flex-1 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition text-center cursor-pointer"
                                        >
                                            🔍 Detail & Kartu QR
                                        </button>
                                        <a
                                            href={`/api/integrations/timbangqr/armada?format=svg&code=${encodeURIComponent(item.qrCode)}&size=512`}
                                            download={`QR-${item.cleanPlate}-PERMANEN.svg`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="py-2 px-3 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                        >
                                            💾 Unduh QR
                                        </a>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: Checklist Fisik Kendaraan */}
            {activeTab === 'checklist' && (
                <GlassCard className="p-6 border border-gray-100" hover={false}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Daftar Checklist Fisik Kendaraan (Sheet CHECKLIST)</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Pemeriksaan fisik standar 10 item untuk unit pick up sewa operasional DLHK Pekanbaru</p>
                        </div>
                        <div className="text-xs bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-emerald-900">
                            Diperiksa Oleh: <strong className="text-emerald-700">SAL PRIADI</strong> (Pengawas Lapangan DLHK)
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-sm text-gray-700">
                            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-center">No</th>
                                    <th className="px-4 py-3">Uraian Komponen</th>
                                    <th className="px-4 py-3 text-center">Ada</th>
                                    <th className="px-4 py-3 text-center">Tidak</th>
                                    <th className="px-4 py-3">Kondisi Standar</th>
                                    <th className="px-4 py-3">Keterangan Verifikasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {CHECKLIST_ITEMS.map((item) => (
                                    <tr key={item.no} className="hover:bg-purple-50/40">
                                        <td className="px-4 py-3 text-center font-mono font-bold text-purple-700">{item.no}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{item.item}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">✓</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-400">-</td>
                                        <td className="px-4 py-3 text-emerald-700 font-semibold">{item.kondisi}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{item.ket}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 p-5 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center p-4 md:border-r border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-10 font-semibold">DIPERIKSA OLEH :</p>
                            <p className="font-bold text-gray-900 text-base">SAL PRIADI</p>
                            <p className="text-xs text-emerald-700 font-semibold">Koordinator / Pengawas Lapangan</p>
                            <p className="text-[11px] text-gray-500">Dinas Lingkungan Hidup dan Kebersihan Kota Pekanbaru</p>
                        </div>
                        <div className="text-center p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-10 font-semibold">YANG MENYERAHKAN :</p>
                            <p className="font-bold text-gray-900 text-base">PT. / CV. PENYEDIA ARMADA SEWA</p>
                            <p className="text-xs text-gray-600 font-medium">Pengemudi / Penanggung Jawab Armada</p>
                            <p className="text-[11px] text-gray-500">Pekanbaru, Oktober 2026</p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* TAB 3: Komparasi Rotasi Armada */}
            {activeTab === 'komparasi' && (
                <GlassCard className="p-6 border border-gray-100" hover={false}>
                    <h2 className="text-lg font-bold text-gray-900 mb-1.5">Komparasi Alokasi Unit (Sheet OKTOBER 2026 vs Sheet KIR)</h2>
                    <p className="text-xs text-gray-500 mb-6">
                        Ditemukan 4 nomor polisi yang berbeda antara rekap operasional bulan berjalan dan data uji KIR, menandakan rotasi atau unit pengganti sementara selama masa servis/KIR:
                    </p>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-sm text-gray-700">
                            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-center">No Unit</th>
                                    <th className="px-4 py-3">Plat Rekap OKTOBER 2026</th>
                                    <th className="px-4 py-3">Plat Sheet KIR</th>
                                    <th className="px-4 py-3">Status QR Permanen</th>
                                    <th className="px-4 py-3">Keterangan Analisis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                <tr className="hover:bg-purple-50/40">
                                    <td className="px-4 py-3 text-center font-mono font-bold text-purple-700">07</td>
                                    <td className="px-4 py-3 font-mono font-bold text-gray-900">BM 8984 QA</td>
                                    <td className="px-4 py-3 font-mono font-bold text-amber-700">BM 8489 SM</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold">KEDUA UNIT AKTIF QR</span></td>
                                    <td className="px-4 py-3 text-xs text-gray-600">Rotasi uji berkala. Keduanya terdaftar QR permanen agar tidak tertolak di timbangan.</td>
                                </tr>
                                <tr className="hover:bg-purple-50/40">
                                    <td className="px-4 py-3 text-center font-mono font-bold text-purple-700">14</td>
                                    <td className="px-4 py-3 font-mono font-bold text-gray-900">BM 8589 QG</td>
                                    <td className="px-4 py-3 font-mono font-bold text-amber-700">BM 8377 PI</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold">KEDUA UNIT AKTIF QR</span></td>
                                    <td className="px-4 py-3 text-xs text-gray-600">Substitusi armada pikap sewa wilayah 11 kecamatan.</td>
                                </tr>
                                <tr className="hover:bg-purple-50/40">
                                    <td className="px-4 py-3 text-center font-mono font-bold text-purple-700">18</td>
                                    <td className="px-4 py-3 font-mono font-bold text-gray-900">BA 8363 SAA</td>
                                    <td className="px-4 py-3 font-mono font-bold text-amber-700">BM 8296 QK</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold">KEDUA UNIT AKTIF QR</span></td>
                                    <td className="px-4 py-3 text-xs text-gray-600">BA 8363 SAA beroperasi paralel dengan BM 8296 QK.</td>
                                </tr>
                                <tr className="hover:bg-purple-50/40">
                                    <td className="px-4 py-3 text-center font-mono font-bold text-purple-700">19</td>
                                    <td className="px-4 py-3 font-mono font-bold text-gray-900">BM 8723 ZC</td>
                                    <td className="px-4 py-3 font-mono font-bold text-amber-700">BM 8122 CM</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold">KEDUA UNIT AKTIF QR</span></td>
                                    <td className="px-4 py-3 text-xs text-gray-600">Unit cadangan resmi terintegrasi di sistem TimbangQR Air Hitam & Harapan Jaya.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}

            {/* TAB 4: Cetak Massal QR Code */}
            {activeTab === 'cetak_massal' && (
                <div className="space-y-4">
                    <GlassCard className="print:hidden p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-gray-100" hover={false}>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Lembar Cetak Massal 24 Kartu QR Permanen</h2>
                            <p className="text-xs text-gray-500">Format stiker tempel kaca depan / dashboard kendaraan sewa DLHK Kota Pekanbaru</p>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-2 cursor-pointer"
                        >
                            🖨️ Print / Simpan PDF
                        </button>
                    </GlassCard>

                    <div ref={printAreaRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-3">
                        {PICKUP_DATA.map((item) => (
                            <div key={item.plate} className="bg-white text-slate-900 p-4 rounded-2xl border-2 border-slate-800 shadow-sm flex flex-col items-center text-center break-inside-avoid">
                                <div className="w-full flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
                                    <span className="text-[10px] font-black uppercase text-emerald-800">DLHK KOTA PEKANBARU</span>
                                    <span className="text-[10px] font-mono font-bold bg-slate-200 px-1.5 py-0.5 rounded">UNIT {item.no.toString().padStart(2, '0')}</span>
                                </div>
                                <h4 className="text-lg font-black tracking-wider text-slate-950 font-mono">{item.plate}</h4>
                                <p className="text-[10px] font-semibold text-slate-600 mb-2">PICK UP SEWA 11 KECAMATAN</p>
                                <div className="p-2 bg-white rounded-lg border border-slate-300 my-1">
                                    <QRCodeSVG value={item.qrCode} size={116} level="H" />
                                </div>
                                <p className="text-[9px] font-mono font-bold text-slate-800 mt-1">{item.qrCode}</p>
                                <div className="w-full mt-2 pt-1 border-t border-dashed border-slate-300 flex justify-between text-[8px] font-bold text-emerald-700">
                                    <span>QR PERMANEN</span>
                                    <span>VALID 2026</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: Berita Acara & Pengesahan */}
            {activeTab === 'pengesahan' && (
                <GlassCard className="p-8 max-w-4xl mx-auto space-y-6 border border-gray-200" hover={false}>
                    <div className="text-center border-b border-gray-200 pb-5">
                        <h2 className="text-lg font-extrabold text-gray-900 uppercase tracking-wider">
                            PEMERINTAH KOTA PEKANBARU
                        </h2>
                        <h3 className="text-base font-bold text-emerald-700 uppercase">
                            DINAS LINGKUNGAN HIDUP DAN KEBERSIHAN
                        </h3>
                        <p className="text-xs text-gray-600 font-semibold mt-1.5">
                            LEMBAR PENGESAHAN HASIL PEMERIKSAAN DAN OPERASIONAL SEWA KENDARAAN PERSAMPAHAN
                        </p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">
                            Periode: 01 Oktober 2026 s/d 31 Oktober 2026 • Jenis Unit: PICK UP (11 Kecamatan)
                        </p>
                    </div>

                    <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                        <p>
                            Berdasarkan hasil rekapitulasi data operasional kendaraan sewa, pemeriksaan fisik 10 komponen keselamatan (Checklist), serta uji berkala KIR, dengan ini dinyatakan bahwa:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-700">
                            <li>Jumlah armada sewa pick up beroperasi aktif sebanyak <strong>20 Unit Utama</strong> dan didukung <strong>4 Unit Rotasi Uji KIR</strong> (Total 24 unit terdata).</li>
                            <li>Seluruh 24 armada telah terpasang dan tervalidasi menggunakan <strong>QR Code Permanen</strong> pada sistem TimbangQR Air Hitam dan Harapan Jaya.</li>
                            <li>Semua unit memenuhi standar teknis, dokumen STNK serta Surat/Kartu Uji Berkala KIR dalam kondisi baik dan sah.</li>
                        </ul>
                    </div>

                    <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200">
                        <div className="text-center p-5 bg-gray-50 rounded-2xl border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Mengetahui,</p>
                            <p className="text-xs font-bold text-gray-800 uppercase mb-16">Pejabat Pembuat Komitmen (PPK)</p>
                            <p className="text-sm font-bold text-gray-900 underline">SHANTI RAHMAYANTI, ST</p>
                            <p className="text-xs text-emerald-700 font-semibold">Penata Tk.1 (IIId)</p>
                            <p className="text-xs text-gray-500 font-mono">NIP. 19740922 200112 2 001</p>
                        </div>

                        <div className="text-center p-5 bg-gray-50 rounded-2xl border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Dibuat Oleh,</p>
                            <p className="text-xs font-bold text-gray-800 uppercase mb-16">Pejabat Pelaksana Teknis Kegiatan (PPTK)</p>
                            <p className="text-sm font-bold text-gray-900 underline">DZAKWAN ADIDZA, S.Tr.,IP</p>
                            <p className="text-xs text-emerald-700 font-semibold">Penata Muda Tk.1 (IIIb)</p>
                            <p className="text-xs text-gray-500 font-mono">NIP. 19990314 202108 1 001</p>
                        </div>
                    </div>

                    <div className="text-center pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            Koordinator Lapangan / Pemeriksa Teknis: <strong className="text-gray-900">SAL PRIADI</strong>
                        </p>
                    </div>
                </GlassCard>
            )}

            {/* Modal Detail Kartu QR */}
            {selectedArmada && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
                    onClick={() => setSelectedArmada(null)}
                >
                    <div
                        className="bg-white border border-purple-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedArmada(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center">
                            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-3 border border-emerald-200">
                                KARTU IDENTITAS RESMI ARMADA
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 font-mono tracking-wider">
                                {selectedArmada.plate}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">{selectedArmada.desc}</p>

                            <div className="my-5 p-4 bg-white rounded-2xl shadow-md inline-block border-2 border-emerald-500">
                                <QRCodeSVG value={selectedArmada.qrCode} size={184} level="H" />
                            </div>

                            <p className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 break-all select-all">
                                {selectedArmada.qrCode}
                            </p>

                            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1.5 text-left">
                                <div className="flex justify-between">
                                    <span>Tipe QR:</span>
                                    <strong className="text-emerald-700">PERMANEN (BEBAS HANGUS)</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Depo Timbangan:</span>
                                    <strong className="text-gray-900">Air Hitam & Harapan Jaya</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Otorisasi:</span>
                                    <strong className="text-gray-900">Dzakwan / Santi / Sal Priadi</strong>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer"
                                >
                                    🖨️ Cetak Kartu
                                </button>
                                <button
                                    onClick={() => setSelectedArmada(null)}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
