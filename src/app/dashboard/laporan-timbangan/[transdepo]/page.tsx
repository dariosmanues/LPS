'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface LaporanItem {
    id: string;
    syncId: string | null;
    ticketNumber: string;
    plateNumber: string;
    lpsName: string;
    driverName: string;
    vehicleType: string;
    wasteType: string;
    kelurahan: string;
    kecamatan: string;
    transdepo: string;
    grossKg: number | null;
    tareKg: number | null;
    rafaksiKg: number;
    nettoKg: number;
    weighedAt: string;
    source: string;
    operatorName: string;
}

interface Summary {
    totalNettoKg: number;
    totalNettoTon: number;
    totalGrossKg: number;
    totalTareKg: number;
    totalRafaksiKg: number;
    totalTrips: number;
    avgKgPerTrip: number;
    uniqueArmadaCount: number;
    activeLpsCount: number;
}

interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export default function LaporanTimbanganTransdepoPage() {
    const params = useParams();
    const router = useRouter();
    const rawTransdepo = (params?.transdepo as string) || 'air-hitam';
    const isAirHitam = rawTransdepo.toLowerCase().includes('air');
    const currentSlug = isAirHitam ? 'air-hitam' : 'harapan-jaya';

    // Filters
    const [selectedLps, setSelectedLps] = useState<string>('');
    const [selectedRange, setSelectedRange] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Data State
    const [items, setItems] = useState<LaporanItem[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalNettoKg: 0,
        totalNettoTon: 0,
        totalGrossKg: 0,
        totalTareKg: 0,
        totalRafaksiKg: 0,
        totalTrips: 0,
        avgKgPerTrip: 0,
        uniqueArmadaCount: 0,
        activeLpsCount: 0,
    });
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 25,
        totalCount: 0,
        totalPages: 1,
    });
    const [lpsOptions, setLpsOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [exporting, setExporting] = useState<boolean>(false);
    const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

    // Reset page and selected LPS when switching transdepo
    useEffect(() => {
        setSelectedLps('');
        setCurrentPage(1);
    }, [currentSlug]);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            query.set('transdepo', currentSlug);
            if (selectedLps && selectedLps !== 'ALL') {
                query.set('lps', selectedLps);
            }
            query.set('range', selectedRange);
            if (selectedRange === 'custom') {
                if (startDate) query.set('startDate', startDate);
                if (endDate) query.set('endDate', endDate);
            }
            if (searchQuery.trim()) {
                query.set('search', searchQuery.trim());
            }
            query.set('page', currentPage.toString());
            query.set('limit', '25');

            const res = await fetch(`/api/laporan-timbangan?${query.toString()}`);
            const data = await res.json();

            if (data.success) {
                setItems(data.items || []);
                setSummary(data.summary || {
                    totalNettoKg: 0,
                    totalNettoTon: 0,
                    totalGrossKg: 0,
                    totalTareKg: 0,
                    totalRafaksiKg: 0,
                    totalTrips: 0,
                    avgKgPerTrip: 0,
                    uniqueArmadaCount: 0,
                    activeLpsCount: 0,
                });
                setPagination(data.pagination || {
                    page: 1,
                    limit: 25,
                    totalCount: 0,
                    totalPages: 1,
                });
                if (Array.isArray(data.lpsOptions)) {
                    setLpsOptions(data.lpsOptions);
                }
            } else {
                console.error('API returned error:', data.error);
                setItems([]);
            }
        } catch (error) {
            console.error('Error fetching laporan data:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentSlug, selectedLps, selectedRange, startDate, endDate, currentPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchData();
    };

    const handleResetFilter = () => {
        setSelectedLps('');
        setSelectedRange('all');
        setStartDate('');
        setEndDate('');
        setSearchQuery('');
        setShowCustomDate(false);
        setCurrentPage(1);
    };

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const query = new URLSearchParams();
            query.set('transdepo', currentSlug);
            if (selectedLps && selectedLps !== 'ALL') {
                query.set('lps', selectedLps);
            }
            query.set('range', selectedRange);
            if (selectedRange === 'custom') {
                if (startDate) query.set('startDate', startDate);
                if (endDate) query.set('endDate', endDate);
            }
            if (searchQuery.trim()) {
                query.set('search', searchQuery.trim());
            }
            query.set('limit', 'all');

            const res = await fetch(`/api/laporan-timbangan?${query.toString()}`);
            const data = await res.json();

            if (!data.success || !Array.isArray(data.items)) {
                alert('Gagal mengekspor data laporan');
                return;
            }

            const exportRows = data.items.map((item: LaporanItem, idx: number) => {
                const dateWib = new Date(item.weighedAt).toLocaleString('id-ID', {
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
                    `"${item.ticketNumber}"`,
                    `"${dateWib}"`,
                    `"${item.plateNumber}"`,
                    `"${item.vehicleType}"`,
                    `"${item.lpsName.replace(/"/g, '""')}"`,
                    `"${item.kelurahan.replace(/"/g, '""')}"`,
                    `"${item.kecamatan.replace(/"/g, '""')}"`,
                    `"${item.driverName.replace(/"/g, '""')}"`,
                    item.grossKg ?? '',
                    item.tareKg ?? '',
                    item.rafaksiKg ?? 0,
                    item.nettoKg ?? 0,
                    `"${item.transdepo}"`,
                    `"${item.source}"`,
                    `"${item.operatorName}"`,
                ].join(',');
            });

            const headers = [
                'No',
                'No Tiket',
                'Waktu Timbang (WIB)',
                'Plat Nomor',
                'Jenis Armada',
                'Nama LPS',
                'Kelurahan',
                'Kecamatan',
                'Nama Supir',
                'Gross (kg)',
                'Tare (kg)',
                'Rafaksi (kg)',
                'Netto (kg)',
                'Transdepo',
                'Sumber Sensor',
                'Operator',
            ].join(',');

            const csvContent = '\uFEFF' + [headers, ...exportRows].join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const lpsSlug = selectedLps ? selectedLps.replace(/[^a-zA-Z0-9]/g, '_') : 'SEMUA_LPS';
            a.download = `Laporan_Timbangan_${currentSlug.toUpperCase()}_${lpsSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            alert('Terjadi kesalahan saat mengunduh CSV');
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDateTime = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch {
            return isoString;
        }
    };

    const formatKg = (val: number | null | undefined) => {
        if (val === null || val === undefined) return '-';
        return new Intl.NumberFormat('id-ID').format(val);
    };

    return (
        <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
            {/* Top Navigation Switcher between Air Hitam and Harapan Jaya */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <span>⚖️</span>
                        <span>{isAirHitam ? 'Laporan Timbangan Air Hitam' : 'Laporan Timbangan Harapan Jaya'}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitoring data timbangan jembatan dan rekapitulasi tonase per LPS di {isAirHitam ? 'Transdepo Air Hitam' : 'Transdepo Harapan Jaya'}
                    </p>
                </div>

                <div className="inline-flex p-1 bg-gray-100 rounded-xl self-start sm:self-auto border border-gray-200">
                    <Link
                        href="/dashboard/laporan-timbangan/air-hitam"
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                            isAirHitam
                                ? 'bg-white text-blue-700 shadow-sm border border-gray-200/80 font-bold'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${isAirHitam ? 'bg-blue-600' : 'bg-gray-400'}`} />
                        Air Hitam
                    </Link>
                    <Link
                        href="/dashboard/laporan-timbangan/harapan-jaya"
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                            !isAirHitam
                                ? 'bg-white text-emerald-700 shadow-sm border border-gray-200/80 font-bold'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${!isAirHitam ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                        Harapan Jaya
                    </Link>
                </div>
            </div>

            {/* Print Header (Only visible on paper print) */}
            <div className="hidden print:block border-b pb-4 mb-4 text-center">
                <h1 className="text-xl font-bold uppercase text-gray-900">
                    LAPORAN PENIMBANGAN SAMPAH - {isAirHitam ? 'TRANSDEPO AIR HITAM' : 'TRANSDEPO HARAPAN JAYA'}
                </h1>
                <p className="text-xs text-gray-600">
                    Filter LPS: {selectedLps || 'SEMUA LPS'} | Periode: {selectedRange.toUpperCase()} | Dicetak pada: {new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Netto</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                            Ton
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {summary.totalNettoTon.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-gray-500 ml-1">Ton</span>
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                        = {formatKg(summary.totalNettoKg)} kg
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Ritasi</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                            🚛
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {formatKg(summary.totalTrips)}
                        <span className="text-xs font-normal text-gray-500 ml-1">Rit</span>
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                        Tercatat di jembatan timbang
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rata-Rata / Rit</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                            ⚖️
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {formatKg(summary.avgKgPerTrip)}
                        <span className="text-xs font-normal text-gray-500 ml-1">kg</span>
                    </p>
                    <p className="text-xs text-amber-600 font-medium mt-1">
                        Muatan bersih per armada
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">LPS & Armada</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                            🏢
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                        {summary.activeLpsCount}
                        <span className="text-xs font-normal text-gray-500 ml-1">LPS</span>
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                        dari {summary.uniqueArmadaCount} armada aktif
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* PRIMARY REQUIREMENT: Filter Per LPS */}
                    <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-600" />
                                Filter Per LPS:
                            </span>
                            {selectedLps && (
                                <button
                                    onClick={() => { setSelectedLps(''); setCurrentPage(1); }}
                                    className="text-purple-600 hover:text-purple-800 text-[11px] font-normal underline"
                                >
                                    Tampilkan Semua
                                </button>
                            )}
                        </label>
                        <div className="relative">
                            <select
                                value={selectedLps}
                                onChange={(e) => {
                                    setSelectedLps(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 transition-all appearance-none pr-10 cursor-pointer ${
                                    selectedLps
                                        ? 'border-purple-500 bg-purple-50/40 text-purple-900 font-semibold focus:ring-purple-200'
                                        : 'border-gray-200 text-gray-700 focus:ring-purple-200'
                                }`}
                            >
                                <option value="">Semua LPS ({lpsOptions.length} Terdaftar)</option>
                                {lpsOptions.map((lps) => (
                                    <option key={lps} value={lps}>
                                        {lps}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Filter Periode */}
                    <div className="md:col-span-5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Rentang Waktu:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRange('all');
                                    setShowCustomDate(false);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedRange === 'all'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Semua Data
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRange('month');
                                    setShowCustomDate(false);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedRange === 'month'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Bulan Ini (Nov 2026)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRange('last-month');
                                    setShowCustomDate(false);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedRange === 'last-month'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Bulan Lalu (Okt 2026)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRange('week');
                                    setShowCustomDate(false);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedRange === 'week'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                7 Hari
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRange('today');
                                    setShowCustomDate(false);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedRange === 'today'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRange('custom');
                                    setShowCustomDate(!showCustomDate);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedRange === 'custom'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Custom 📅
                            </button>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Cari Transaksi:
                        </label>
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Tiket, Plat, Supir..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-200"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                    }}
                                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Custom Date Pickers Drawer */}
                {showCustomDate && (
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 bg-gray-50/70 p-3 rounded-xl">
                        <span className="text-xs font-bold text-gray-600">Pilih Tanggal:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Mulai:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setSelectedRange('custom');
                                    setCurrentPage(1);
                                }}
                                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Sampai:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setSelectedRange('custom');
                                    setCurrentPage(1);
                                }}
                                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setSelectedRange('all');
                                    setShowCustomDate(false);
                                    setCurrentPage(1);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-medium underline ml-auto"
                            >
                                Hapus Tanggal
                            </button>
                        )}
                    </div>
                )}

                {/* Filter info badge & Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold">Filter aktif:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-200/60">
                            {selectedLps ? `LPS: ${selectedLps}` : 'Semua LPS'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200/60">
                            Periode: {selectedRange === 'all' ? 'Semua Waktu' : selectedRange === 'month' ? 'Nov 2026' : selectedRange === 'last-month' ? 'Okt 2026' : selectedRange}
                        </span>
                        {(selectedLps || selectedRange !== 'all' || searchQuery) && (
                            <button
                                onClick={handleResetFilter}
                                className="text-xs text-gray-500 hover:text-gray-800 underline ml-2 cursor-pointer"
                            >
                                Reset Semua
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Cetak PDF</span>
                        </button>

                        <button
                            onClick={handleExportCsv}
                            disabled={exporting || items.length === 0}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white transition-all shadow-2xs ${
                                exporting || items.length === 0
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{exporting ? 'Mengunduh...' : 'Ekspor Excel / CSV'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-800">
                            Rincian Transaksi Penimbangan
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Menampilkan {items.length} dari {pagination.totalCount} transaksi
                        </p>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
                            <span className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            Memuat data...
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3.5 text-center w-12">No</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Waktu (WIB)</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">No. Tiket</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">No. Polisi</th>
                                <th className="px-4 py-3.5">LPS / Wilayah</th>
                                <th className="px-4 py-3.5">Supir</th>
                                <th className="px-4 py-3.5 text-right whitespace-nowrap">Gross (kg)</th>
                                <th className="px-4 py-3.5 text-right whitespace-nowrap">Tare (kg)</th>
                                <th className="px-4 py-3.5 text-right whitespace-nowrap text-emerald-700 bg-emerald-50/40">Netto (kg)</th>
                                <th className="px-4 py-3.5 text-center whitespace-nowrap">Sumber</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && items.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                            <span>Memuat data timbangan...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-xl text-gray-400">
                                                ⚖️
                                            </div>
                                            <p className="font-semibold text-gray-700">Tidak ada data penimbangan</p>
                                            <p className="text-xs text-gray-400">
                                                {selectedLps
                                                    ? `Tidak ditemukan transaksi untuk LPS "${selectedLps}" pada periode ini.`
                                                    : 'Coba ubah filter periode atau kata kunci pencarian.'}
                                            </p>
                                            {(selectedLps || selectedRange !== 'all') && (
                                                <button
                                                    onClick={handleResetFilter}
                                                    className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-700"
                                                >
                                                    Tampilkan Semua Data
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => {
                                    const rowNumber = (pagination.page - 1) * pagination.limit + index + 1;
                                    return (
                                        <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                                            <td className="px-4 py-3.5 text-center text-gray-400 font-mono text-xs">
                                                {rowNumber}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-xs">
                                                {formatDateTime(item.weighedAt)}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-gray-800">
                                                {item.ticketNumber}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="font-bold text-gray-800">{item.plateNumber}</div>
                                                <span className="text-[10px] uppercase font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {item.vehicleType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-purple-900">{item.lpsName}</div>
                                                <div className="text-xs text-gray-400">
                                                    {item.kelurahan !== '-' ? `Kel. ${item.kelurahan}` : ''}
                                                    {item.kecamatan !== '-' ? `, Kec. ${item.kecamatan}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600">
                                                {item.driverName}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-600">
                                                {formatKg(item.grossKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-600">
                                                {formatKg(item.tareKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                                                {formatKg(item.nettoKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                        item.source.includes('OCR')
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                                    }`}
                                                >
                                                    {item.source}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                        <div className="text-xs text-gray-500">
                            Halaman <span className="font-semibold text-gray-800">{pagination.page}</span> dari{' '}
                            <span className="font-semibold text-gray-800">{pagination.totalPages}</span> (Total{' '}
                            {pagination.totalCount} transaksi)
                        </div>

                        <div className="inline-flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={pagination.page <= 1 || loading}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                    pagination.page <= 1 || loading
                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                        : 'border-gray-200 text-gray-700 hover:bg-gray-100 bg-white'
                                }`}
                            >
                                ← Sebelumnya
                            </button>

                            <span className="text-xs font-mono px-2 text-gray-600">
                                {pagination.page} / {pagination.totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={pagination.page >= pagination.totalPages || loading}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                    pagination.page >= pagination.totalPages || loading
                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                        : 'border-gray-200 text-gray-700 hover:bg-gray-100 bg-white'
                                }`}
                            >
                                Selanjutnya →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

