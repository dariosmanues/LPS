'use client';

import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui';
import * as XLSX from 'xlsx';
import {
    TPA_PEMILAHAN_META,
    TPA_PEMILAHAN_MONTHS,
    type TpaMonthlyRecord,
} from '@/lib/tpa-pemilahan-data';
import {
    TPA_ARMADA_MASUK_META,
    TPA_ARMADA_MASTER_VEHICLES,
    TPA_ARMADA_MASUK_MONTHS,
    type TpaArmadaMonthlyRecord,
    type TpaArmadaDailySheet,
} from '@/lib/tpa-armada-masuk-data';

type TpaDashboardMode = 'armada_masuk' | 'pemilahan';
type ArmadaTab = 'rekap_bulanan' | 'lembar_harian' | 'master_armada' | 'analisis_armada';
type PemilahanTab = 'ringkasan' | 'harian' | 'analisis';

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

function formatNum(val: number): string {
    return val.toLocaleString('id-ID');
}

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
    return (
        ((part / total) * 100).toLocaleString('id-ID', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }) + '%'
    );
}

export default function TpaDashboardPage() {
    // Top-level Dashboard Mode inside Menu TPA (/dashboard/tpa)
    const [dashboardMode, setDashboardMode] = useState<TpaDashboardMode>('armada_masuk');

    // =========================================================================
    // STATE FOR DASHBOARD 1: DAFTAR ARMADA YANG MASUK DI TPA 2 (JAN - JUN 2026)
    // =========================================================================
    const [armadaTab, setArmadaTab] = useState<ArmadaTab>('rekap_bulanan');
    const [armadaScope, setArmadaScope] = useState<'ALL_6_MONTHS' | 'SINGLE_MONTH'>('ALL_6_MONTHS');
    const [selectedArmadaMonthCode, setSelectedArmadaMonthCode] = useState<string>('2026-01');
    const [selectedDaySheetName, setSelectedDaySheetName] = useState<string>('1');
    const [plateSearch, setPlateSearch] = useState<string>('');
    const [pengirimFilter, setPengirimFilter] = useState<'ALL' | 'VENDOR' | 'DLHK' | 'EKSTERNAL'>('ALL');
    const [ketFilter, setKetFilter] = useState<'ALL' | 'DT' | 'TRONTON'>('ALL');

    const selectedArmadaMonth: TpaArmadaMonthlyRecord = useMemo(() => {
        return (
            TPA_ARMADA_MASUK_MONTHS.find((m) => m.monthCode === selectedArmadaMonthCode) ||
            TPA_ARMADA_MASUK_MONTHS[0]
        );
    }, [selectedArmadaMonthCode]);

    const selectedDaySheet: TpaArmadaDailySheet = useMemo(() => {
        return (
            selectedArmadaMonth.days.find((d) => d.sheetName === selectedDaySheetName) ||
            selectedArmadaMonth.days[0]
        );
    }, [selectedArmadaMonth, selectedDaySheetName]);

    const activeArmadaStats = useMemo(() => {
        if (armadaScope === 'SINGLE_MONTH') {
            return {
                scopeLabel: `Bulan ${selectedArmadaMonth.monthLabel} (${selectedArmadaMonth.daysCount} Hari / Sheet)`,
                daysCount: selectedArmadaMonth.daysCount,
                uniqueVehicles: selectedArmadaMonth.uniqueVehiclesCount,
                totalVisits: selectedArmadaMonth.totalArmadaVisits,
                totalRitasi: selectedArmadaMonth.totalRitasi,
                vendorVisits: selectedArmadaMonth.vendorUnitsTotal,
                dlhkVisits: selectedArmadaMonth.dlhkUnitsTotal,
                eksternalVisits: selectedArmadaMonth.eksternalUnitsTotal,
                dtVisits: selectedArmadaMonth.dtUnitsTotal,
                trontonVisits: selectedArmadaMonth.trontonUnitsTotal,
                vendorDtRitasi: selectedArmadaMonth.vendorDtRitasiTotal,
                vendorTrontonRitasi: selectedArmadaMonth.vendorTrontonRitasiTotal,
                dlhkRitasi: selectedArmadaMonth.dlhkRitasiTotal,
                avgDailyArmada: selectedArmadaMonth.avgDailyArmada,
                avgDailyRitasi: selectedArmadaMonth.avgDailyRitasi,
            };
        }
        return {
            scopeLabel: 'Kumulatif Januari – Juni 2026 (6 Bulan • 181 Hari Operasional)',
            daysCount: TPA_ARMADA_MASUK_META.totalDays,
            uniqueVehicles: TPA_ARMADA_MASUK_META.uniqueVehiclesCount,
            totalVisits: TPA_ARMADA_MASUK_META.grandTotalArmadaVisits,
            totalRitasi: TPA_ARMADA_MASUK_META.grandTotalRitasi,
            vendorVisits: TPA_ARMADA_MASUK_META.grandVendorUnits,
            dlhkVisits: TPA_ARMADA_MASUK_META.grandDlhkUnits,
            eksternalVisits: TPA_ARMADA_MASUK_META.grandEksternalUnits,
            dtVisits: TPA_ARMADA_MASUK_META.grandDtUnits,
            trontonVisits: TPA_ARMADA_MASUK_META.grandTrontonUnits,
            vendorDtRitasi: TPA_ARMADA_MASUK_META.grandVendorDtRitasi,
            vendorTrontonRitasi: TPA_ARMADA_MASUK_META.grandVendorTrontonRitasi,
            dlhkRitasi: TPA_ARMADA_MASUK_META.grandDlhkRitasi,
            avgDailyArmada: TPA_ARMADA_MASUK_META.dailyArmadaCount,
            avgDailyRitasi: TPA_ARMADA_MASUK_META.dailyRitasiTotal,
        };
    }, [armadaScope, selectedArmadaMonth]);

    const filteredVehicles = useMemo(() => {
        return TPA_ARMADA_MASTER_VEHICLES.filter((v) => {
            if (pengirimFilter !== 'ALL' && v.pengirim !== pengirimFilter) return false;
            if (ketFilter !== 'ALL' && v.ket !== ketFilter) return false;
            if (plateSearch.trim()) {
                const q = plateSearch.toLowerCase().trim();
                return (
                    v.plateNumber.toLowerCase().includes(q) ||
                    v.pengirim.toLowerCase().includes(q) ||
                    v.ket.toLowerCase().includes(q) ||
                    String(v.no) === q
                );
            }
            return true;
        });
    }, [pengirimFilter, ketFilter, plateSearch]);

    const filteredSummary = useMemo(() => {
        const totalUnits = filteredVehicles.length;
        const dlhkUnits = filteredVehicles.reduce((acc, v) => acc + v.dlhk, 0);
        const vendorUnits = filteredVehicles.reduce((acc, v) => acc + v.vendor, 0);
        const eksternalUnits = filteredVehicles.reduce((acc, v) => acc + v.eksternal, 0);
        const dtUnits = filteredVehicles.filter((v) => v.ket === 'DT').length;
        const trontonUnits = filteredVehicles.filter((v) => v.ket === 'TRONTON').length;
        const dailyRitasi = filteredVehicles.reduce((acc, v) => acc + v.ritasi, 0);
        return {
            totalUnits,
            dlhkUnits,
            vendorUnits,
            eksternalUnits,
            dtUnits,
            trontonUnits,
            dailyRitasi,
        };
    }, [filteredVehicles]);

    const maxArmadaMonthRitasi = useMemo(() => {
        return Math.max(...TPA_ARMADA_MASUK_MONTHS.map((m) => m.totalRitasi), 1);
    }, []);

    const handleOpenMonthDailySheet = (monthCode: string, daySheet = '1') => {
        setSelectedArmadaMonthCode(monthCode);
        setSelectedDaySheetName(daySheet);
        setArmadaScope('SINGLE_MONTH');
        setArmadaTab('lembar_harian');
    };

    const handleExportArmadaRekapExcel = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Rekapitulasi Bulanan Jan - Jun 2026
        const rekapRows = [
            ['DAFTAR ARMADA YANG MASUK DI TPA 2 MUARAFAJAR - KOTA PEKANBARU'],
            ['REKAPITULASI BULANAN JANUARI - JUNI 2026 (6 BULAN / 181 HARI OPERASIONAL)'],
            ['NAMA PETUGAS : SECURITY | SIF KERJA : PAGI / SORE / MALAM'],
            [],
            [
                'NO',
                'BULAN',
                'FILE SUMBER EXCEL',
                'JUMLAH HARI (SHEET)',
                'ARMADA UNIK / HARI',
                'KUNJUNGAN DLHK (UNIT-HARI)',
                'KUNJUNGAN VENDOR (UNIT-HARI)',
                'KUNJUNGAN EKSTERNAL (UNIT-HARI)',
                'TOTAL KUNJUNGAN (UNIT-HARI)',
                'RITASI VENDOR DT',
                'RITASI VENDOR TRONTON',
                'RITASI DLHK DT',
                'TOTAL RITASI MASUK TPA',
                'RATA-RATA RITASI / HARI',
            ],
            ...TPA_ARMADA_MASUK_MONTHS.map((m, idx) => [
                idx + 1,
                m.monthLabel.toUpperCase(),
                m.sourceFileName,
                m.daysCount,
                m.uniqueVehiclesCount,
                m.dlhkUnitsTotal,
                m.vendorUnitsTotal,
                m.eksternalUnitsTotal,
                m.totalArmadaVisits,
                m.vendorDtRitasiTotal,
                m.vendorTrontonRitasiTotal,
                m.dlhkRitasiTotal,
                m.totalRitasi,
                m.avgDailyRitasi,
            ]),
            [
                'TOTAL',
                'JANUARI - JUNI 2026',
                '6 FILE MASTER EXCEL',
                TPA_ARMADA_MASUK_META.totalDays,
                TPA_ARMADA_MASUK_META.uniqueVehiclesCount,
                TPA_ARMADA_MASUK_META.grandDlhkUnits,
                TPA_ARMADA_MASUK_META.grandVendorUnits,
                TPA_ARMADA_MASUK_META.grandEksternalUnits,
                TPA_ARMADA_MASUK_META.grandTotalArmadaVisits,
                TPA_ARMADA_MASUK_META.grandVendorDtRitasi,
                TPA_ARMADA_MASUK_META.grandVendorTrontonRitasi,
                TPA_ARMADA_MASUK_META.grandDlhkRitasi,
                TPA_ARMADA_MASUK_META.grandTotalRitasi,
                TPA_ARMADA_MASUK_META.dailyRitasiTotal,
            ],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rekapRows), 'REKAP JAN-JUN 2026');

        // Sheet 2: Master 85 Armada & Akumulasi 6 Bulan
        const masterRows = [
            ['MASTER 85 ARMADA YANG MASUK DI TPA 2 MUARAFAJAR & AKUMULASI RITASI (JANUARI - JUNI 2026)'],
            ['NAMA PETUGAS : SECURITY | SIF KERJA : PAGI / SORE / MALAM'],
            [],
            [
                'NO',
                'NO PELAT MOBIL',
                'NAMA PENGIRIM',
                'DLHK',
                'VENDOR',
                'EKSTERNAL',
                'KET (JENIS)',
                'RITASI / HARI',
                'RITASI JAN (31H)',
                'RITASI FEB (28H)',
                'RITASI MAR (31H)',
                'RITASI APR (30H)',
                'RITASI MEI (31H)',
                'RITASI JUN (30H)',
                'TOTAL HARI MASUK (181H)',
                'TOTAL RITASI 6 BULAN',
            ],
            ...TPA_ARMADA_MASTER_VEHICLES.map((v) => [
                v.no,
                v.plateNumber,
                v.pengirim,
                v.dlhk || '',
                v.vendor || '',
                v.eksternal || '',
                v.ket,
                v.ritasi,
                v.ritasi * 31,
                v.ritasi * 28,
                v.ritasi * 31,
                v.ritasi * 30,
                v.ritasi * 31,
                v.ritasi * 30,
                181,
                v.ritasi * 181,
            ]),
            [
                'TOTAL',
                '85 UNIT ARMADA',
                '',
                TPA_ARMADA_MASUK_META.dailyDlhkUnits,
                TPA_ARMADA_MASUK_META.dailyVendorUnits,
                TPA_ARMADA_MASUK_META.dailyEksternalUnits,
                '77 DT / 8 TRONTON',
                TPA_ARMADA_MASUK_META.dailyRitasiTotal,
                TPA_ARMADA_MASUK_META.dailyRitasiTotal * 31,
                TPA_ARMADA_MASUK_META.dailyRitasiTotal * 28,
                TPA_ARMADA_MASUK_META.dailyRitasiTotal * 31,
                TPA_ARMADA_MASUK_META.dailyRitasiTotal * 30,
                TPA_ARMADA_MASUK_META.dailyRitasiTotal * 31,
                TPA_ARMADA_MASUK_META.dailyRitasiTotal * 30,
                181,
                TPA_ARMADA_MASUK_META.grandTotalRitasi,
            ],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(masterRows), 'MASTER 85 ARMADA');

        XLSX.writeFile(wb, 'REKAP_MASTER_ARMADA_MASUK_TPA2_JAN_JUN_2026.xlsx');
    };

    const handleExportSingleMonthWorkbook = (monthRec: TpaArmadaMonthlyRecord) => {
        const wb = XLSX.utils.book_new();
        for (const day of monthRec.days) {
            const sheetRows = [
                ['DAFTAR ARMADA YANG MASUK DI TPA 2 MUARAFAJAR', '', '', '', '', '', ''],
                ['KOTA PEKANBARU', '', '', '', '', '', ''],
                [`NAMA PETUGAS : ${day.namaPetugas}`, '', '', '', '', '', ''],
                [`SIF KERJA              : ${day.sifKerja}`, '', '', '', '', '', ''],
                [`HARI/TANGGAL   : ${day.hariTanggal}`, '', '', '', '', '', ''],
                [],
                ['NO', 'NO PELAT MOBIL', 'NAMA PENGIRIM', '', '', 'KET', 'RITASI'],
                ['', '', 'DLHK', 'VENDOR', 'EKSTERNAL', '', ''],
                ...TPA_ARMADA_MASTER_VEHICLES.map((v) => [
                    v.no,
                    v.plateNumber,
                    v.dlhk ? 1 : '',
                    v.vendor ? 1 : '',
                    v.eksternal ? 1 : '',
                    v.ket,
                    v.ritasi,
                ]),
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetRows), day.sheetName);
        }
        XLSX.writeFile(wb, monthRec.sourceFileName.replace(/\s+/g, '_'));
    };

    // =========================================================================
    // STATE FOR DASHBOARD 2: PEMILAHAN SAMPAH TPA 2 (EXISTING)
    // =========================================================================
    const [activeTab, setActiveTab] = useState<PemilahanTab>('ringkasan');
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
            {/* Top-Level TPA Dashboard Mode Switcher */}
            <div className="print:hidden bg-white rounded-3xl p-3 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setDashboardMode('armada_masuk')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2.5 cursor-pointer ${
                            dashboardMode === 'armada_masuk'
                                ? 'bg-linear-to-r from-indigo-900 via-blue-800 to-cyan-800 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-800'
                        }`}
                    >
                        <span className="text-lg">🚛</span>
                        <div className="text-left">
                            <div>Dashboard Armada Masuk TPA 2 Muara Fajar</div>
                            <div
                                className={`text-[10px] font-semibold ${
                                    dashboardMode === 'armada_masuk' ? 'text-cyan-200' : 'text-gray-500'
                                }`}
                            >
                                Master 6 Bulan (Januari – Juni 2026 • 181 Sheet Harian • 85 Armada)
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setDashboardMode('pemilahan')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2.5 cursor-pointer ${
                            dashboardMode === 'pemilahan'
                                ? 'bg-linear-to-r from-emerald-800 via-teal-700 to-cyan-700 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                    >
                        <span className="text-lg">♻️</span>
                        <div className="text-left">
                            <div>Dashboard Pemilahan Sampah TPA 2</div>
                            <div
                                className={`text-[10px] font-semibold ${
                                    dashboardMode === 'pemilahan' ? 'text-emerald-200' : 'text-gray-500'
                                }`}
                            >
                                Rekapitulasi Tonase Terpilah (Kara-Kara, Plastik, Karton, Ampas, Ban)
                            </div>
                        </div>
                    </button>
                </div>

                <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold">Menu TPA 2 Muara Fajar • Kota Pekanbaru</span>
                </div>
            </div>

            {/* =====================================================================
                DASHBOARD 1: MASTER DAFTAR ARMADA YANG MASUK DI TPA 2 (JAN - JUN 2026)
               ===================================================================== */}
            {dashboardMode === 'armada_masuk' && (
                <div className="space-y-6">
                    {/* Hero Banner Armada Masuk TPA 2 */}
                    <div className="print:hidden relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 md:p-8 shadow-xl text-white border border-indigo-500/30">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-400 text-slate-950 shadow-xs">
                                        TPA 2 MUARAFAJAR • KOTA PEKANBARU
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-cyan-200 border border-white/20">
                                        👮 NAMA PETUGAS : {TPA_ARMADA_MASUK_META.namaPetugas}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                                        🕒 SIF KERJA : {TPA_ARMADA_MASUK_META.sifKerja}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                                        📅 JANUARI – JUNI 2026 (181 HARI)
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                    Daftar Armada yang Masuk di TPA 2 Muara Fajar (Januari – Juni 2026)
                                </h1>
                                <p className="text-indigo-200 text-sm mt-1.5 max-w-3xl">
                                    Dashboard rekapitulasi resmi pos pencatatan <strong>Security TPA 2 Muara Fajar Kota Pekanbaru</strong> untuk armada pengangkut sampah{' '}
                                    <strong>DLHK, VENDOR, dan EKSTERNAL</strong> (Jenis <strong>Dump Truck / DT</strong> &amp; <strong>TRONTON</strong>) berdasarkan 6 berkas Master Excel Januari s/d Juni 2026.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 inline-flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setArmadaScope('ALL_6_MONTHS')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            armadaScope === 'ALL_6_MONTHS'
                                                ? 'bg-white text-indigo-950 shadow-xs'
                                                : 'text-white/90 hover:bg-white/10'
                                        }`}
                                    >
                                        Kumulatif Jan–Jun 2026
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setArmadaScope('SINGLE_MONTH')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            armadaScope === 'SINGLE_MONTH'
                                                ? 'bg-white text-indigo-950 shadow-xs'
                                                : 'text-white/90 hover:bg-white/10'
                                        }`}
                                    >
                                        Per Bulan ({selectedArmadaMonth.shortName})
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleExportArmadaRekapExcel}
                                    className="px-4 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    📥 Ekspor Rekap Excel (.xlsx)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleExportSingleMonthWorkbook(selectedArmadaMonth)}
                                    className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                    title={`Unduh buku Excel ${selectedArmadaMonth.daysCount} sheet harian untuk bulan ${selectedArmadaMonth.monthLabel}`}
                                >
                                    📗 Unduh Excel {selectedArmadaMonth.shortName} ({selectedArmadaMonth.daysCount} Sheet)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-3.5 py-2.5 rounded-2xl bg-indigo-950/60 hover:bg-indigo-950/80 text-white border border-white/20 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    🖨️ Cetak
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Top 4 KPI Cards for Armada Masuk TPA 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <GlassCard className="p-5 border border-indigo-200 bg-linear-to-br from-indigo-50/70 to-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                        Total Ritasi Masuk TPA 2
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 font-mono">
                                        {formatNum(activeArmadaStats.totalRitasi)}{' '}
                                        <span className="text-sm font-sans font-bold text-indigo-700">Ritasi</span>
                                    </p>
                                    <p className="text-xs text-gray-600 font-semibold mt-1">
                                        Rata-rata <strong>{formatNum(activeArmadaStats.avgDailyRitasi)} Ritasi/Hari</strong> ({activeArmadaStats.daysCount} hari)
                                    </p>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-indigo-700 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                                    🔄
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-5 border border-blue-200 bg-linear-to-br from-blue-50/60 to-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                                        Total Kunjungan Armada
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-blue-800 mt-1 font-mono">
                                        {formatNum(activeArmadaStats.totalVisits)}{' '}
                                        <span className="text-sm font-sans font-bold text-gray-500">Unit-Hari</span>
                                    </p>
                                    <p className="text-xs text-blue-700 font-semibold mt-1">
                                        <strong>{activeArmadaStats.uniqueVehicles} Armada Aktif / Hari</strong> di Pos Security
                                    </p>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                                    🚛
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-5 border border-emerald-200 bg-linear-to-br from-emerald-50/60 to-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                        Armada VENDOR vs DLHK
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 font-mono">
                                        76 <span className="text-sm font-sans font-bold text-emerald-700">Vendor</span>{' '}
                                        <span className="text-gray-300">/</span>{' '}
                                        9 <span className="text-sm font-sans font-bold text-amber-700">DLHK</span>
                                    </p>
                                    <p className="text-xs text-emerald-800 font-semibold mt-1">
                                        Vendor: {formatNum(activeArmadaStats.vendorVisits)} kunjungan • DLHK: {formatNum(activeArmadaStats.dlhkVisits)} kunjungan
                                    </p>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                                    🏢
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-5 border border-amber-200 bg-linear-to-br from-amber-50/60 to-white">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                                        Jenis Armada (DT vs Tronton)
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 font-mono">
                                        77 <span className="text-sm font-sans font-bold text-amber-700">DT</span>{' '}
                                        <span className="text-gray-300">/</span>{' '}
                                        8 <span className="text-sm font-sans font-bold text-purple-700">Tronton</span>
                                    </p>
                                    <p className="text-xs text-amber-800 font-semibold mt-1">
                                        DT: {formatNum(activeArmadaStats.vendorDtRitasi + activeArmadaStats.dlhkRitasi)} Rit • Tronton: {formatNum(activeArmadaStats.vendorTrontonRitasi)} Rit
                                    </p>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                                    🏗️
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* 5 Pengirim & Fleet Breakdown Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                        <GlassCard className="p-4 border border-blue-200 bg-blue-50/30">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
                                    VENDOR • DUMP TRUCK (DT)
                                </span>
                                <span className="text-xs font-mono font-black text-blue-700">2 Rit/Hari</span>
                            </div>
                            <p className="text-xl font-black text-gray-900 font-mono">
                                68 <span className="text-xs font-sans font-semibold text-gray-500">Unit Armada (No. 1–68)</span>
                            </p>
                            <p className="text-xs font-bold text-blue-700 mt-1">
                                {formatNum(activeArmadaStats.vendorDtRitasi)} Ritasi ({formatPct(activeArmadaStats.vendorDtRitasi, activeArmadaStats.totalRitasi)})
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                                136 Ritasi/Hari • {formatNum(68 * activeArmadaStats.daysCount)} Kunjungan
                            </p>
                        </GlassCard>

                        <GlassCard className="p-4 border border-purple-200 bg-purple-50/30">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                                    VENDOR • TRONTON
                                </span>
                                <span className="text-xs font-mono font-black text-purple-700">3 Rit/Hari</span>
                            </div>
                            <p className="text-xl font-black text-gray-900 font-mono">
                                8 <span className="text-xs font-sans font-semibold text-gray-500">Unit Armada (No. 69–76)</span>
                            </p>
                            <p className="text-xs font-bold text-purple-700 mt-1">
                                {formatNum(activeArmadaStats.vendorTrontonRitasi)} Ritasi ({formatPct(activeArmadaStats.vendorTrontonRitasi, activeArmadaStats.totalRitasi)})
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                                24 Ritasi/Hari • {formatNum(8 * activeArmadaStats.daysCount)} Kunjungan
                            </p>
                        </GlassCard>

                        <GlassCard className="p-4 border border-amber-200 bg-amber-50/30">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900">
                                    DLHK • DUMP TRUCK (DT)
                                </span>
                                <span className="text-xs font-mono font-black text-amber-800">1 Rit/Hari</span>
                            </div>
                            <p className="text-xl font-black text-gray-900 font-mono">
                                9 <span className="text-xs font-sans font-semibold text-gray-500">Unit Armada (No. 77–85)</span>
                            </p>
                            <p className="text-xs font-bold text-amber-800 mt-1">
                                {formatNum(activeArmadaStats.dlhkRitasi)} Ritasi ({formatPct(activeArmadaStats.dlhkRitasi, activeArmadaStats.totalRitasi)})
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                                9 Ritasi/Hari • {formatNum(9 * activeArmadaStats.daysCount)} Kunjungan
                            </p>
                        </GlassCard>

                        <GlassCard className="p-4 border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gray-200 text-gray-700">
                                    PENGIRIM EKSTERNAL
                                </span>
                                <span className="text-xs font-mono font-black text-gray-500">0,0%</span>
                            </div>
                            <p className="text-xl font-black text-gray-900 font-mono">
                                0 <span className="text-xs font-sans font-semibold text-gray-500">Unit Armada</span>
                            </p>
                            <p className="text-xs font-bold text-gray-600 mt-1">
                                0 Ritasi • 0 Kunjungan
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Kolom Eksternal nihil pada Jan–Jun 2026
                            </p>
                        </GlassCard>

                        <GlassCard className="p-4 border border-emerald-200 bg-emerald-50/30">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                                    POS SECURITY TPA 2
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-700">3 Sif Kerja</span>
                            </div>
                            <p className="text-xl font-black text-gray-900 font-mono">
                                181 <span className="text-xs font-sans font-semibold text-gray-500">Sheet Harian</span>
                            </p>
                            <p className="text-xs font-bold text-emerald-700 mt-1">
                                Pagi / Sore / Malam
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                                01 Jan 2026 s/d 30 Jun 2026 (6 Bulan)
                            </p>
                        </GlassCard>
                    </div>

                    {/* Sub-Tabs for Armada Masuk TPA 2 */}
                    <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setArmadaTab('rekap_bulanan')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                                    armadaTab === 'rekap_bulanan'
                                        ? 'bg-linear-to-r from-indigo-700 to-blue-700 text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-800'
                                }`}
                            >
                                📊 Rekapitulasi 6 Bulan (Januari – Juni 2026)
                            </button>
                            <button
                                type="button"
                                onClick={() => setArmadaTab('lembar_harian')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                                    armadaTab === 'lembar_harian'
                                        ? 'bg-linear-to-r from-indigo-700 to-blue-700 text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-800'
                                }`}
                            >
                                📅 Lembar Harian Security ({selectedDaySheet.hariTanggal})
                            </button>
                            <button
                                type="button"
                                onClick={() => setArmadaTab('master_armada')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                                    armadaTab === 'master_armada'
                                        ? 'bg-linear-to-r from-indigo-700 to-blue-700 text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-800'
                                }`}
                            >
                                🚛 Master 85 Armada &amp; Ritasi 6 Bulan
                            </button>
                            <button
                                type="button"
                                onClick={() => setArmadaTab('analisis_armada')}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                                    armadaTab === 'analisis_armada'
                                        ? 'bg-linear-to-r from-indigo-700 to-blue-700 text-white shadow-md'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-800'
                                }`}
                            >
                                📈 Analisis Pengirim (DLHK vs Vendor) &amp; Jenis Armada
                            </button>
                        </div>

                        <div className="text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl">
                            📌 Scope Aktif: <strong>{activeArmadaStats.scopeLabel}</strong>
                        </div>
                    </div>

                    {/* SUB-TAB 1: REKAPITULASI BULANAN JANUARI - JUNI 2026 */}
                    {armadaTab === 'rekap_bulanan' && (
                        <div className="space-y-6">
                            {/* Visual Bar Chart per Month */}
                            <GlassCard className="p-6 border border-gray-100" hover={false}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-gray-900">
                                            Grafik Tren Kunjungan &amp; Ritasi Armada Masuk TPA 2 Muara Fajar (Januari – Juni 2026)
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Klik pada salah satu bulan untuk membuka Lembar Harian Security tanggal 1 s/d akhir bulan
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                                            <span className="w-3 h-3 rounded-sm bg-blue-600" />
                                            Vendor DT (136 Rit/hr)
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                                            <span className="w-3 h-3 rounded-sm bg-purple-600" />
                                            Vendor Tronton (24 Rit/hr)
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                                            <span className="w-3 h-3 rounded-sm bg-amber-500" />
                                            DLHK DT (9 Rit/hr)
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {TPA_ARMADA_MASUK_MONTHS.map((m) => {
                                        const widthPct = (m.totalRitasi / maxArmadaMonthRitasi) * 100;
                                        const isCurrent = m.monthCode === selectedArmadaMonthCode;
                                        const vDtPct = (m.vendorDtRitasiTotal / m.totalRitasi) * 100;
                                        const vTrPct = (m.vendorTrontonRitasiTotal / m.totalRitasi) * 100;
                                        const dlhkPct = (m.dlhkRitasiTotal / m.totalRitasi) * 100;

                                        return (
                                            <div
                                                key={m.monthCode}
                                                onClick={() => handleOpenMonthDailySheet(m.monthCode, '1')}
                                                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                                                    isCurrent
                                                        ? 'border-indigo-400 bg-indigo-50/40'
                                                        : 'border-gray-100 hover:border-indigo-300 hover:bg-gray-50/70'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-extrabold text-gray-900 w-32 text-sm">
                                                            {m.monthLabel}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono text-[11px] font-bold">
                                                            {m.daysCount} Sheet Harian
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono text-[11px]">
                                                            📄 {m.sourceFileName}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 font-mono">
                                                        <span className="text-gray-600">
                                                            Kunjungan: <strong>{formatNum(m.totalArmadaVisits)} Unit-Hari</strong>
                                                        </span>
                                                        <span className="font-black text-indigo-800 text-sm">
                                                            {formatNum(m.totalRitasi)} Ritasi
                                                        </span>
                                                    </div>
                                                </div>

                                                <div
                                                    className="h-5 rounded-xl overflow-hidden flex bg-gray-100 shadow-2xs"
                                                    style={{ width: `${Math.max(25, widthPct)}%` }}
                                                >
                                                    <div
                                                        className="bg-blue-600 h-full transition-all"
                                                        style={{ width: `${vDtPct}%` }}
                                                        title={`Vendor DT: ${formatNum(m.vendorDtRitasiTotal)} Ritasi`}
                                                    />
                                                    <div
                                                        className="bg-purple-600 h-full transition-all"
                                                        style={{ width: `${vTrPct}%` }}
                                                        title={`Vendor Tronton: ${formatNum(m.vendorTrontonRitasiTotal)} Ritasi`}
                                                    />
                                                    <div
                                                        className="bg-amber-500 h-full transition-all"
                                                        style={{ width: `${dlhkPct}%` }}
                                                        title={`DLHK DT: ${formatNum(m.dlhkRitasiTotal)} Ritasi`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </GlassCard>

                            {/* Monthly Rekapitulasi Table (Januari - Juni 2026) */}
                            <GlassCard className="p-6 border border-gray-100" hover={false}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-gray-900">
                                            Tabel Rekapitulasi Armada yang Masuk di TPA 2 Muara Fajar (Januari – Juni 2026)
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Rekapitulasi berdasarkan 6 file Excel Master Daftar Armada Masuk TPA 2 Muara Fajar Kota Pekanbaru
                                        </p>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                                        Total 6 Bulan: {formatNum(TPA_ARMADA_MASUK_META.grandTotalArmadaVisits)} Unit-Hari • {formatNum(TPA_ARMADA_MASUK_META.grandTotalRitasi)} Ritasi
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                    <table className="w-full text-left text-sm text-gray-700">
                                        <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-3.5 py-3.5 text-center">No</th>
                                                <th className="px-4 py-3.5">Bulan</th>
                                                <th className="px-3 py-3.5 text-center">Sheet (Hari)</th>
                                                <th className="px-3 py-3.5 text-center">Armada/Hari</th>
                                                <th className="px-4 py-3.5 text-right">Kunjungan DLHK</th>
                                                <th className="px-4 py-3.5 text-right">Kunjungan VENDOR</th>
                                                <th className="px-3 py-3.5 text-right">EKSTERNAL</th>
                                                <th className="px-4 py-3.5 text-right bg-slate-800">Total Kunjungan</th>
                                                <th className="px-4 py-3.5 text-right">Ritasi Vendor DT</th>
                                                <th className="px-4 py-3.5 text-right">Ritasi Tronton</th>
                                                <th className="px-4 py-3.5 text-right">Ritasi DLHK</th>
                                                <th className="px-4 py-3.5 text-right bg-indigo-950">Total Ritasi</th>
                                                <th className="px-4 py-3.5 text-center print:hidden">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white font-mono text-xs sm:text-sm">
                                            {TPA_ARMADA_MASUK_MONTHS.map((m, idx) => (
                                                <tr key={m.monthCode} className="hover:bg-indigo-50/40 transition">
                                                    <td className="px-3.5 py-3 text-center font-bold text-gray-500">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3 font-sans">
                                                        <div className="font-extrabold text-gray-900">{m.monthLabel}</div>
                                                        <div className="text-[10px] font-mono text-gray-500">{m.sourceFileName}</div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                            {m.daysCount} hr
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-bold text-gray-800">
                                                        {m.uniqueVehiclesCount} unit
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-amber-700">
                                                        {formatNum(m.dlhkUnitsTotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                                                        {formatNum(m.vendorUnitsTotal)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-gray-400">
                                                        {formatNum(m.eksternalUnitsTotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-gray-900 bg-slate-50">
                                                        {formatNum(m.totalArmadaVisits)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                                                        {formatNum(m.vendorDtRitasiTotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-purple-700">
                                                        {formatNum(m.vendorTrontonRitasiTotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-amber-700">
                                                        {formatNum(m.dlhkRitasiTotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-indigo-900 bg-indigo-50/70">
                                                        {formatNum(m.totalRitasi)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-sans print:hidden">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenMonthDailySheet(m.monthCode, '1')}
                                                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                                                            >
                                                                Buka Sheet 1–{m.daysCount} →
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-900 text-white font-mono text-xs sm:text-sm font-extrabold">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-3.5 font-sans">
                                                    GRAND TOTAL (JANUARI – JUNI 2026)
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-cyan-300">
                                                    {TPA_ARMADA_MASUK_META.totalDays} hr
                                                </td>
                                                <td className="px-3 py-3.5 text-center">
                                                    {TPA_ARMADA_MASUK_META.uniqueVehiclesCount} unit
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-amber-300">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandDlhkUnits)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-blue-300">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandVendorUnits)}
                                                </td>
                                                <td className="px-3 py-3.5 text-right text-gray-400">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandEksternalUnits)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-cyan-300 bg-slate-800">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandTotalArmadaVisits)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-blue-300">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandVendorDtRitasi)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-purple-300">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandVendorTrontonRitasi)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-amber-300">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandDlhkRitasi)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-yellow-300 text-base bg-indigo-950">
                                                    {formatNum(TPA_ARMADA_MASUK_META.grandTotalRitasi)}
                                                </td>
                                                <td className="print:hidden" />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* SUB-TAB 2: LEMBAR HARIAN SECURITY TPA 2 (PER SHEET TANGGAL 1 S/D 31) */}
                    {armadaTab === 'lembar_harian' && (
                        <div className="space-y-5">
                            {/* Month & Daily Sheet Selector */}
                            <GlassCard className="print:hidden p-5 border border-gray-100 space-y-4" hover={false}>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        1. Pilih Berkas Bulan (Januari – Juni 2026):
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                        {TPA_ARMADA_MASUK_MONTHS.map((m) => {
                                            const active = m.monthCode === selectedArmadaMonthCode;
                                            return (
                                                <button
                                                    key={m.monthCode}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedArmadaMonthCode(m.monthCode);
                                                        setSelectedDaySheetName('1');
                                                        setArmadaScope('SINGLE_MONTH');
                                                    }}
                                                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                        active
                                                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                                                            : 'bg-gray-50 hover:bg-indigo-50 text-gray-800 border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-extrabold">{m.sheetMonthName}</span>
                                                        <span
                                                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                                active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                                            }`}
                                                        >
                                                            {m.daysCount} Sheet
                                                        </span>
                                                    </div>
                                                    <p
                                                        className={`text-xs font-mono font-bold mt-1 ${
                                                            active ? 'text-cyan-200' : 'text-indigo-700'
                                                        }`}
                                                    >
                                                        {formatNum(m.totalRitasi)} Ritasi
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            2. Pilih Sheet Tanggal pada File &ldquo;{selectedArmadaMonth.sourceFileName}&rdquo; (Sheet 1 s/d {selectedArmadaMonth.daysCount}):
                                        </p>
                                        <span className="text-xs font-mono font-bold text-indigo-700">
                                            Sheet Aktif: #{selectedDaySheet.sheetName} ({selectedDaySheet.hariTanggal})
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {selectedArmadaMonth.days.map((d) => {
                                            const active = d.sheetName === selectedDaySheet.sheetName;
                                            return (
                                                <button
                                                    key={d.sheetName}
                                                    type="button"
                                                    onClick={() => setSelectedDaySheetName(d.sheetName)}
                                                    className={`w-9 h-9 rounded-xl font-mono text-xs font-extrabold border transition cursor-pointer flex items-center justify-center ${
                                                        active
                                                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                                                            : 'bg-white hover:bg-indigo-50 text-gray-700 border-gray-200'
                                                    }`}
                                                    title={`Buka Sheet ${d.sheetName} — ${d.hariTanggal}`}
                                                >
                                                    {d.sheetName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Official Daily Form Header & Table (Exact Match to Excel Sheet) */}
                            <GlassCard className="p-6 border border-gray-200" hover={false}>
                                {/* Official Form Header Box */}
                                <div className="p-5 rounded-2xl bg-slate-900 text-white mb-5 border border-slate-700">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-mono text-xs font-black mb-1">
                                                FILE: {selectedArmadaMonth.sourceFileName} • SHEET &ldquo;{selectedDaySheet.sheetName}&rdquo;
                                            </div>
                                            <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase">
                                                DAFTAR ARMADA YANG MASUK DI TPA 2 MUARAFAJAR — KOTA PEKANBARU
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs font-mono text-slate-200">
                                                <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                                    NAMA PETUGAS : <strong className="text-cyan-300">{selectedDaySheet.namaPetugas}</strong>
                                                </div>
                                                <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                                    SIF KERJA : <strong className="text-amber-300">{selectedDaySheet.sifKerja}</strong>
                                                </div>
                                                <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                                    HARI/TANGGAL : <strong className="text-emerald-300">{selectedDaySheet.hariTanggal}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono">
                                            <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                                                <div className="text-[10px] text-slate-300 uppercase">Total Armada</div>
                                                <div className="text-xl font-black text-white">{selectedDaySheet.totalArmada} Unit</div>
                                            </div>
                                            <div className="px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-center">
                                                <div className="text-[10px] text-cyan-200 uppercase">Total Ritasi</div>
                                                <div className="text-xl font-black text-cyan-300">{selectedDaySheet.totalRitasi} Ritasi</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Search & Filters Bar */}
                                <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Cari No Pelat Mobil (mis. BM 8127 JU, FU, TP)..."
                                            value={plateSearch}
                                            onChange={(e) => setPlateSearch(e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 w-64"
                                        />

                                        <select
                                            value={pengirimFilter}
                                            onChange={(e) => setPengirimFilter(e.target.value as any)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="ALL">Semua Pengirim (85 Unit)</option>
                                            <option value="VENDOR">VENDOR (76 Unit)</option>
                                            <option value="DLHK">DLHK (9 Unit)</option>
                                            <option value="EKSTERNAL">EKSTERNAL (0 Unit)</option>
                                        </select>

                                        <select
                                            value={ketFilter}
                                            onChange={(e) => setKetFilter(e.target.value as any)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="ALL">Semua Jenis / KET (85 Unit)</option>
                                            <option value="DT">DT - Dump Truck (77 Unit)</option>
                                            <option value="TRONTON">TRONTON (8 Unit)</option>
                                        </select>

                                        {(plateSearch || pengirimFilter !== 'ALL' || ketFilter !== 'ALL') && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPlateSearch('');
                                                    setPengirimFilter('ALL');
                                                    setKetFilter('ALL');
                                                }}
                                                className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                                            >
                                                Reset Filter
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-xs font-mono font-bold text-gray-600">
                                        Menampilkan <strong>{filteredSummary.totalUnits}</strong> dari 85 Armada • Total Ritasi Terfilter: <strong>{filteredSummary.dailyRitasi} Ritasi</strong>
                                    </div>
                                </div>

                                {/* Exact 2-Row Header Official Excel Table */}
                                <div className="overflow-x-auto rounded-2xl border border-gray-300">
                                    <table className="w-full text-left text-xs sm:text-sm text-gray-800 border-collapse">
                                        <thead className="bg-slate-900 text-white uppercase font-extrabold text-xs">
                                            <tr>
                                                <th rowSpan={2} className="px-3.5 py-3 text-center border-r border-slate-700 w-14">
                                                    NO
                                                </th>
                                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-700">
                                                    NO PELAT MOBIL
                                                </th>
                                                <th colSpan={3} className="px-4 py-2 text-center border-b border-r border-slate-700 bg-slate-800">
                                                    NAMA PENGIRIM
                                                </th>
                                                <th rowSpan={2} className="px-4 py-3 text-center border-r border-slate-700">
                                                    KET
                                                </th>
                                                <th rowSpan={2} className="px-4 py-3 text-center bg-indigo-950">
                                                    RITASI
                                                </th>
                                            </tr>
                                            <tr className="bg-slate-800 text-[11px]">
                                                <th className="px-4 py-2 text-center border-r border-slate-700 text-amber-300">
                                                    DLHK
                                                </th>
                                                <th className="px-4 py-2 text-center border-r border-slate-700 text-cyan-300">
                                                    VENDOR
                                                </th>
                                                <th className="px-4 py-2 text-center border-r border-slate-700 text-slate-300">
                                                    EKSTERNAL
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white font-mono">
                                            {filteredVehicles.map((v) => (
                                                <tr
                                                    key={v.no}
                                                    className={`hover:bg-indigo-50/50 transition ${
                                                        v.pengirim === 'DLHK'
                                                            ? 'bg-amber-50/25'
                                                            : v.ket === 'TRONTON'
                                                                ? 'bg-purple-50/25'
                                                                : ''
                                                    }`}
                                                >
                                                    <td className="px-3.5 py-2.5 text-center font-bold text-gray-500 border-r border-gray-200">
                                                        {v.no}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-extrabold text-gray-900 border-r border-gray-200">
                                                        {v.plateNumber}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center border-r border-gray-200">
                                                        {v.dlhk ? (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-900 font-black">
                                                                1
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center border-r border-gray-200">
                                                        {v.vendor ? (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-900 font-black">
                                                                1
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center border-r border-gray-200">
                                                        {v.eksternal ? (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-900 font-black">
                                                                1
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center border-r border-gray-200">
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                                                v.ket === 'TRONTON'
                                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                                            }`}
                                                        >
                                                            {v.ket}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center font-black text-indigo-900 bg-indigo-50/40">
                                                        {v.ritasi}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-900 text-white font-mono text-xs sm:text-sm font-extrabold">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-3.5 font-sans">
                                                    TOTAL HARIAN ({selectedDaySheet.hariTanggal})
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-amber-300">
                                                    {filteredSummary.dlhkUnits} Unit
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-cyan-300">
                                                    {filteredSummary.vendorUnits} Unit
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-slate-400">
                                                    {filteredSummary.eksternalUnits} Unit
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-purple-200">
                                                    {filteredSummary.dtUnits} DT / {filteredSummary.trontonUnits} Tronton
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-yellow-300 text-base bg-indigo-950">
                                                    {filteredSummary.dailyRitasi} Ritasi
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* SUB-TAB 3: MASTER 85 ARMADA & AKUMULASI RITASI 6 BULAN */}
                    {armadaTab === 'master_armada' && (
                        <GlassCard className="p-6 border border-gray-100" hover={false}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">
                                        Master 85 Armada TPA 2 Muara Fajar &amp; Akumulasi Ritasi (Januari – Juni 2026)
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Rekapitulasi ritasi per unit nomor pelat mobil selama 181 hari operasional (Januari 31h, Februari 28h, Maret 31h, April 30h, Mei 31h, Juni 30h)
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Cari No Pelat Mobil..."
                                        value={plateSearch}
                                        onChange={(e) => setPlateSearch(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                                    />
                                    <select
                                        value={pengirimFilter}
                                        onChange={(e) => setPengirimFilter(e.target.value as any)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                                    >
                                        <option value="ALL">Semua Pengirim</option>
                                        <option value="VENDOR">VENDOR (76)</option>
                                        <option value="DLHK">DLHK (9)</option>
                                    </select>
                                    <select
                                        value={ketFilter}
                                        onChange={(e) => setKetFilter(e.target.value as any)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                                    >
                                        <option value="ALL">Semua Jenis (KET)</option>
                                        <option value="DT">DT (77)</option>
                                        <option value="TRONTON">TRONTON (8)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                <table className="w-full text-left text-xs sm:text-sm text-gray-700">
                                    <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
                                        <tr>
                                            <th className="px-3 py-3.5 text-center">No</th>
                                            <th className="px-4 py-3.5">No Pelat Mobil</th>
                                            <th className="px-3 py-3.5 text-center">Pengirim</th>
                                            <th className="px-3 py-3.5 text-center">Jenis (KET)</th>
                                            <th className="px-3 py-3.5 text-center">Rit/Hari</th>
                                            <th className="px-3 py-3.5 text-right">Jan (31h)</th>
                                            <th className="px-3 py-3.5 text-right">Feb (28h)</th>
                                            <th className="px-3 py-3.5 text-right">Mar (31h)</th>
                                            <th className="px-3 py-3.5 text-right">Apr (30h)</th>
                                            <th className="px-3 py-3.5 text-right">Mei (31h)</th>
                                            <th className="px-3 py-3.5 text-right">Jun (30h)</th>
                                            <th className="px-3 py-3.5 text-center">Total Hari</th>
                                            <th className="px-4 py-3.5 text-right bg-indigo-950">Total Ritasi (6 Bln)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white font-mono">
                                        {filteredVehicles.map((v) => (
                                            <tr key={v.no} className="hover:bg-indigo-50/40 transition">
                                                <td className="px-3 py-2.5 text-center font-bold text-gray-500">
                                                    {v.no}
                                                </td>
                                                <td className="px-4 py-2.5 font-extrabold text-gray-900">
                                                    {v.plateNumber}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                                                            v.pengirim === 'DLHK'
                                                                ? 'bg-amber-100 text-amber-900'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                    >
                                                        {v.pengirim}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                                                            v.ket === 'TRONTON'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {v.ket}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-bold text-indigo-700">
                                                    {v.ritasi}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">{v.ritasi * 31}</td>
                                                <td className="px-3 py-2.5 text-right">{v.ritasi * 28}</td>
                                                <td className="px-3 py-2.5 text-right">{v.ritasi * 31}</td>
                                                <td className="px-3 py-2.5 text-right">{v.ritasi * 30}</td>
                                                <td className="px-3 py-2.5 text-right">{v.ritasi * 31}</td>
                                                <td className="px-3 py-2.5 text-right">{v.ritasi * 30}</td>
                                                <td className="px-3 py-2.5 text-center font-semibold text-gray-600">
                                                    181 hr
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-black text-indigo-900 bg-indigo-50/50">
                                                    {formatNum(v.ritasi * 181)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white font-mono text-xs sm:text-sm font-extrabold">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-3.5 font-sans">
                                                TOTAL ({filteredSummary.totalUnits} UNIT ARMADA)
                                            </td>
                                            <td className="px-3 py-3.5 text-center text-cyan-300">
                                                {filteredSummary.dailyRitasi}/hr
                                            </td>
                                            <td className="px-3 py-3.5 text-right">{formatNum(filteredSummary.dailyRitasi * 31)}</td>
                                            <td className="px-3 py-3.5 text-right">{formatNum(filteredSummary.dailyRitasi * 28)}</td>
                                            <td className="px-3 py-3.5 text-right">{formatNum(filteredSummary.dailyRitasi * 31)}</td>
                                            <td className="px-3 py-3.5 text-right">{formatNum(filteredSummary.dailyRitasi * 30)}</td>
                                            <td className="px-3 py-3.5 text-right">{formatNum(filteredSummary.dailyRitasi * 31)}</td>
                                            <td className="px-3 py-3.5 text-right">{formatNum(filteredSummary.dailyRitasi * 30)}</td>
                                            <td className="px-3 py-3.5 text-center">181 hr</td>
                                            <td className="px-4 py-3.5 text-right text-yellow-300 text-base bg-indigo-950">
                                                {formatNum(filteredSummary.dailyRitasi * 181)} Ritasi
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </GlassCard>
                    )}

                    {/* SUB-TAB 4: ANALISIS PENGIRIM & JENIS ARMADA TPA 2 */}
                    {armadaTab === 'analisis_armada' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Group 1: VENDOR DUMP TRUCK (68 Unit) */}
                            <GlassCard className="p-6 border border-blue-200 bg-linear-to-b from-blue-50/40 to-white" hover={false}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white">
                                        KELOMPOK 1 • VENDOR DT
                                    </span>
                                    <span className="font-mono text-xs font-black text-blue-800">No. Urut 1 – 68</span>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900">
                                    68 Unit Dump Truck (DT) Vendor
                                </h3>
                                <p className="text-xs text-gray-600 mt-1 mb-4">
                                    Beroperasi <strong>2 Ritasi / Hari</strong> per armada (Total <strong>136 Ritasi/Hari</strong> atau <strong>80,5%</strong> dari seluruh ritasi TPA 2).
                                </p>
                                <div className="grid grid-cols-2 gap-2.5 mb-4 font-mono text-xs">
                                    <div className="p-3 rounded-xl bg-white border border-blue-100">
                                        <div className="text-[10px] text-gray-500">Kunjungan 6 Bulan</div>
                                        <div className="text-base font-black text-blue-800">12.308 Unit-Hari</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-blue-100">
                                        <div className="text-[10px] text-gray-500">Total Ritasi 6 Bulan</div>
                                        <div className="text-base font-black text-blue-800">24.616 Ritasi</div>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-gray-700 mb-2">Daftar 68 Nomor Pelat Mobil:</p>
                                <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                    {TPA_ARMADA_MASTER_VEHICLES.filter((v) => v.pengirim === 'VENDOR' && v.ket === 'DT').map((v) => (
                                        <span
                                            key={v.no}
                                            className="px-2 py-1 rounded-md bg-white border border-blue-200 font-mono text-[11px] font-bold text-gray-800"
                                        >
                                            #{v.no} {v.plateNumber}
                                        </span>
                                    ))}
                                </div>
                            </GlassCard>

                            {/* Group 2: VENDOR TRONTON (8 Unit) */}
                            <GlassCard className="p-6 border border-purple-200 bg-linear-to-b from-purple-50/40 to-white" hover={false}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-600 text-white">
                                        KELOMPOK 2 • VENDOR TRONTON
                                    </span>
                                    <span className="font-mono text-xs font-black text-purple-800">No. Urut 69 – 76</span>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900">
                                    8 Unit Tronton Vendor
                                </h3>
                                <p className="text-xs text-gray-600 mt-1 mb-4">
                                    Beroperasi <strong>3 Ritasi / Hari</strong> per armada (Total <strong>24 Ritasi/Hari</strong> atau <strong>14,2%</strong> dari seluruh ritasi TPA 2).
                                </p>
                                <div className="grid grid-cols-2 gap-2.5 mb-4 font-mono text-xs">
                                    <div className="p-3 rounded-xl bg-white border border-purple-100">
                                        <div className="text-[10px] text-gray-500">Kunjungan 6 Bulan</div>
                                        <div className="text-base font-black text-purple-800">1.448 Unit-Hari</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-purple-100">
                                        <div className="text-[10px] text-gray-500">Total Ritasi 6 Bulan</div>
                                        <div className="text-base font-black text-purple-800">4.344 Ritasi</div>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-gray-700 mb-2">Daftar 8 Nomor Pelat Mobil Tronton:</p>
                                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                    {TPA_ARMADA_MASTER_VEHICLES.filter((v) => v.ket === 'TRONTON').map((v) => (
                                        <span
                                            key={v.no}
                                            className="px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 font-mono text-xs font-extrabold text-purple-900"
                                        >
                                            #{v.no} {v.plateNumber} (3 Rit/hr)
                                        </span>
                                    ))}
                                </div>
                            </GlassCard>

                            {/* Group 3: DLHK DUMP TRUCK (9 Unit) */}
                            <GlassCard className="p-6 border border-amber-200 bg-linear-to-b from-amber-50/40 to-white" hover={false}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950">
                                        KELOMPOK 3 • DLHK DT
                                    </span>
                                    <span className="font-mono text-xs font-black text-amber-900">No. Urut 77 – 85</span>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900">
                                    9 Unit Dump Truck (DT) DLHK
                                </h3>
                                <p className="text-xs text-gray-600 mt-1 mb-4">
                                    Beroperasi <strong>1 Ritasi / Hari</strong> per armada (Total <strong>9 Ritasi/Hari</strong> atau <strong>5,3%</strong> dari seluruh ritasi TPA 2).
                                </p>
                                <div className="grid grid-cols-2 gap-2.5 mb-4 font-mono text-xs">
                                    <div className="p-3 rounded-xl bg-white border border-amber-100">
                                        <div className="text-[10px] text-gray-500">Kunjungan 6 Bulan</div>
                                        <div className="text-base font-black text-amber-800">1.629 Unit-Hari</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-amber-100">
                                        <div className="text-[10px] text-gray-500">Total Ritasi 6 Bulan</div>
                                        <div className="text-base font-black text-amber-800">1.629 Ritasi</div>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-gray-700 mb-2">Daftar 9 Nomor Pelat Mobil DLHK:</p>
                                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                    {TPA_ARMADA_MASTER_VEHICLES.filter((v) => v.pengirim === 'DLHK').map((v) => (
                                        <span
                                            key={v.no}
                                            className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 font-mono text-xs font-extrabold text-amber-950"
                                        >
                                            #{v.no} {v.plateNumber} (1 Rit/hr)
                                        </span>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>
            )}

            {/* =====================================================================
                DASHBOARD 2: REKAPITULASI TONASE PEMILAHAN SAMPAH DI TPA 2 (2026)
               ===================================================================== */}
            {dashboardMode === 'pemilahan' && (
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
                                    Monitoring harian &amp; bulanan hasil pemilahan sampah di TPA 2 Kota Pekanbaru meliputi{' '}
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
                                ♻️ Analisis Komposisi &amp; Kinerja Pemulung
                            </button>
                        </div>

                        <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                            📌 Keterangan: <strong>{TPA_PEMILAHAN_META.keterangan}</strong>
                        </div>
                    </div>

                    {/* TAB 1: RINGKASAN BULANAN */}
                    {activeTab === 'ringkasan' && (
                        <div className="space-y-6">
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
                                    Distribusi &amp; Peringkat Kategori Sampah Terpilah (2026)
                                </h2>
                                <p className="text-xs text-gray-500 mb-5">
                                    Akumulasi 330 hari kerja pemilahan sampah di TPA 2 Muara Fajar Kota Pekanbaru
                                </p>

                                <div className="space-y-4">
                                    {CATEGORIES.map((cat, idx) => {
                                        const totalCatKg =
                                            TPA_PEMILAHAN_META[
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
                                                Ton (
                                                {formatPct(
                                                    TPA_PEMILAHAN_META.grandKaraKaraKg +
                                                        TPA_PEMILAHAN_META.grandPlastikKg +
                                                        TPA_PEMILAHAN_META.grandKartonKertasKg +
                                                        TPA_PEMILAHAN_META.grandBanKg,
                                                    TPA_PEMILAHAN_META.grandTotalKg
                                                )}
                                                )
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
            )}
        </div>
    );
}
