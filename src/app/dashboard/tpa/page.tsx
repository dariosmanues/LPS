'use client';

import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui';
import * as XLSX from 'xlsx';
import {
    TPA_PEMILAHAN_META,
    TPA_PEMILAHAN_MONTHS,
    type TpaMonthlyRecord,
} from '@/lib/tpa-pemilahan-data';

type ActiveTab = 'ringkasan' | 'harian' | 'analisis';

const CATEGORIES = [
    {
        key: 'karaKaraKg' as const,
        label: 'Kara-Kara',
        shortLabel: 'Kara-Kara',
        color: 'bg-emerald-600',
        lightBg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800',
        hex: '#059669',
        desc: 'Material barang bekas campuran / kara-kara layak daur ulang',
    },
    {
        key: 'ampasKg' as const,
        label: 'Ampas',
        shortLabel: 'Ampas',
        color: 'bg-amber-500',
        lightBg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        hex: '#f59e0b',
        desc: 'Residu organik / ampas hasil pemilahan lapangan TPA 2',
    },
    {
        key: 'plastikKg' as const,
        label: 'Plastik',
        shortLabel: 'Plastik',
        color: 'bg-blue-600',
        lightBg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
        hex: '#2563eb',
        desc: 'Sampah plastik kemasan, botol, dan lembaran anorganik',
    },
    {
        key: 'kartonKertasKg' as const,
        label: 'Karton / Kertas',
        shortLabel: 'Karton/Kertas',
        color: 'bg-purple-600',
        lightBg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800',
        hex: '#9333ea',
        desc: 'Kardus, karton, dupleks, dan kertas terpilah',
    },
    {
        key: 'banKg' as const,
        label: 'Ban',
        shortLabel: 'Ban',
        color: 'bg-rose-600',
        lightBg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-800',
        hex: '#e11d48',
        desc: 'Ban bekas kendaraan hasil pemilahan di area TPA 2',
    },
];

function formatKg(val: number): string {
    return val.toLocaleString('id-ID');
}

function formatTon(kg: number, digits = 2): string {
    return (kg / 1000).toLocaleString('id-ID', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

function formatPct(part: number, total: number): string {
    if (!total) return '0,0%';
    return ((part / total) * 100).toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }) + '%';
}

export default function TpaPemilahanDashboardPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('ringkasan');
    const [selectedMonthCode, setSelectedMonthCode] = useState<string>('2026-11');
    const [scopeMode, setScopeMode] = useState<'ALL_YEAR' | 'MONTH'>('ALL_YEAR');
    const [searchDate, setSearchDate] = useState<string>('');
    const [showOnlyActiveDays, setShowOnlyActiveDays] = useState<boolean>(false);

    const selectedMonth: TpaMonthlyRecord = useMemo(() => {
        return (
            TPA_PEMILAHAN_MONTHS.find((m) => m.monthCode === selectedMonthCode) ||
            TPA_PEMILAHAN_MONTHS[0]
        );
    }, [selectedMonthCode]);

    const activeStats = useMemo(() => {
        if (scopeMode === 'MONTH') {
            return {
                label: selectedMonth.monthLabel,
                totalKg: selectedMonth.totalKg,
                karaKaraKg: selectedMonth.karaKaraKg,
                plastikKg: selectedMonth.plastikKg,
                kartonKertasKg: selectedMonth.kartonKertasKg,
                ampasKg: selectedMonth.ampasKg,
                banKg: selectedMonth.banKg,
                activeDays: selectedMonth.activeDaysCount,
                avgDailyKg: selectedMonth.avgDailyKg,
            };
        }
        return {
            label: 'Januari – November 2026 (Kumulatif Tahunan)',
            totalKg: TPA_PEMILAHAN_META.grandTotalKg,
            karaKaraKg: TPA_PEMILAHAN_META.grandKaraKaraKg,
            plastikKg: TPA_PEMILAHAN_META.grandPlastikKg,
            kartonKertasKg: TPA_PEMILAHAN_META.grandKartonKertasKg,
            ampasKg: TPA_PEMILAHAN_META.grandAmpasKg,
            banKg: TPA_PEMILAHAN_META.grandBanKg,
            activeDays: TPA_PEMILAHAN_META.totalActiveDays,
            avgDailyKg: Math.round(
                TPA_PEMILAHAN_META.grandTotalKg / Math.max(1, TPA_PEMILAHAN_META.totalActiveDays)
            ),
        };
    }, [scopeMode, selectedMonth]);

    const filteredDays = useMemo(() => {
        return selectedMonth.days.filter((d) => {
            if (showOnlyActiveDays && !d.hasData) return false;
            if (searchDate.trim()) {
                const q = searchDate.toLowerCase().trim();
                return (
                    d.tanggal.toLowerCase().includes(q) ||
                    d.isoDate.toLowerCase().includes(q) ||
                    String(d.no) === q
                );
            }
            return true;
        });
    }, [selectedMonth, showOnlyActiveDays, searchDate]);

    const maxMonthTotalKg = useMemo(() => {
        return Math.max(...TPA_PEMILAHAN_MONTHS.map((m) => m.totalKg), 1);
    }, []);

    const maxDayTotalKg = useMemo(() => {
        return Math.max(...selectedMonth.days.map((d) => d.totalKg), 1);
    }, [selectedMonth]);

    const handleSelectMonthDetail = (monthCode: string) => {
        setSelectedMonthCode(monthCode);
        setActiveTab('harian');
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Rekapitulasi Tahunan 2026
        const summaryRows = [
            [TPA_PEMILAHAN_META.title],
            ['LOKASI: ' + TPA_PEMILAHAN_META.lokasi],
            ['KETERANGAN: ' + TPA_PEMILAHAN_META.keterangan],
            [],
            [
                'NO',
                'BULAN',
                'HARI AKTIF',
                'KARA-KARA (KG)',
                'PLASTIK (KG)',
                'KARTON / KERTAS (KG)',
                'AMPAS (KG)',
                'BAN (KG)',
                'TOTAL (KG)',
                'TOTAL (TON)',
                'RATA-RATA HARIAN (KG)',
            ],
            ...TPA_PEMILAHAN_MONTHS.map((m, idx) => [
                idx + 1,
                m.monthLabel.toUpperCase(),
                m.activeDaysCount,
                m.karaKaraKg,
                m.plastikKg,
                m.kartonKertasKg,
                m.ampasKg,
                m.banKg,
                m.totalKg,
                Number((m.totalKg / 1000).toFixed(3)),
                m.avgDailyKg,
            ]),
            [
                'TOTAL',
                'JANUARI - DESEMBER 2026',
                TPA_PEMILAHAN_META.totalActiveDays,
                TPA_PEMILAHAN_META.grandKaraKaraKg,
                TPA_PEMILAHAN_META.grandPlastikKg,
                TPA_PEMILAHAN_META.grandKartonKertasKg,
                TPA_PEMILAHAN_META.grandAmpasKg,
                TPA_PEMILAHAN_META.grandBanKg,
                TPA_PEMILAHAN_META.grandTotalKg,
                Number((TPA_PEMILAHAN_META.grandTotalKg / 1000).toFixed(3)),
                Math.round(TPA_PEMILAHAN_META.grandTotalKg / TPA_PEMILAHAN_META.totalActiveDays),
            ],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'REKAP TAHUNAN 2026');

        // Sheet per Bulan (JANUARI s/d DESEMBER)
        for (const m of TPA_PEMILAHAN_MONTHS) {
            const rows = [
                [TPA_PEMILAHAN_META.title],
                [`BULAN: ${m.monthLabel.toUpperCase()}`],
                [],
                ['NO', 'TANGGAL', 'KARA-KARA (kg)', 'PLASTIK (kg)', 'KARTON / KERTAS (kg)', 'AMPAS (kg)', 'BAN (kg)', 'TOTAL (kg)'],
                ...m.days.map((d) => [
                    d.no,
                    d.tanggal,
                    d.hasData ? d.karaKaraKg : '',
                    d.hasData ? d.plastikKg : '',
                    d.hasData ? d.kartonKertasKg : '',
                    d.hasData ? d.ampasKg : '',
                    d.hasData ? d.banKg : '',
                    d.totalKg,
                ]),
                [
                    'TOTAL',
                    '',
                    m.karaKaraKg,
                    m.plastikKg,
                    m.kartonKertasKg,
                    m.ampasKg,
                    m.banKg,
                    m.totalKg,
                ],
                [],
                ['', 'KETERANGAN:'],
                ['', TPA_PEMILAHAN_META.keterangan],
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), m.sheetName);
        }

        XLSX.writeFile(wb, 'REKAPITULASI_TONASE_SAMPAH_TPA_2_2026.xlsx');
    };

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <div className="print:hidden relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-800 via-teal-700 to-cyan-700 p-6 md:p-8 shadow-xl text-white">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                                TPA 2 MUARA FAJAR • KOTA PEKANBARU
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-300 text-emerald-950 shadow-xs">
                                10 ORANG PEMULUNG / HARI
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-300 text-amber-950 shadow-xs">
                                5 KATEGORI PEMILAHAN
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                            Rekapitulasi Tonase Pemilahan Sampah di TPA 2 (2026)
                        </h1>
                        <p className="text-emerald-100 text-sm mt-1.5 max-w-3xl">
                            Monitoring harian & bulanan hasil pemilahan sampah di TPA 2 Kota Pekanbaru meliputi{' '}
                            <strong>Kara-Kara, Plastik, Karton / Kertas, Ampas, dan Ban</strong> (Januari – Desember 2026).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <div className="bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/25 inline-flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setScopeMode('ALL_YEAR')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    scopeMode === 'ALL_YEAR'
                                        ? 'bg-white text-emerald-900 shadow-xs'
                                        : 'text-white/90 hover:bg-white/10'
                                }`}
                            >
                                Kumulatif 2026
                            </button>
                            <button
                                type="button"
                                onClick={() => setScopeMode('MONTH')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    scopeMode === 'MONTH'
                                        ? 'bg-white text-emerald-900 shadow-xs'
                                        : 'text-white/90 hover:bg-white/10'
                                }`}
                            >
                                Per Bulan ({selectedMonth.shortName})
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="px-4 py-2.5 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                            📥 Ekspor Excel (.xlsx)
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2.5 rounded-2xl bg-emerald-950/50 hover:bg-emerald-950/70 text-white border border-white/25 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                            🖨️ Cetak Laporan
                        </button>
                    </div>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-5 border border-emerald-200 bg-linear-to-br from-emerald-50/70 to-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                Total Sampah Terpilah
                            </p>
                            <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                                {formatTon(activeStats.totalKg)}{' '}
                                <span className="text-sm font-bold text-emerald-700">Ton</span>
                            </p>
                            <p className="text-xs text-gray-600 font-semibold mt-1">
                                {formatKg(activeStats.totalKg)} kg • {activeStats.label}
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                            ⚖️
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 border border-teal-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Rata-rata Pemilahan Harian
                            </p>
                            <p className="text-2xl sm:text-3xl font-black text-teal-700 mt-1">
                                {formatKg(activeStats.avgDailyKg)}{' '}
                                <span className="text-sm font-bold text-gray-500">kg/hari</span>
                            </p>
                            <p className="text-xs text-teal-700 font-semibold mt-1">
                                {formatTon(activeStats.avgDailyKg)} Ton/hari ({activeStats.activeDays} hari aktif)
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-xl shrink-0">
                            📈
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 border border-blue-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Produktivitas Pemulung
                            </p>
                            <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">
                                {formatKg(Math.round(activeStats.avgDailyKg / 10))}{' '}
                                <span className="text-sm font-bold text-gray-500">kg/orang</span>
                            </p>
                            <p className="text-xs text-blue-700 font-semibold mt-1">
                                10 Orang Pemulung / Hari di Lapangan
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xl shrink-0">
                            👷
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 border border-purple-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Kategori Dominan
                            </p>
                            <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
                                Kara-Kara
                            </p>
                            <p className="text-xs text-purple-700 font-semibold mt-1">
                                {formatTon(activeStats.karaKaraKg)} Ton ({formatPct(activeStats.karaKaraKg, activeStats.totalKg)} dari total)
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center text-xl shrink-0">
                            ♻️
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* 5 Waste Sorting Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {CATEGORIES.map((cat) => {
                    const valKg = activeStats[cat.key];
                    const pct = activeStats.totalKg > 0 ? (valKg / activeStats.totalKg) * 100 : 0;
                    return (
                        <GlassCard
                            key={cat.key}
                            className={`p-4 border ${cat.border} ${cat.lightBg}/40 flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${cat.badge}`}>
                                        {cat.label}
                                    </span>
                                    <span className={`text-xs font-black font-mono ${cat.text}`}>
                                        {formatPct(valKg, activeStats.totalKg)}
                                    </span>
                                </div>
                                <p className="text-xl font-black text-gray-900 font-mono">
                                    {formatKg(valKg)} <span className="text-xs font-semibold text-gray-500">kg</span>
                                </p>
                                <p className={`text-xs font-bold ${cat.text} mt-0.5`}>
                                    Setara {formatTon(valKg)} Ton
                                </p>
                            </div>
                            <div className="mt-3">
                                <div className="w-full h-2 bg-gray-200/80 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-1" title={cat.desc}>
                                    Rata-rata: {formatKg(Math.round(valKg / Math.max(1, activeStats.activeDays)))} kg/hari
                                </p>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            {/* Navigation Tabs */}
            <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('ringkasan')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                            activeTab === 'ringkasan'
                                ? 'bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                    >
                        📊 Rekapitulasi Bulanan (Januari – Desember 2026)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('harian')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                            activeTab === 'harian'
                                ? 'bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                    >
                        📅 Tabel Harian Per Bulan ({selectedMonth.monthLabel})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('analisis')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                            activeTab === 'analisis'
                                ? 'bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                    >
                        ♻️ Analisis Komposisi & Kinerja Pemulung
                    </button>
                </div>

                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                    📌 Keterangan: <strong>{TPA_PEMILAHAN_META.keterangan}</strong>
                </div>
            </div>

            {/* TAB 1: RINGKASAN BULANAN (JANUARI - DESEMBER 2026) */}
            {activeTab === 'ringkasan' && (
                <div className="space-y-6">
                    {/* Visual Stacked Bar Chart per Month */}
                    <GlassCard className="p-6 border border-gray-100" hover={false}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">
                                    Grafik Tren Tonase Pemilahan Sampah Bulanan TPA 2 (2026)
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Klik pada salah satu bulan untuk membuka rincian tonase harian tanggal 1 s/d akhir bulan
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                                {CATEGORIES.map((c) => (
                                    <span key={c.key} className="inline-flex items-center gap-1.5 text-gray-700">
                                        <span className={`w-3 h-3 rounded-sm ${c.color}`} />
                                        {c.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {TPA_PEMILAHAN_MONTHS.map((m) => {
                                const widthPct = (m.totalKg / maxMonthTotalKg) * 100;
                                const isCurrentSelected = m.monthCode === selectedMonthCode;
                                return (
                                    <div
                                        key={m.monthCode}
                                        onClick={() => handleSelectMonthDetail(m.monthCode)}
                                        className={`p-3 rounded-2xl border transition cursor-pointer ${
                                            isCurrentSelected
                                                ? 'border-emerald-400 bg-emerald-50/40'
                                                : 'border-gray-100 hover:border-emerald-300 hover:bg-gray-50/70'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-gray-900 w-28">
                                                    {m.monthLabel}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono text-[11px]">
                                                    {m.activeDaysCount} hari aktif
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 font-mono">
                                                <span className="text-gray-500">
                                                    Rata-rata: <strong>{formatKg(m.avgDailyKg)} kg/hari</strong>
                                                </span>
                                                <span className="font-black text-emerald-700 text-sm">
                                                    {formatKg(m.totalKg)} kg ({formatTon(m.totalKg)} Ton)
                                                </span>
                                            </div>
                                        </div>

                                        {m.totalKg > 0 ? (
                                            <div
                                                className="h-5 rounded-xl overflow-hidden flex bg-gray-100 shadow-2xs"
                                                style={{ width: `${Math.max(12, widthPct)}%` }}
                                            >
                                                {CATEGORIES.map((cat) => {
                                                    const segPct = (m[cat.key] / m.totalKg) * 100;
                                                    return (
                                                        <div
                                                            key={cat.key}
                                                            className={`${cat.color} h-full transition-all`}
                                                            style={{ width: `${segPct}%` }}
                                                            title={`${cat.label}: ${formatKg(m[cat.key])} kg (${formatPct(m[cat.key], m.totalKg)})`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="h-5 rounded-xl bg-gray-100 flex items-center px-3 text-[11px] text-gray-400 italic">
                                                Belum ada data terealisasi (Desember 2026)
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>

                    {/* Complete 12-Month Rekapitulasi Table */}
                    <GlassCard className="p-6 border border-gray-100" hover={false}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">
                                    Tabel Rekapitulasi Tonase Pemilahan Sampah TPA 2 Tahun 2026
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Rekapitulasi bulanan per jenis sampah terpilah dalam satuan Kilogram (kg) dan Ton
                                </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                Total 2026: {formatKg(TPA_PEMILAHAN_META.grandTotalKg)} kg ({formatTon(TPA_PEMILAHAN_META.grandTotalKg)} Ton)
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-gray-200">
                            <table className="w-full text-left text-sm text-gray-700">
                                <thead className="bg-emerald-900 text-white text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-3.5 text-center">No</th>
                                        <th className="px-4 py-3.5">Bulan</th>
                                        <th className="px-3 py-3.5 text-center">Hari Aktif</th>
                                        <th className="px-4 py-3.5 text-right">Kara-Kara (kg)</th>
                                        <th className="px-4 py-3.5 text-right">Plastik (kg)</th>
                                        <th className="px-4 py-3.5 text-right">Karton / Kertas (kg)</th>
                                        <th className="px-4 py-3.5 text-right">Ampas (kg)</th>
                                        <th className="px-4 py-3.5 text-right">Ban (kg)</th>
                                        <th className="px-4 py-3.5 text-right bg-emerald-950">Total (kg)</th>
                                        <th className="px-4 py-3.5 text-right">Total (Ton)</th>
                                        <th className="px-4 py-3.5 text-center print:hidden">Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white font-mono text-xs sm:text-sm">
                                    {TPA_PEMILAHAN_MONTHS.map((m, idx) => (
                                        <tr
                                            key={m.monthCode}
                                            className={`hover:bg-emerald-50/50 transition ${
                                                m.totalKg === 0 ? 'text-gray-400 bg-gray-50/40' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-center font-bold text-gray-500">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 font-sans font-bold text-gray-900">
                                                {m.monthLabel}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                                    {m.activeDaysCount} hr
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                                                {formatKg(m.karaKaraKg)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-blue-700">
                                                {formatKg(m.plastikKg)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-purple-700">
                                                {formatKg(m.kartonKertasKg)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-amber-700">
                                                {formatKg(m.ampasKg)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-rose-700">
                                                {formatKg(m.banKg)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-gray-900 bg-emerald-50/60">
                                                {formatKg(m.totalKg)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-800">
                                                {formatTon(m.totalKg)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-sans print:hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectMonthDetail(m.monthCode)}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                                                >
                                                    Buka Harian →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-emerald-950 text-white font-mono text-xs sm:text-sm font-extrabold">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3.5 font-sans">
                                            GRAND TOTAL TAHUN 2026
                                        </td>
                                        <td className="px-3 py-3.5 text-center">
                                            {TPA_PEMILAHAN_META.totalActiveDays} hr
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-emerald-300">
                                            {formatKg(TPA_PEMILAHAN_META.grandKaraKaraKg)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-blue-300">
                                            {formatKg(TPA_PEMILAHAN_META.grandPlastikKg)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-purple-300">
                                            {formatKg(TPA_PEMILAHAN_META.grandKartonKertasKg)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-amber-300">
                                            {formatKg(TPA_PEMILAHAN_META.grandAmpasKg)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-rose-300">
                                            {formatKg(TPA_PEMILAHAN_META.grandBanKg)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-yellow-300 text-base">
                                            {formatKg(TPA_PEMILAHAN_META.grandTotalKg)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-emerald-300">
                                            {formatTon(TPA_PEMILAHAN_META.grandTotalKg)} Ton
                                        </td>
                                        <td className="print:hidden" />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* TAB 2: DETAIL HARIAN PER BULAN */}
            {activeTab === 'harian' && (
                <div className="space-y-5">
                    {/* Month Selector Pills */}
                    <GlassCard className="print:hidden p-4 border border-gray-100" hover={false}>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                            Pilih Sheet Bulan (Januari – Desember 2026):
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {TPA_PEMILAHAN_MONTHS.map((m) => {
                                const active = m.monthCode === selectedMonthCode;
                                return (
                                    <button
                                        key={m.monthCode}
                                        type="button"
                                        onClick={() => {
                                            setSelectedMonthCode(m.monthCode);
                                            setScopeMode('MONTH');
                                        }}
                                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                            active
                                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                                : 'bg-gray-50 hover:bg-emerald-50 text-gray-800 border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold">{m.sheetName}</span>
                                            <span
                                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                    active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {m.activeDaysCount}h
                                            </span>
                                        </div>
                                        <p
                                            className={`text-xs font-mono font-bold mt-1 ${
                                                active ? 'text-emerald-200' : 'text-emerald-700'
                                            }`}
                                        >
                                            {formatTon(m.totalKg)} Ton
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </GlassCard>

                    {/* Daily Table for Selected Month */}
                    <GlassCard className="p-6 border border-gray-100" hover={false}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                            <div>
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-1.5">
                                    SHEET: {selectedMonth.sheetName} 2026
                                </div>
                                <h2 className="text-xl font-extrabold text-gray-900">
                                    Rekapitulasi Tonase Sampah Harian TPA 2 — Bulan {selectedMonth.monthLabel}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {TPA_PEMILAHAN_META.keterangan} • Total Bulan {selectedMonth.shortName}:{' '}
                                    <strong className="text-emerald-700">
                                        {formatKg(selectedMonth.totalKg)} kg ({formatTon(selectedMonth.totalKg)} Ton)
                                    </strong>
                                </p>
                            </div>

                            <div className="print:hidden flex flex-wrap items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Cari tanggal (mis. 15)..."
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                                />
                                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showOnlyActiveDays}
                                        onChange={(e) => setShowOnlyActiveDays(e.target.checked)}
                                        className="rounded text-emerald-600"
                                    />
                                    Hanya Hari Terisi
                                </label>
                            </div>
                        </div>

                        {selectedMonth.days.length === 0 ? (
                            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-base font-bold text-gray-600">
                                    Sheet {selectedMonth.monthLabel} Belum Memiliki Data Harian
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Periode Desember 2026 belum berjalan pada berkas rekapitulasi TPA 2.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                <table className="w-full text-left text-sm text-gray-700">
                                    <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
                                        <tr>
                                            <th className="px-3.5 py-3 text-center">No</th>
                                            <th className="px-4 py-3">Tanggal</th>
                                            <th className="px-4 py-3 text-right">Kara-Kara (kg)</th>
                                            <th className="px-4 py-3 text-right">Plastik (kg)</th>
                                            <th className="px-4 py-3 text-right">Karton / Kertas (kg)</th>
                                            <th className="px-4 py-3 text-right">Ampas (kg)</th>
                                            <th className="px-4 py-3 text-right">Ban (kg)</th>
                                            <th className="px-4 py-3 text-right bg-emerald-900">Total (kg)</th>
                                            <th className="px-4 py-3 text-right">Per Pemulung (10 Org)</th>
                                            <th className="px-4 py-3 w-36 print:hidden">Visual Proporsi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white font-mono text-xs sm:text-sm">
                                        {filteredDays.map((d) => {
                                            const barPct = (d.totalKg / maxDayTotalKg) * 100;
                                            return (
                                                <tr
                                                    key={d.no}
                                                    className={`hover:bg-emerald-50/40 transition ${
                                                        !d.hasData ? 'text-gray-400 bg-gray-50/50 italic' : ''
                                                    }`}
                                                >
                                                    <td className="px-3.5 py-2.5 text-center font-bold text-gray-500">
                                                        {d.no}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-sans font-semibold text-gray-900">
                                                        {d.tanggal}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">
                                                        {d.hasData ? formatKg(d.karaKaraKg) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-blue-700 font-semibold">
                                                        {d.hasData ? formatKg(d.plastikKg) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-purple-700 font-semibold">
                                                        {d.hasData ? formatKg(d.kartonKertasKg) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-amber-700 font-semibold">
                                                        {d.hasData ? formatKg(d.ampasKg) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-rose-700 font-semibold">
                                                        {d.hasData ? formatKg(d.banKg) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-black text-gray-900 bg-emerald-50/60">
                                                        {formatKg(d.totalKg)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-gray-600">
                                                        {d.hasData ? `${formatKg(Math.round(d.totalKg / 10))} kg` : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 print:hidden">
                                                        {d.hasData ? (
                                                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                                                <div
                                                                    className="bg-emerald-600 h-full"
                                                                    style={{ width: `${(d.karaKaraKg / d.totalKg) * barPct}%` }}
                                                                />
                                                                <div
                                                                    className="bg-blue-600 h-full"
                                                                    style={{ width: `${(d.plastikKg / d.totalKg) * barPct}%` }}
                                                                />
                                                                <div
                                                                    className="bg-purple-600 h-full"
                                                                    style={{ width: `${(d.kartonKertasKg / d.totalKg) * barPct}%` }}
                                                                />
                                                                <div
                                                                    className="bg-amber-500 h-full"
                                                                    style={{ width: `${(d.ampasKg / d.totalKg) * barPct}%` }}
                                                                />
                                                                <div
                                                                    className="bg-rose-600 h-full"
                                                                    style={{ width: `${(d.banKg / d.totalKg) * barPct}%` }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-gray-400">Belum diisi</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white font-mono text-xs sm:text-sm font-extrabold">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3.5 font-sans">
                                                TOTAL BULAN {selectedMonth.monthLabel.toUpperCase()} ({selectedMonth.activeDaysCount} Hari)
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-emerald-300">
                                                {formatKg(selectedMonth.karaKaraKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-blue-300">
                                                {formatKg(selectedMonth.plastikKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-purple-300">
                                                {formatKg(selectedMonth.kartonKertasKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-amber-300">
                                                {formatKg(selectedMonth.ampasKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-rose-300">
                                                {formatKg(selectedMonth.banKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-yellow-300 text-base bg-emerald-950">
                                                {formatKg(selectedMonth.totalKg)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-emerald-200">
                                                {formatKg(Math.round(selectedMonth.totalKg / 10))} kg/org
                                            </td>
                                            <td className="print:hidden" />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <strong>KETERANGAN LAPANGAN:</strong> {TPA_PEMILAHAN_META.keterangan}.
                            </div>
                            <div className="font-mono font-bold">
                                Rata-rata Bulan {selectedMonth.shortName}: {formatKg(selectedMonth.avgDailyKg)} kg/hari ({formatKg(Math.round(selectedMonth.avgDailyKg / 10))} kg/pemulung/hari)
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* TAB 3: ANALISIS KOMPOSISI & PRODUKTIVITAS PEMULUNG */}
            {activeTab === 'analisis' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GlassCard className="p-6 border border-gray-100" hover={false}>
                        <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                            Distribusi & Peringkat Kategori Sampah Terpilah (2026)
                        </h2>
                        <p className="text-xs text-gray-500 mb-5">
                            Akumulasi 330 hari kerja pemilahan sampah di TPA 2 Muara Fajar Kota Pekanbaru
                        </p>

                        <div className="space-y-4">
                            {CATEGORIES.map((cat, idx) => {
                                const totalCatKg = TPA_PEMILAHAN_META[
                                    cat.key === 'karaKaraKg'
                                        ? 'grandKaraKaraKg'
                                        : cat.key === 'plastikKg'
                                            ? 'grandPlastikKg'
                                            : cat.key === 'kartonKertasKg'
                                                ? 'grandKartonKertasKg'
                                                : cat.key === 'ampasKg'
                                                    ? 'grandAmpasKg'
                                                    : 'grandBanKg'
                                ];
                                const pct = (totalCatKg / TPA_PEMILAHAN_META.grandTotalKg) * 100;
                                const dailyAvg = Math.round(totalCatKg / TPA_PEMILAHAN_META.totalActiveDays);
                                const perPickerDaily = (dailyAvg / 10).toFixed(1);

                                return (
                                    <div key={cat.key} className={`p-4 rounded-2xl border ${cat.border} ${cat.lightBg}/30`}>
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 font-mono text-xs font-black flex items-center justify-center text-gray-700">
                                                    #{idx + 1}
                                                </span>
                                                <span className="font-extrabold text-gray-900 text-sm">
                                                    {cat.label}
                                                </span>
                                            </div>
                                            <span className="font-mono font-black text-sm text-gray-900">
                                                {formatKg(totalCatKg)} kg ({formatTon(totalCatKg)} Ton)
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2.5">{cat.desc}</p>
                                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                            <div
                                                className={`h-full ${cat.color} rounded-full`}
                                                style={{ width: `${Math.max(4, pct)}%` }}
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-gray-600">
                                            <span>Porsi: <strong>{formatPct(totalCatKg, TPA_PEMILAHAN_META.grandTotalKg)}</strong></span>
                                            <span>Rata-rata: <strong>{formatKg(dailyAvg)} kg/hari</strong></span>
                                            <span>Per Pemulung: <strong>{perPickerDaily} kg/orang/hari</strong></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 border border-gray-100 flex flex-col justify-between" hover={false}>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                                Ringkasan Kinerja Tim Pemulung Lapangan TPA 2
                            </h2>
                            <p className="text-xs text-gray-500 mb-5">
                                Parameter operasional berdasarkan catatan resmi: &ldquo;{TPA_PEMILAHAN_META.keterangan}&rdquo;
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                                    <p className="text-xs font-bold text-emerald-800 uppercase">Jumlah Personel Pemilah</p>
                                    <p className="text-2xl font-black text-emerald-950 mt-1">10 Orang / Hari</p>
                                    <p className="text-xs text-emerald-700 mt-1">Tim pemulung aktif harian di area TPA 2</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                                    <p className="text-xs font-bold text-blue-800 uppercase">Total Hari Operasional</p>
                                    <p className="text-2xl font-black text-blue-950 mt-1">
                                        {TPA_PEMILAHAN_META.totalActiveDays} Hari
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">1 Januari 2026 s/d 26 November 2026</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                                    <p className="text-xs font-bold text-purple-800 uppercase">Bulan Tonase Tertinggi</p>
                                    <p className="text-2xl font-black text-purple-950 mt-1">Juli 2026</p>
                                    <p className="text-xs text-purple-700 mt-1">406.010 kg (406,01 Ton • 13.097 kg/hari)</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                                    <p className="text-xs font-bold text-amber-800 uppercase">Total Beban Kerja Per Pemulung</p>
                                    <p className="text-2xl font-black text-amber-950 mt-1">384,80 Ton / Orang</p>
                                    <p className="text-xs text-amber-700 mt-1">Akumulasi 384.801 kg per pemulung sepanjang 2026</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                Ikhtisar Pemilahan Material Daur Ulang vs Residu Ampas
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div>
                                    <p className="text-xs text-slate-400">Material Anorganik Terpilah (Kara-Kara, Plastik, Karton, Ban)</p>
                                    <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                                        {formatTon(
                                            TPA_PEMILAHAN_META.grandKaraKaraKg +
                                                TPA_PEMILAHAN_META.grandPlastikKg +
                                                TPA_PEMILAHAN_META.grandKartonKertasKg +
                                                TPA_PEMILAHAN_META.grandBanKg
                                        )}{' '}
                                        Ton ({formatPct(
                                            TPA_PEMILAHAN_META.grandKaraKaraKg +
                                                TPA_PEMILAHAN_META.grandPlastikKg +
                                                TPA_PEMILAHAN_META.grandKartonKertasKg +
                                                TPA_PEMILAHAN_META.grandBanKg,
                                            TPA_PEMILAHAN_META.grandTotalKg
                                        )})
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Ampas Terpilah</p>
                                    <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
                                        {formatTon(TPA_PEMILAHAN_META.grandAmpasKg)} Ton (
                                        {formatPct(TPA_PEMILAHAN_META.grandAmpasKg, TPA_PEMILAHAN_META.grandTotalKg)})
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
