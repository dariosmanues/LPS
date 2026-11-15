'use client';

import { useState, useMemo } from 'react';

export interface MonthlyStats {
    ritasi: number;
    beratKg: number;
}

export interface ArmadaMonthlyStat {
    id: string;
    platNomor: string;
    namaSupir: string;
    jenisArmada: string;
    wilayahKerja?: string;
    noIzinOperasi?: string;
    namaKetuaLps?: string;
    lokasiTransdepo?: string;
    totalBerat: number;
    totalRitasi?: number;
    monthlyStats?: Record<string, MonthlyStats>;
}

interface LpsMonthlyArmadaReportProps {
    armadaStats: ArmadaMonthlyStat[];
    availableMonths?: string[];
    kelurahanName?: string;
}

export function LpsMonthlyArmadaReport({
    armadaStats = [],
    availableMonths = [],
    kelurahanName = ''
}: LpsMonthlyArmadaReportProps) {
    // Tentukan bulan berjalan sebagai default (format YYYY-MM)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState<string>(
        availableMonths.includes(currentMonthKey)
            ? currentMonthKey
            : (availableMonths[0] || currentMonthKey)
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'detail' | 'matrix'>('detail');

    // Helper format nama bulan (misal "2026-11" -> "November 2026")
    const formatMonthLabel = (monthKey: string) => {
        if (!monthKey || monthKey === 'all') return 'Semua Bulan (Akumulasi)';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('id-ID');
    };

    // Filter armada berdasarkan pencarian
    const filteredArmadas = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return armadaStats;
        return armadaStats.filter(armada =>
            armada.platNomor.toLowerCase().includes(query) ||
            armada.namaSupir.toLowerCase().includes(query) ||
            armada.jenisArmada.toLowerCase().includes(query) ||
            (armada.wilayahKerja && armada.wilayahKerja.toLowerCase().includes(query)) ||
            (armada.noIzinOperasi && armada.noIzinOperasi.toLowerCase().includes(query))
        );
    }, [armadaStats, searchQuery]);

    // Hitung ringkasan statistik untuk bulan yang dipilih
    const summary = useMemo(() => {
        let totalRitasi = 0;
        let totalBeratKg = 0;
        let activeArmadaCount = 0;

        filteredArmadas.forEach(armada => {
            let ritasi = 0;
            let berat = 0;

            if (selectedMonth === 'all') {
                ritasi = armada.totalRitasi || 0;
                berat = armada.totalBerat || 0;
            } else {
                const stat = armada.monthlyStats?.[selectedMonth];
                ritasi = stat?.ritasi || 0;
                berat = stat?.beratKg || 0;
            }

            if (ritasi > 0) activeArmadaCount += 1;
            totalRitasi += ritasi;
            totalBeratKg += berat;
        });

        const avgKgPerRit = totalRitasi > 0 ? Math.round(totalBeratKg / totalRitasi) : 0;

        return {
            totalRitasi,
            totalBeratKg,
            activeArmadaCount,
            totalArmada: filteredArmadas.length,
            avgKgPerRit
        };
    }, [filteredArmadas, selectedMonth]);

    // Ekspor ke CSV
    const handleExportCsv = () => {
        const monthLabel = formatMonthLabel(selectedMonth).replace(/\s+/g, '_');
        const filename = `rekap_armada_${kelurahanName || 'lps'}_${monthLabel}.csv`;

        let csv = 'No,Plat Nomor,Nama Pengemudi,Jenis Armada,No Izin Operasi,Wilayah Kerja,Ritasi,Total Berat (Kg),Rata-rata per Rit (Kg)\n';

        filteredArmadas.forEach((armada, idx) => {
            const ritasi = selectedMonth === 'all'
                ? (armada.totalRitasi || 0)
                : (armada.monthlyStats?.[selectedMonth]?.ritasi || 0);
            const berat = selectedMonth === 'all'
                ? (armada.totalBerat || 0)
                : (armada.monthlyStats?.[selectedMonth]?.beratKg || 0);
            const avg = ritasi > 0 ? Math.round(berat / ritasi) : 0;

            const row = [
                idx + 1,
                `"${armada.platNomor}"`,
                `"${armada.namaSupir || '-'}"`,
                `"${armada.jenisArmada || '-'}"`,
                `"${armada.noIzinOperasi || '-'}"`,
                `"${(armada.wilayahKerja || '-').replace(/"/g, '""')}"`,
                ritasi,
                berat,
                avg
            ];
            csv += row.join(',') + '\n';
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // Cetak Rekap
    const handlePrint = () => {
        window.print();
    };

    const getJenisBadgeClass = (jenis: string) => {
        const j = (jenis || '').toUpperCase();
        if (j.includes('DUMP') || j.includes('TRUK')) {
            return 'bg-orange-50 text-orange-700 border-orange-200';
        }
        if (j.includes('BENTOR') || j.includes('MOTOR')) {
            return 'bg-teal-50 text-teal-700 border-teal-200';
        }
        return 'bg-blue-50 text-blue-700 border-blue-200';
    };

    return (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 00-1 1v1a1 1 0 001 1h1m-1-1a1 1 0 011 1v1a1 1 0 01-1 1h-1" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-800 text-lg sm:text-xl">
                                Rekap Armada per Bulan
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Sinkron TimbangQR
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Laporan ritasi pengangkutan dan volume sampah per armada {kelurahanName ? `Kelurahan ${kelurahanName}` : ''}
                        </p>
                    </div>
                </div>

                {/* Tombol Action (Mode View, Unduh, Cetak) */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setViewMode('detail')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                viewMode === 'detail'
                                    ? 'bg-white text-indigo-700 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title="Tampilan Rincian Bulanan"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span>Rincian</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('matrix')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                viewMode === 'matrix'
                                    ? 'bg-white text-indigo-700 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title="Tampilan Matriks Komparasi Bulanan"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Matriks Bulan</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition-colors"
                        title="Unduh data dalam format CSV / Excel"
                    >
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">Unduh</span> CSV
                    </button>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition-colors"
                        title="Cetak laporan rekap armada"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Cetak</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar: Dropdown Bulan & Input Pencarian */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                    <label htmlFor="select-month-armada" className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Pilih Bulan:</span>
                    </label>
                    <select
                        id="select-month-armada"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-xs cursor-pointer"
                    >
                        {availableMonths.map(m => (
                            <option key={m} value={m}>
                                {formatMonthLabel(m)} {m === currentMonthKey ? ' (Bulan Berjalan)' : ''}
                            </option>
                        ))}
                        <option value="all">Semua Bulan (Akumulasi Total)</option>
                    </select>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari plat nomor / supir..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs rounded-lg py-1.5 pl-9 pr-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Mini Cards (Bulan Terpilih) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-linear-to-br from-blue-50/70 to-indigo-50/40 p-4 rounded-xl border border-blue-100/70">
                    <p className="text-xs font-medium text-blue-700">Armada Beroperasi</p>
                    <p className="text-xl font-bold text-blue-900 mt-1">
                        {summary.activeArmadaCount} <span className="text-xs font-normal text-blue-600">/ {summary.totalArmada} Unit</span>
                    </p>
                    <p className="text-[11px] text-blue-600/80 mt-0.5">
                        {summary.activeArmadaCount === summary.totalArmada ? '100% armada aktif' : `${Math.round((summary.activeArmadaCount / (summary.totalArmada || 1)) * 100)}% aktif`}
                    </p>
                </div>

                <div className="bg-linear-to-br from-purple-50/70 to-fuchsia-50/40 p-4 rounded-xl border border-purple-100/70">
                    <p className="text-xs font-medium text-purple-700">Total Ritasi</p>
                    <p className="text-xl font-bold text-purple-900 mt-1">
                        {formatNumber(summary.totalRitasi)} <span className="text-xs font-normal text-purple-600">Rit</span>
                    </p>
                    <p className="text-[11px] text-purple-600/80 mt-0.5">
                        {formatMonthLabel(selectedMonth)}
                    </p>
                </div>

                <div className="bg-linear-to-br from-emerald-50/70 to-teal-50/40 p-4 rounded-xl border border-emerald-100/70">
                    <p className="text-xs font-medium text-emerald-700">Total Sampah Terangkut</p>
                    <p className="text-xl font-bold text-emerald-900 mt-1">
                        {formatNumber(summary.totalBeratKg)} <span className="text-xs font-normal text-emerald-600">Kg</span>
                    </p>
                    <p className="text-[11px] text-emerald-600/80 mt-0.5">
                        {(summary.totalBeratKg / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton
                    </p>
                </div>

                <div className="bg-linear-to-br from-amber-50/70 to-orange-50/40 p-4 rounded-xl border border-amber-100/70">
                    <p className="text-xs font-medium text-amber-700">Rata-rata Muatan</p>
                    <p className="text-xl font-bold text-amber-900 mt-1">
                        {formatNumber(summary.avgKgPerRit)} <span className="text-xs font-normal text-amber-600">Kg / Rit</span>
                    </p>
                    <p className="text-[11px] text-amber-600/80 mt-0.5">
                        Efisiensi muatan armada
                    </p>
                </div>
            </div>

            {/* TABEL 1: Mode Rincian Bulanan */}
            {viewMode === 'detail' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="bg-gray-50/90 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3.5 text-center w-12">No</th>
                                <th scope="col" className="px-4 py-3.5">No. Polisi (Plat)</th>
                                <th scope="col" className="px-4 py-3.5">Pengemudi (Supir)</th>
                                <th scope="col" className="px-4 py-3.5">Jenis Armada</th>
                                <th scope="col" className="px-4 py-3.5">Wilayah Kerja / No. Izin</th>
                                <th scope="col" className="px-4 py-3.5 text-center">Ritasi</th>
                                <th scope="col" className="px-4 py-3.5 text-right">Total Sampah</th>
                                <th scope="col" className="px-4 py-3.5 text-right">Rata-rata/Rit</th>
                                <th scope="col" className="px-4 py-3.5 text-right w-36">Kontribusi (%)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredArmadas.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                        Tidak ada data armada yang sesuai pencarian atau filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredArmadas.map((armada, idx) => {
                                    const ritasi = selectedMonth === 'all'
                                        ? (armada.totalRitasi || 0)
                                        : (armada.monthlyStats?.[selectedMonth]?.ritasi || 0);
                                    const beratKg = selectedMonth === 'all'
                                        ? (armada.totalBerat || 0)
                                        : (armada.monthlyStats?.[selectedMonth]?.beratKg || 0);
                                    const avgKg = ritasi > 0 ? Math.round(beratKg / ritasi) : 0;
                                    const sharePercent = summary.totalBeratKg > 0
                                        ? Math.round((beratKg / summary.totalBeratKg) * 1000) / 10
                                        : 0;

                                    return (
                                        <tr key={armada.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3.5 text-center text-xs text-gray-500 font-medium">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className="inline-block px-2.5 py-1 bg-gray-900 text-white font-mono font-bold text-xs rounded-md shadow-2xs tracking-wider border border-gray-700">
                                                    {armada.platNomor}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap font-medium text-gray-800 text-xs sm:text-sm">
                                                {armada.namaSupir || '-'}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getJenisBadgeClass(armada.jenisArmada)}`}>
                                                    {armada.jenisArmada || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 max-w-xs">
                                                <div className="font-medium text-gray-700 truncate" title={armada.wilayahKerja}>
                                                    {armada.wilayahKerja || '-'}
                                                </div>
                                                <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                                                    Izin: {armada.noIzinOperasi || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    ritasi > 0
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    {formatNumber(ritasi)} Rit
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <span className="font-bold text-emerald-700 text-sm">
                                                    {formatNumber(beratKg)}
                                                </span>
                                                <span className="text-xs text-gray-500 font-normal ml-1">kg</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap text-xs text-gray-600">
                                                {formatNumber(avgKg)} kg
                                            </td>
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs font-semibold text-gray-700 min-w-9 text-right">
                                                        {sharePercent}%
                                                    </span>
                                                    <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="bg-emerald-500 h-1.5 rounded-full"
                                                            style={{ width: `${Math.min(sharePercent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {filteredArmadas.length > 0 && (
                            <tfoot className="bg-gray-50 font-bold text-gray-800 text-xs border-t-2 border-gray-200">
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 text-right uppercase tracking-wider text-gray-600">
                                        Total ({formatMonthLabel(selectedMonth)}):
                                    </td>
                                    <td className="px-4 py-3 text-center text-purple-800">
                                        {formatNumber(summary.totalRitasi)} Rit
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-800">
                                        {formatNumber(summary.totalBeratKg)} kg
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700">
                                        {formatNumber(summary.avgKgPerRit)} kg
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-700">
                                        100%
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}

            {/* TABEL 2: Mode Matriks Komparasi Bulanan */}
            {viewMode === 'matrix' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 uppercase font-semibold">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-center w-10">No</th>
                                <th scope="col" className="px-4 py-3">Plat Nomor</th>
                                <th scope="col" className="px-4 py-3">Supir & Jenis</th>
                                {availableMonths.map(m => (
                                    <th key={m} scope="col" className="px-4 py-3 text-center bg-indigo-50/50 border-l border-gray-200">
                                        {formatMonthLabel(m)}
                                    </th>
                                ))}
                                <th scope="col" className="px-4 py-3 text-center bg-emerald-50 border-l border-emerald-200">
                                    Total Akumulasi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredArmadas.length === 0 ? (
                                <tr>
                                    <td colSpan={4 + availableMonths.length} className="px-4 py-8 text-center text-gray-500">
                                        Tidak ada data armada.
                                    </td>
                                </tr>
                            ) : (
                                filteredArmadas.map((armada, idx) => (
                                    <tr key={armada.id} className="hover:bg-gray-50/80">
                                        <td className="px-3 py-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                                                {armada.platNomor}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                            <div className="font-medium">{armada.namaSupir || '-'}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">{armada.jenisArmada || '-'}</div>
                                        </td>
                                        {availableMonths.map(m => {
                                            const stat = armada.monthlyStats?.[m];
                                            const rit = stat?.ritasi || 0;
                                            const kg = stat?.beratKg || 0;
                                            return (
                                                <td key={m} className="px-4 py-3 text-center border-l border-gray-100">
                                                    {rit > 0 ? (
                                                        <div>
                                                            <div className="font-bold text-emerald-700">{formatNumber(kg)} kg</div>
                                                            <div className="text-[10px] text-purple-600 font-medium">({rit} rit)</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center border-l border-emerald-200 bg-emerald-50/30">
                                            <div className="font-bold text-emerald-800">
                                                {formatNumber(armada.totalBerat || 0)} kg
                                            </div>
                                            <div className="text-[10px] text-purple-700 font-semibold">
                                                ({armada.totalRitasi || 0} rit)
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
