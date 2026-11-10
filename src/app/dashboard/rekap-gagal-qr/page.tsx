'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { usePermissions } from '@/lib/permissions';

interface QrFailureItem {
    id: string;
    transdepo: string;
    platNomor: string | null;
    namaLps: string | null;
    kelurahan: string | null;
    kecamatan: string | null;
    qrCode: string | null;
    kategoriAlasan: string;
    keterangan: string | null;
    tindakan: string | null;
    operatorName: string | null;
    tiketNumberRef: string | null;
    fotoKondisiUrl: string | null;
    createdAt: string;
}

interface SummaryStats {
    totalAll: number;
    totalAirHitam: number;
    totalHarapanJaya: number;
    totalHangus: number;
    totalUsang: number;
    totalKadaluarsa: number;
    totalTidakTerdaftar: number;
    totalPlatTidakSesuai: number;
    totalLainnya: number;
}

export default function RekapGagalQrPage() {
    const { isSuperAdmin, isReadOnly } = usePermissions();

    // Data State
    const [items, setItems] = useState<QrFailureItem[]>([]);
    const [summary, setSummary] = useState<SummaryStats>({
        totalAll: 0,
        totalAirHitam: 0,
        totalHarapanJaya: 0,
        totalHangus: 0,
        totalUsang: 0,
        totalKadaluarsa: 0,
        totalTidakTerdaftar: 0,
        totalPlatTidakSesuai: 0,
        totalLainnya: 0,
    });
    const [loading, setLoading] = useState(true);

    // Filter State
    const [selectedTransdepo, setSelectedTransdepo] = useState<string>('ALL');
    const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
    const [selectedRange, setSelectedRange] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Modal State (Create & Edit)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<QrFailureItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<QrFailureItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        transdepo: 'AIR_HITAM',
        platNomor: '',
        namaLps: '',
        kelurahan: '',
        kecamatan: '',
        qrCode: '',
        kategoriAlasan: 'USANG',
        keterangan: '',
        tindakan: 'DIARAHKAN_CETAK_ULANG',
        operatorName: '',
        tiketNumberRef: '',
    });

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            transdepo: 'AIR_HITAM',
            platNomor: '',
            namaLps: '',
            kelurahan: '',
            kecamatan: '',
            qrCode: '',
            kategoriAlasan: 'USANG',
            keterangan: '',
            tindakan: 'DIARAHKAN_CETAK_ULANG',
            operatorName: '',
            tiketNumberRef: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: QrFailureItem) => {
        setEditingItem(item);
        setFormData({
            transdepo: item.transdepo || 'AIR_HITAM',
            platNomor: item.platNomor || '',
            namaLps: item.namaLps || '',
            kelurahan: item.kelurahan || '',
            kecamatan: item.kecamatan || '',
            qrCode: item.qrCode || '',
            kategoriAlasan: item.kategoriAlasan || 'USANG',
            keterangan: item.keterangan || '',
            tindakan: item.tindakan || 'DIARAHKAN_CETAK_ULANG',
            operatorName: item.operatorName || '',
            tiketNumberRef: item.tiketNumberRef || '',
        });
        setIsModalOpen(true);
    };

    // Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedTransdepo !== 'ALL') params.set('transdepo', selectedTransdepo);
            if (selectedKategori !== 'ALL') params.set('kategori', selectedKategori);
            if (searchQuery.trim()) params.set('search', searchQuery.trim());
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            params.set('page', String(page));
            params.set('limit', '25');

            const res = await fetch(`/api/rekap-gagal-qr?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setItems(json.data || []);
                setSummary(json.summary || {
                    totalAll: 0,
                    totalAirHitam: 0,
                    totalHarapanJaya: 0,
                    totalHangus: 0,
                    totalUsang: 0,
                    totalKadaluarsa: 0,
                    totalTidakTerdaftar: 0,
                    totalPlatTidakSesuai: 0,
                    totalLainnya: 0,
                });
                setTotalPages(json.pagination?.totalPages || 1);
                setTotalCount(json.pagination?.totalCount || 0);
            }
        } catch (error) {
            console.error('Gagal memuat rekap gagal QR:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedTransdepo, selectedKategori, searchQuery, startDate, endDate, page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Quick Date Range
    const handleRangeChange = (val: string) => {
        setSelectedRange(val);
        setPage(1);
        const now = new Date();

        if (val === 'today') {
            const todayStr = now.toISOString().slice(0, 10);
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (val === '7days') {
            const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            setStartDate(past.toISOString().slice(0, 10));
            setEndDate(now.toISOString().slice(0, 10));
        } else if (val === 'month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(firstDay.toISOString().slice(0, 10));
            setEndDate(now.toISOString().slice(0, 10));
        } else {
            setStartDate('');
            setEndDate('');
        }
    };

    // Export CSV Function
    const handleExportCsv = () => {
        if (!items || items.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }

        const headers = [
            'No',
            'Waktu Kejadian',
            'Lokasi Transdepo',
            'Plat Nomor',
            'Nama LPS',
            'Kelurahan',
            'Kecamatan',
            'Token QR',
            'Kategori Alasan',
            'Keterangan Detail',
            'Tindakan Operator',
            'Petugas Pos',
            'No Tiket Terkait',
        ];

        const rows = items.map((it, idx) => [
            idx + 1,
            new Date(it.createdAt).toLocaleString('id-ID'),
            it.transdepo === 'AIR_HITAM' ? 'Air Hitam' : 'Harapan Jaya',
            `"${it.platNomor || '-'}"`,
            `"${it.namaLps || '-'}"`,
            `"${it.kelurahan || '-'}"`,
            `"${it.kecamatan || '-'}"`,
            `"${it.qrCode || '-'}"`,
            `"${it.kategoriAlasan}"`,
            `"${(it.keterangan || '').replace(/"/g, '""')}"`,
            `"${it.tindakan || '-'}"`,
            `"${it.operatorName || '-'}"`,
            `"${it.tiketNumberRef || '-'}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
            headers.join(','),
            ...rows.map((r) => r.join(',')),
        ].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `rekap_kendala_qr_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Submit Create or Edit Failure Report (SuperAdmin)
    const handleSubmitNewReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const isEdit = Boolean(editingItem?.id);
            const res = await fetch('/api/rekap-gagal-qr', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEdit ? { id: editingItem!.id, ...formData } : formData),
            });
            const json = await res.json();
            if (json.success) {
                setIsModalOpen(false);
                setEditingItem(null);
                fetchData();
                alert(isEdit ? 'Laporan kendala QR berhasil diperbarui!' : 'Laporan kendala QR berhasil dicatat!');
            } else {
                alert(json.error || 'Gagal menyimpan laporan.');
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete Failure Report (SuperAdmin)
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/rekap-gagal-qr?id=${encodeURIComponent(deletingItem.id)}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (json.success) {
                setDeletingItem(null);
                fetchData();
            } else {
                alert(json.error || 'Gagal menghapus laporan.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Terjadi kesalahan jaringan saat menghapus.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper Badge Warna Kategori
    const renderKategoriBadge = (kategori: string) => {
        switch (kategori) {
            case 'HANGUS':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        Hangus (Sudah Dipakai)
                    </span>
                );
            case 'USANG':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Usang / Rusak Fisik
                    </span>
                );
            case 'KADALUARSA':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Kadaluarsa
                    </span>
                );
            case 'TIDAK_TERDAFTAR':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        Tidak Terdaftar
                    </span>
                );
            case 'PLAT_TIDAK_SESUAI':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                        Plat Tidak Sesuai
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Lainnya
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
            {isReadOnly && (
                <div className="max-w-7xl mx-auto mb-4">
                    <ReadOnlyBanner />
                </div>
            )}

            {/* Header Title Section */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Transdepo Pekanbaru
                            </span>
                            <span className="text-xs text-slate-400">
                                Air Hitam & Harapan Jaya
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                            <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Rekapitulasi Kegagalan Scan QR Armada
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Laporan kendala scan QR Code stiker/kartu armada sampah di pos timbangan (Hangus, Usang, Robek, Kadaluarsa, Tidak Dikenal).
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        {isSuperAdmin && (
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                + Catat Kendala QR
                            </button>
                        )}
                        <button
                            onClick={handleExportCsv}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 transition-all cursor-pointer"
                            title="Download Data CSV/Excel"
                        >
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Ekspor Excel/CSV
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 transition-all cursor-pointer"
                            title="Cetak Halaman"
                        >
                            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Cetak Laporan
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="max-w-7xl mx-auto mb-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* Total Kasus */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 shadow-md">
                    <div className="text-xs font-medium text-slate-400 mb-1">Total Kendala QR</div>
                    <div className="text-2xl sm:text-3xl font-black text-white">{summary.totalAll}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Gabungan seluruh pos</div>
                </div>

                {/* Hangus (Burned) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-900/80 border border-rose-900/40 shadow-md">
                    <div className="text-xs font-medium text-rose-300 mb-1 flex items-center justify-between">
                        <span>QR Hangus</span>
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-rose-400">{summary.totalHangus}</div>
                    <div className="text-[11px] text-rose-300/60 mt-1">Token sudah terpakai</div>
                </div>

                {/* Usang / Rusak Fisik */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900/80 border border-amber-900/40 shadow-md">
                    <div className="text-xs font-medium text-amber-300 mb-1 flex items-center justify-between">
                        <span>QR Usang / Rusak</span>
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">{summary.totalUsang}</div>
                    <div className="text-[11px] text-amber-300/60 mt-1">Perlu cetak stiker ulang</div>
                </div>

                {/* Pos Air Hitam */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900/80 border border-blue-900/40 shadow-md">
                    <div className="text-xs font-medium text-blue-300 mb-1">Pos Air Hitam</div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-400">{summary.totalAirHitam}</div>
                    <div className="text-[11px] text-blue-300/60 mt-1">Kasus di Transdepo 1</div>
                </div>

                {/* Pos Harapan Jaya */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border border-emerald-900/40 shadow-md col-span-2 sm:col-span-1">
                    <div className="text-xs font-medium text-emerald-300 mb-1">Pos Harapan Jaya</div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">{summary.totalHarapanJaya}</div>
                    <div className="text-[11px] text-emerald-300/60 mt-1">Kasus di Transdepo 2</div>
                </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="max-w-7xl mx-auto mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Tabs Lokasi Transdepo */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 self-start sm:self-auto overflow-x-auto max-w-full">
                        <button
                            onClick={() => { setSelectedTransdepo('ALL'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                selectedTransdepo === 'ALL'
                                    ? 'bg-slate-800 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Semua Pos ({summary.totalAll})
                        </button>
                        <button
                            onClick={() => { setSelectedTransdepo('AIR_HITAM'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                selectedTransdepo === 'AIR_HITAM'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Air Hitam ({summary.totalAirHitam})
                        </button>
                        <button
                            onClick={() => { setSelectedTransdepo('HARAPAN_JAYA'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                selectedTransdepo === 'HARAPAN_JAYA'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Harapan Jaya ({summary.totalHarapanJaya})
                        </button>
                    </div>

                    {/* Filter Kategori Alasan & Tanggal */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Dropdown Kategori */}
                        <select
                            value={selectedKategori}
                            onChange={(e) => { setSelectedKategori(e.target.value); setPage(1); }}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:border-rose-500"
                        >
                            <option value="ALL">Semua Alasan Kendala</option>
                            <option value="HANGUS">🔥 Hangus (Sudah Dipakai)</option>
                            <option value="USANG">⚠️ Usang / Rusak Fisik</option>
                            <option value="KADALUARSA">⏳ Kadaluarsa (Expired)</option>
                            <option value="TIDAK_TERDAFTAR">🚫 Tidak Terdaftar / Liar</option>
                            <option value="PLAT_TIDAK_SESUAI">🔄 Plat Tidak Sesuai</option>
                            <option value="LAINNYA">📝 Alasan Lainnya</option>
                        </select>

                        {/* Dropdown Periode */}
                        <select
                            value={selectedRange}
                            onChange={(e) => handleRangeChange(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:border-rose-500"
                        >
                            <option value="all">Semua Waktu</option>
                            <option value="today">Hari Ini</option>
                            <option value="7days">7 Hari Terakhir</option>
                            <option value="month">Bulan Ini</option>
                        </select>

                        {/* Search Input */}
                        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                            <input
                                type="text"
                                placeholder="Cari plat, LPS, supir..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
                            />
                            <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800/80 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-4 py-3.5">Waktu Kejadian</th>
                                <th className="px-4 py-3.5">Pos Timbangan</th>
                                <th className="px-4 py-3.5">Plat Nomor / Armada</th>
                                <th className="px-4 py-3.5">LPS & Kelurahan</th>
                                <th className="px-4 py-3.5">Kategori Kendala</th>
                                <th className="px-4 py-3.5">Keterangan / Alasan</th>
                                <th className="px-4 py-3.5">Tindakan Petugas</th>
                                <th className="px-4 py-3.5">Pencatat</th>
                                {isSuperAdmin && (
                                    <th className="px-4 py-3.5 text-right">Aksi (SuperAdmin)</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 9 : 8} className="text-center py-12 text-slate-500">
                                        <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-rose-500 border-t-transparent mb-2"></div>
                                        <div>Memuat data rekapitulasi kendala QR...</div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 9 : 8} className="text-center py-16 text-slate-500">
                                        <svg className="w-12 h-12 mx-auto text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-base font-semibold text-slate-400">Tidak ada kendala scan QR</p>
                                        <p className="text-xs text-slate-600 mt-1">Tidak ditemukan riwayat kegagalan dengan filter yang dipilih.</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                                        {/* Waktu */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                                            <div className="font-semibold text-slate-200">
                                                {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })} WIB
                                            </div>
                                        </td>

                                        {/* Pos Timbangan */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {item.transdepo === 'AIR_HITAM' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                                    Air Hitam
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                    Harapan Jaya
                                                </span>
                                            )}
                                        </td>

                                        {/* Plat & QR */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="font-bold text-white font-mono tracking-wide text-xs">
                                                {item.platNomor || 'TANPA PLAT'}
                                            </div>
                                            {item.qrCode && (
                                                <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={item.qrCode}>
                                                    {item.qrCode}
                                                </div>
                                            )}
                                        </td>

                                        {/* LPS & Kelurahan */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="font-medium text-slate-200">
                                                {item.namaLps || '-'}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {item.kelurahan ? `Kel. ${item.kelurahan}` : '-'}
                                                {item.kecamatan ? ` • Kec. ${item.kecamatan}` : ''}
                                            </div>
                                        </td>

                                        {/* Kategori Alasan */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {renderKategoriBadge(item.kategoriAlasan)}
                                        </td>

                                        {/* Keterangan Detail */}
                                        <td className="px-4 py-3.5 max-w-[260px]">
                                            <div className="text-slate-300 line-clamp-2 leading-relaxed" title={item.keterangan || ''}>
                                                {item.keterangan || '-'}
                                            </div>
                                            {item.tiketNumberRef && (
                                                <div className="mt-1 text-[10px] text-rose-400 font-mono">
                                                    Ref Tiket: #{item.tiketNumberRef}
                                                </div>
                                            )}
                                        </td>

                                        {/* Tindakan Operator */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {item.tindakan === 'DIARAHKAN_CETAK_ULANG' ? (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                                                    Arahkan Cetak Ulang
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                                                    Ditolak Timbang
                                                </span>
                                            )}
                                        </td>

                                        {/* Pencatat */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                                            {item.operatorName || 'Operator'}
                                        </td>

                                        {/* Aksi CRUD Khusus SuperAdmin */}
                                        {isSuperAdmin && (
                                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors cursor-pointer"
                                                        title="Edit Data Kendala QR"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingItem(item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
                                                        title="Hapus Data Kendala QR"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div>
                        Menampilkan <span className="font-semibold text-white">{items.length}</span> dari{' '}
                        <span className="font-semibold text-white">{totalCount}</span> kasus kendala
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-white transition-all cursor-pointer"
                        >
                            Sebelumnya
                        </button>
                        <span className="text-slate-400">
                            Hal {page} dari {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-white transition-all cursor-pointer"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Create & Edit Kendala QR (Khusus SuperAdmin) */}
            {isSuperAdmin && isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {editingItem ? 'Edit Data Kendala Scan QR' : 'Catat Kendala Scan QR'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitNewReport} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Pos Timbangan *</label>
                                    <select
                                        value={formData.transdepo}
                                        onChange={(e) => setFormData({ ...formData, transdepo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                        required
                                    >
                                        <option value="AIR_HITAM">Transdepo Air Hitam</option>
                                        <option value="HARAPAN_JAYA">Transdepo Harapan Jaya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Kategori Alasan *</label>
                                    <select
                                        value={formData.kategoriAlasan}
                                        onChange={(e) => setFormData({ ...formData, kategoriAlasan: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                        required
                                    >
                                        <option value="USANG">⚠️ Usang / Rusak Fisik (Robek, Pudar)</option>
                                        <option value="HANGUS">🔥 Hangus (Sudah Pernah Dipakai)</option>
                                        <option value="KADALUARSA">⏳ Kadaluarsa (Expired)</option>
                                        <option value="TIDAK_TERDAFTAR">🚫 QR Tidak Terdaftar / Palsu</option>
                                        <option value="PLAT_TIDAK_SESUAI">🔄 Plat Tidak Sesuai Fisik</option>
                                        <option value="LAINNYA">📝 Alasan Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Plat Nomor Armada</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: BM 8451 QU"
                                        value={formData.platNomor}
                                        onChange={(e) => setFormData({ ...formData, platNomor: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500 uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Nama LPS</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Muara Fajar Barat"
                                        value={formData.namaLps}
                                        onChange={(e) => setFormData({ ...formData, namaLps: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Kelurahan</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Muara Fajar Barat"
                                        value={formData.kelurahan}
                                        onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Kecamatan</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Rumbai Barat"
                                        value={formData.kecamatan}
                                        onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">String / Kode QR yang Terbaca</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: LPS-BM8451QU-17939100223"
                                        value={formData.qrCode}
                                        onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500 font-mono text-[11px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Ref Nomor Tiket (Jika Hangus)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: INV/26/51138"
                                        value={formData.tiketNumberRef}
                                        onChange={(e) => setFormData({ ...formData, tiketNumberRef: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500 font-mono text-[11px]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Keterangan Detail Kejadian *</label>
                                <textarea
                                    rows={2}
                                    placeholder="Jelaskan kondisi stiker QR, alasan ditolak, atau situasi di gardu timbangan..."
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Tindakan Petugas</label>
                                    <select
                                        value={formData.tindakan}
                                        onChange={(e) => setFormData({ ...formData, tindakan: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                    >
                                        <option value="DIARAHKAN_CETAK_ULANG">Diarahkan Minta / Cetak QR Baru ke LPS</option>
                                        <option value="DITOLAK">Ditolak Masuk Jembatan Timbang</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Nama Petugas / Pencatat</label>
                                    <input
                                        type="text"
                                        placeholder="Nama operator timbangan"
                                        value={formData.operatorName}
                                        onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-rose-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/40 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Simpan Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus (Khusus SuperAdmin) */}
            {isSuperAdmin && deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Hapus Data Kendala QR?</h3>
                                <p className="text-xs text-slate-400">Tindakan ini akan menghapus data permanen dari rekapitulasi.</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 mb-5">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Plat Nomor:</span>
                                <span className="font-bold text-white font-mono">{deletingItem.platNomor || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Nama LPS:</span>
                                <span className="font-medium text-slate-200">{deletingItem.namaLps || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Kategori:</span>
                                <span className="font-semibold text-rose-400">{deletingItem.kategoriAlasan}</span>
                            </div>
                            {deletingItem.qrCode && (
                                <div className="flex justify-between gap-2">
                                    <span className="text-slate-400 shrink-0">Kode QR:</span>
                                    <span className="font-mono text-[11px] text-slate-300 truncate">{deletingItem.qrCode}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeletingItem(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/40 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

