'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
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

interface TimelineBucket {
    key: string;
    label: string;
    fullLabel: string;
    total: number;
    airHitam: number;
    harapanJaya: number;
    hangus: number;
    usang: number;
    kadaluarsa: number;
    tidakTerdaftar: number;
    platTidakSesuai: number;
    lainnya: number;
}

function getWibYmd(offsetDays = 0): string {
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
    return now.toISOString().slice(0, 10);
}

export default function RekapGagalQrPage() {
    const { isSuperAdmin, isReadOnly } = usePermissions();

    // Data State
    const [items, setItems] = useState<QrFailureItem[]>([]);
    const [timeline, setTimeline] = useState<TimelineBucket[]>([]);
    const [activeGranularity, setActiveGranularity] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
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

    // Filter & Timeline Setting State
    const [selectedTransdepo, setSelectedTransdepo] = useState<string>('ALL');
    const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
    const [selectedRange, setSelectedRange] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [granularity, setGranularity] = useState<'auto' | 'hourly' | 'daily' | 'weekly' | 'monthly'>('auto');
    const [chartMode, setChartMode] = useState<'pos' | 'kategori'>('pos');
    const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isExporting, setIsExporting] = useState<boolean>(false);

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
            if (granularity !== 'auto') params.set('granularity', granularity);
            params.set('page', String(page));
            params.set('limit', '25');

            const res = await fetch(`/api/rekap-gagal-qr?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setItems(json.data || []);
                setTimeline(Array.isArray(json.timeline) ? json.timeline : []);
                if (json.granularity) setActiveGranularity(json.granularity);
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
    }, [selectedTransdepo, selectedKategori, searchQuery, startDate, endDate, granularity, page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Quick Date Range (WIB Accurate)
    const handleRangeChange = (val: string) => {
        setSelectedRange(val);
        setPage(1);
        const todayWib = getWibYmd(0);

        if (val === 'today') {
            setStartDate(todayWib);
            setEndDate(todayWib);
            setGranularity('hourly');
        } else if (val === 'yesterday') {
            const yest = getWibYmd(-1);
            setStartDate(yest);
            setEndDate(yest);
            setGranularity('hourly');
        } else if (val === '7days') {
            setStartDate(getWibYmd(-6));
            setEndDate(todayWib);
            if (granularity === 'hourly') setGranularity('daily');
        } else if (val === '14days') {
            setStartDate(getWibYmd(-13));
            setEndDate(todayWib);
            if (granularity === 'hourly') setGranularity('daily');
        } else if (val === '30days') {
            setStartDate(getWibYmd(-29));
            setEndDate(todayWib);
            if (granularity === 'hourly') setGranularity('daily');
        } else if (val === 'month') {
            const firstOfMonth = `${todayWib.slice(0, 7)}-01`;
            setStartDate(firstOfMonth);
            setEndDate(todayWib);
            if (granularity === 'hourly') setGranularity('daily');
        } else if (val === 'all') {
            setStartDate('');
            setEndDate('');
            setGranularity('auto');
        }
    };

    const handleCustomStartDate = (val: string) => {
        setStartDate(val);
        setSelectedRange('custom');
        setPage(1);
    };

    const handleCustomEndDate = (val: string) => {
        setEndDate(val);
        setSelectedRange('custom');
        setPage(1);
    };

    const toggleSeries = (dataKey: string) => {
        setHiddenSeries((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
    };

    // Statistik Analitik Timeline (Puncak & Rata-rata)
    const timelineAnalytics = useMemo(() => {
        if (!timeline || timeline.length === 0) {
            return { peak: null as TimelineBucket | null, avg: 0, totalInChart: 0 };
        }
        let peak: TimelineBucket | null = null;
        let sum = 0;
        for (const b of timeline) {
            sum += b.total;
            if (!peak || b.total > peak.total) {
                peak = b;
            }
        }
        const avg = timeline.length > 0 ? sum / timeline.length : 0;
        return { peak: peak && peak.total > 0 ? peak : null, avg, totalInChart: sum };
    }, [timeline]);

    const chartData = useMemo(() => {
        return timeline.map((b) => ({
            ...b,
            kategoriLain:
                (b.kadaluarsa || 0) +
                (b.tidakTerdaftar || 0) +
                (b.platTidakSesuai || 0) +
                (b.lainnya || 0),
        }));
    }, [timeline]);

    const activeSeriesConfig = useMemo(() => {
        if (chartMode === 'pos') {
            return [
                { key: 'total', name: 'Total Kendala', color: '#818cf8', strokeWidth: 3 },
                { key: 'airHitam', name: 'Pos Air Hitam', color: '#38bdf8', strokeWidth: 2.2 },
                { key: 'harapanJaya', name: 'Pos Harapan Jaya', color: '#34d399', strokeWidth: 2.2 },
            ];
        }
        return [
            { key: 'total', name: 'Total Kendala', color: '#818cf8', strokeWidth: 2.5 },
            { key: 'hangus', name: 'QR Hangus (Sudah Dipakai)', color: '#fb7185', strokeWidth: 2.5 },
            { key: 'usang', name: 'QR Usang / Rusak', color: '#fbbf24', strokeWidth: 2.5 },
            { key: 'kategoriLain', name: 'Lainnya (Tidak Terdaftar/Kadaluarsa)', color: '#c084fc', strokeWidth: 2 },
        ];
    }, [chartMode]);

    // Export CSV Function (Seluruh Data sesuai Filter)
    const handleExportCsv = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (selectedTransdepo !== 'ALL') params.set('transdepo', selectedTransdepo);
            if (selectedKategori !== 'ALL') params.set('kategori', selectedKategori);
            if (searchQuery.trim()) params.set('search', searchQuery.trim());
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            params.set('export', 'true');

            const res = await fetch(`/api/rekap-gagal-qr?${params.toString()}`);
            const json = await res.json();

            const exportData: QrFailureItem[] = json.success && Array.isArray(json.data) ? json.data : [];

            if (exportData.length === 0) {
                alert('Tidak ada data kendala QR yang sesuai filter untuk diekspor.');
                return;
            }

            const headers = [
                'No',
                'Waktu Kejadian (WIB)',
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

            const rows = exportData.map((it, idx) => {
                const dateWib = new Date(it.createdAt).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });

                return [
                    idx + 1,
                    `"${dateWib}"`,
                    `"${it.transdepo === 'AIR_HITAM' ? 'Air Hitam' : 'Harapan Jaya'}"`,
                    `"${(it.platNomor || '-').replace(/"/g, '""')}"`,
                    `"${(it.namaLps || '-').replace(/"/g, '""')}"`,
                    `"${(it.kelurahan || '-').replace(/"/g, '""')}"`,
                    `"${(it.kecamatan || '-').replace(/"/g, '""')}"`,
                    `"${(it.qrCode || '-').replace(/"/g, '""')}"`,
                    `"${(it.kategoriAlasan || '-').replace(/"/g, '""')}"`,
                    `"${(it.keterangan || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
                    `"${(it.tindakan || '-').replace(/"/g, '""')}"`,
                    `"${(it.operatorName || '-').replace(/"/g, '""')}"`,
                    `"${(it.tiketNumberRef || '-').replace(/"/g, '""')}"`,
                ].join(',');
            });

            const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const depoLabel = selectedTransdepo !== 'ALL' ? selectedTransdepo : 'SEMUA_POS';
            link.download = `rekap_kendala_qr_${depoLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Gagal mengekspor data kendala QR:', err);
            alert('Terjadi kesalahan saat mengunduh data CSV/Excel');
        } finally {
            setIsExporting(false);
        }
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
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download Seluruh Data CSV/Excel Sesuai Filter"
                        >
                            {isExporting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Mengekspor...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Ekspor Excel/CSV
                                </>
                            )}
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

            {/* TIMELINE SETTING & LINE CHART SECTION */}
            <div className="max-w-7xl mx-auto mb-6 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl">
                {/* Baris 1: Timeline Setting Controls */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </span>
                            <h2 className="text-base sm:text-lg font-bold text-white">
                                Grafik Tren & Pengaturan Timeline Kendala QR
                            </h2>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Atur rentang waktu, interval agregasi (Per Jam / Harian / Mingguan / Bulanan), serta mode garis perbandingan.
                        </p>
                    </div>

                    {/* Quick Timeline Preset Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-1.5 rounded-xl border border-slate-800/90">
                        {[
                            { id: 'all', label: 'Semua Waktu' },
                            { id: 'today', label: 'Hari Ini' },
                            { id: 'yesterday', label: 'Kemarin' },
                            { id: '7days', label: '7 Hari' },
                            { id: '14days', label: '14 Hari' },
                            { id: '30days', label: '30 Hari' },
                            { id: 'month', label: 'Bulan Ini' },
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleRangeChange(preset.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    selectedRange === preset.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Baris 2: Custom Date Picker + Interval Granularity + Chart Mode */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3.5 border-b border-slate-800/60 text-xs">
                    {/* Rentang Tanggal Custom */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Rentang Tanggal:
                        </span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => handleCustomStartDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
                            title="Dari Tanggal"
                        />
                        <span className="text-slate-500">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => handleCustomEndDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
                            title="Sampai Tanggal"
                        />
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                onClick={() => handleRangeChange('all')}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
                            >
                                Reset Waktu
                            </button>
                        )}
                    </div>

                    {/* Interval Granularity & Mode Garis */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Granularity Selector */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-medium">Interval:</span>
                            <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                                {[
                                    { id: 'auto', label: 'Otomatis' },
                                    { id: 'hourly', label: 'Per Jam' },
                                    { id: 'daily', label: 'Harian' },
                                    { id: 'weekly', label: 'Mingguan' },
                                    { id: 'monthly', label: 'Bulanan' },
                                ].map((g) => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => setGranularity(g.id as any)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                            granularity === g.id
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode Garis Selector */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-medium">Mode Garis:</span>
                            <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setChartMode('pos')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                        chartMode === 'pos'
                                            ? 'bg-slate-800 text-white border border-slate-700'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Per Pos Timbangan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartMode('kategori')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                        chartMode === 'kategori'
                                            ? 'bg-slate-800 text-white border border-slate-700'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Per Kategori Kendala
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Baris 3: Legend Interaktif & Insight Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 pb-2">
                    {/* Toggleable Legend Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        {activeSeriesConfig.map((s) => {
                            const isHidden = Boolean(hiddenSeries[s.key]);
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => toggleSeries(s.key)}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                        isHidden
                                            ? 'bg-slate-950 text-slate-600 border-slate-800 opacity-50 line-through'
                                            : 'bg-slate-950/90 text-slate-200 border-slate-800 hover:border-slate-700'
                                    }`}
                                    title="Klik untuk tampilkan / sembunyikan garis ini"
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: s.color }}
                                    />
                                    <span>{s.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Peak & Average Insight Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {timelineAnalytics.peak && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                                Puncak: <strong className="text-rose-200">{timelineAnalytics.peak.label}</strong> ({timelineAnalytics.peak.total} kasus)
                            </span>
                        )}
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 font-medium">
                            Rata-rata:{' '}
                            <strong className="text-slate-200">
                                {timelineAnalytics.avg.toFixed(1)} kasus /{' '}
                                {activeGranularity === 'hourly'
                                    ? 'jam'
                                    : activeGranularity === 'weekly'
                                      ? 'minggu'
                                      : activeGranularity === 'monthly'
                                        ? 'bulan'
                                        : 'hari'}
                            </strong>
                        </span>
                    </div>
                </div>

                {/* Baris 4: Recharts LineChart */}
                <div className="h-[300px] sm:h-[340px] w-full mt-2">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 text-xs">
                            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-indigo-500 border-t-transparent mb-2"></div>
                            <span>Memuat grafik timeline kendala QR...</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-800/60">
                            <p className="font-semibold text-slate-400">Belum ada data pada rentang timeline ini</p>
                            <p className="text-[11px] text-slate-600 mt-1">Ubah rentang waktu atau klik &quot;Semua Waktu&quot; untuk melihat grafik historis.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 12, right: 18, left: -12, bottom: 6 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    stroke="#64748b"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={{ stroke: '#1e293b' }}
                                    tickLine={false}
                                    dy={8}
                                    minTickGap={16}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || payload.length === 0) return null;
                                        const point = payload[0]?.payload as TimelineBucket & { kategoriLain?: number };
                                        return (
                                            <div className="bg-slate-950/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl text-xs min-w-[220px] backdrop-blur-md">
                                                <div className="font-bold text-white pb-2 mb-2 border-b border-slate-800">
                                                    {point?.fullLabel || point?.label}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-slate-300 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                                            Total Kendala
                                                        </span>
                                                        <span className="font-extrabold text-white">{point?.total ?? 0} kasus</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-sky-300 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                                            Pos Air Hitam
                                                        </span>
                                                        <span className="font-bold text-sky-300">{point?.airHitam ?? 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-emerald-300 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                            Pos Harapan Jaya
                                                        </span>
                                                        <span className="font-bold text-emerald-300">{point?.harapanJaya ?? 0}</span>
                                                    </div>
                                                    <div className="pt-1.5 mt-1.5 border-t border-slate-800/80 space-y-1">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-rose-300 flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                                                QR Hangus
                                                            </span>
                                                            <span className="font-semibold text-rose-300">{point?.hangus ?? 0}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-amber-300 flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                                QR Usang / Rusak
                                                            </span>
                                                            <span className="font-semibold text-amber-300">{point?.usang ?? 0}</span>
                                                        </div>
                                                        {(point?.kategoriLain || 0) > 0 && (
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-purple-300 flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                                                    Lainnya
                                                                </span>
                                                                <span className="font-semibold text-purple-300">{point?.kategoriLain}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                {activeSeriesConfig.map((s) =>
                                    hiddenSeries[s.key] ? null : (
                                        <Line
                                            key={s.key}
                                            type="monotone"
                                            dataKey={s.key}
                                            name={s.name}
                                            stroke={s.color}
                                            strokeWidth={s.strokeWidth}
                                            dot={{ r: 3.5, fill: s.color, strokeWidth: 0 }}
                                            activeDot={{ r: 6, fill: s.color, stroke: '#0f172a', strokeWidth: 2 }}
                                        />
                                    )
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
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
                            <option value="yesterday">Kemarin</option>
                            <option value="7days">7 Hari Terakhir</option>
                            <option value="14days">14 Hari Terakhir</option>
                            <option value="30days">30 Hari Terakhir</option>
                            <option value="month">Bulan Ini</option>
                            <option value="custom">Rentang Tanggal Custom</option>
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

