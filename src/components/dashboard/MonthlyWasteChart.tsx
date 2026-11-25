'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface TimelineBucket {
    key?: string;
    month: string;
    label?: string;
    fullLabel?: string;
    totalKg: number;
    totalTon?: number;
    airHitamKg?: number;
    harapanJayaKg?: number;
    tripCount?: number;
    airHitamTrips?: number;
    harapanJayaTrips?: number;
}

interface SummaryData {
    totalKg: number;
    totalTon: number;
    airHitamKg: number;
    harapanJayaKg: number;
    totalTrips: number;
    airHitamTrips?: number;
    harapanJayaTrips?: number;
}

interface MonthlyWasteChartProps {
    apiUrl?: string;
    title?: string;
    subtitle?: string;
}

function getWibYmd(offsetDays = 0): string {
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
    return now.toISOString().slice(0, 10);
}

export function MonthlyWasteChart({
    apiUrl = '/api/waste-stats/monthly',
    title = 'Grafik Tren & Timeline Total Tonase Sampah',
    subtitle = 'Analisis pergerakan volume tonase sampah berdasarkan waktu (Data resmi terhitung mulai 12 Okt 2026)',
}: MonthlyWasteChartProps) {
    const [data, setData] = useState<TimelineBucket[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [activeGranularity, setActiveGranularity] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
    const [loading, setLoading] = useState(true);

    // Timeline Setting State
    const [selectedRange, setSelectedRange] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [granularity, setGranularity] = useState<'auto' | 'hourly' | 'daily' | 'weekly' | 'monthly'>('auto');
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [unitMode, setUnitMode] = useState<'kg' | 'ton'>('kg');
    const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

    const isGlobalDashboard = !apiUrl.includes('/api/lps/');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            if (granularity !== 'auto') params.set('granularity', granularity);

            const sep = apiUrl.includes('?') ? '&' : '?';
            const qs = params.toString();
            const fullUrl = qs ? `${apiUrl}${sep}${qs}` : apiUrl;

            const res = await fetch(fullUrl, { cache: 'no-store' });
            const result = await res.json();
            if (result.success) {
                const list: TimelineBucket[] = Array.isArray(result.timeline)
                    ? result.timeline
                    : Array.isArray(result.data)
                      ? result.data
                      : [];
                setData(list);
                if (result.summary) setSummary(result.summary);
                if (result.granularity) setActiveGranularity(result.granularity);
            }
        } catch (error) {
            console.error('Error fetching waste timeline stats:', error);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, startDate, endDate, granularity]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRangeChange = (val: string) => {
        setSelectedRange(val);
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
        } else if (val === 'year_monthly') {
            setStartDate('');
            setEndDate('');
            setGranularity('monthly');
        } else {
            // 'all'
            setStartDate('');
            setEndDate('');
            setGranularity('auto');
        }
    };

    const handleCustomStartDate = (val: string) => {
        setStartDate(val);
        setSelectedRange('custom');
    };

    const handleCustomEndDate = (val: string) => {
        setEndDate(val);
        setSelectedRange('custom');
    };

    const toggleSeries = (key: string) => {
        setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const chartData = useMemo(() => {
        const div = unitMode === 'ton' ? 1000 : 1;
        return data.map((item) => {
            const totalVal = unitMode === 'ton' ? Number(((item.totalKg || 0) / div).toFixed(2)) : item.totalKg || 0;
            const ahVal = unitMode === 'ton' ? Number(((item.airHitamKg || 0) / div).toFixed(2)) : item.airHitamKg || 0;
            const hjVal =
                unitMode === 'ton' ? Number(((item.harapanJayaKg || 0) / div).toFixed(2)) : item.harapanJayaKg || 0;
            return {
                ...item,
                xLabel: item.label || item.month,
                displayTotal: totalVal,
                displayAirHitam: ahVal,
                displayHarapanJaya: hjVal,
            };
        });
    }, [data, unitMode]);

    const totalKgSum = useMemo(() => {
        if (summary && typeof summary.totalKg === 'number') return summary.totalKg;
        return data.reduce((acc, curr) => acc + (curr.totalKg || 0), 0);
    }, [summary, data]);

    const totalTripsSum = useMemo(() => {
        if (summary && typeof summary.totalTrips === 'number') return summary.totalTrips;
        return data.reduce((acc, curr) => acc + (curr.tripCount || 0), 0);
    }, [summary, data]);

    const highestBucket = useMemo(() => {
        return data.reduce(
            (max, curr) => ((curr.totalKg || 0) > (max.totalKg || 0) ? curr : max),
            { month: '-', label: '-', fullLabel: '-', totalKg: 0, tripCount: 0 } as TimelineBucket
        );
    }, [data]);

    const avgKgPerActiveBucket = useMemo(() => {
        const nonZero = data.filter((d) => (d.totalKg || 0) > 0);
        const denom = nonZero.length > 0 ? nonZero.length : data.length;
        return denom > 0 ? Math.round(totalKgSum / denom) : 0;
    }, [data, totalKgSum]);

    const seriesConfig = useMemo(() => {
        if (!isGlobalDashboard) {
            return [
                {
                    key: 'displayTotal',
                    name: unitMode === 'ton' ? 'Total Tonase (Ton)' : 'Total Berat (Kg)',
                    color: '#7c3aed',
                    strokeWidth: 3,
                },
            ];
        }
        return [
            {
                key: 'displayTotal',
                name: 'Total Tonase Gabungan',
                color: '#7c3aed',
                strokeWidth: 3,
            },
            {
                key: 'displayAirHitam',
                name: 'Transdepo Air Hitam',
                color: '#2563eb',
                strokeWidth: 2.3,
            },
            {
                key: 'displayHarapanJaya',
                name: 'Transdepo Harapan Jaya',
                color: '#059669',
                strokeWidth: 2.3,
            },
        ];
    }, [isGlobalDashboard, unitMode]);

    const formatYAxis = (value: number) => {
        if (unitMode === 'ton') {
            if (value >= 1000) return `${(value / 1000).toFixed(1)}k T`;
            return `${value} T`;
        }
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)} Jt`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k`;
        }
        return value.toString();
    };

    const granularityUnitLabel =
        activeGranularity === 'hourly'
            ? 'jam'
            : activeGranularity === 'weekly'
              ? 'minggu'
              : activeGranularity === 'monthly'
                ? 'bulan'
                : 'hari';

    const activePeriodBadgeText = useMemo(() => {
        if (startDate && endDate) {
            if (startDate === endDate) return `Tanggal ${startDate}`;
            return `${startDate} s/d ${endDate}`;
        }
        if (startDate) return `Sejak ${startDate}`;
        if (endDate) return `Sampai ${endDate}`;
        return 'Mulai 12 Okt 2026';
    }, [startDate, endDate]);

    return (
        <div className="space-y-4">
            {/* 3 Kartu KPI Ringkasan Tonase */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Sampah Terdata */}
                <div className="bg-linear-to-br from-purple-50 to-indigo-50/50 p-4 rounded-2xl border border-purple-100/80">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                            Total Sampah Terdata
                        </span>
                        <span className="text-purple-600">📦</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {totalKgSum.toLocaleString('id-ID')}{' '}
                        <span className="text-xs font-normal text-gray-500">Kg</span>
                    </div>
                    <p className="text-xs text-purple-700 mt-1">
                        ± {(totalKgSum / 1000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ton
                        {totalTripsSum > 0 ? ` • ${totalTripsSum.toLocaleString('id-ID')} ritasi` : ' (Tahun 2026)'}
                    </p>
                </div>

                {/* Volume Tertinggi */}
                <div className="bg-linear-to-br from-blue-50 to-sky-50/50 p-4 rounded-2xl border border-blue-100/80">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                            Volume Tertinggi
                        </span>
                        <span className="text-blue-600">📈</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 truncate" title={highestBucket.fullLabel || highestBucket.label}>
                        {highestBucket.totalKg > 0
                            ? `${highestBucket.label || highestBucket.month} (${highestBucket.totalKg.toLocaleString('id-ID')} kg)`
                            : '-'}
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                        {highestBucket.totalKg > 0
                            ? `± ${(highestBucket.totalKg / 1000).toFixed(2)} Ton${highestBucket.tripCount ? ` • ${highestBucket.tripCount} ritasi` : ''}`
                            : 'Belum ada data pada rentang ini'}
                    </p>
                </div>

                {/* Periode Data Aktif & Rata-rata */}
                <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-100/80">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                            Periode & Rata-rata
                        </span>
                        <span className="text-emerald-600">🛡️</span>
                    </div>
                    <div className="text-base font-bold text-gray-900 mt-0.5 truncate">
                        {activePeriodBadgeText}
                    </div>
                    <p className="text-xs text-emerald-700 mt-1">
                        Rata-rata: <strong>{avgKgPerActiveBucket.toLocaleString('id-ID')} kg</strong> / {granularityUnitLabel}
                    </p>
                </div>
            </div>

            {/* Panel Utama: Timeline Setting & Line Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                {/* Baris 1: Judul & Preset Rentang Waktu */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </span>
                            {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
                    </div>

                    {/* Quick Timeline Preset Pills */}
                    <div className="flex items-center gap-1 flex-wrap bg-gray-100/90 p-1 rounded-xl border border-gray-200/70">
                        {[
                            { id: 'all', label: 'Semua (Harian)' },
                            { id: 'year_monthly', label: 'Bulanan (Jan-Des)' },
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
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Baris 2: Pengaturan Tanggal Custom, Interval Granularity, Tipe Grafik & Satuan */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-gray-100 text-xs">
                    {/* Custom Date Range */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-600 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Timeline Tanggal:
                        </span>
                        <input
                            type="date"
                            value={startDate}
                            min="2026-10-12"
                            onChange={(e) => handleCustomStartDate(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 focus:bg-white"
                            title="Dari Tanggal"
                        />
                        <span className="text-gray-400">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            min="2026-10-12"
                            onChange={(e) => handleCustomEndDate(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 focus:bg-white"
                            title="Sampai Tanggal"
                        />
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                onClick={() => handleRangeChange('all')}
                                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Interval Granularity + Tipe Grafik + Satuan */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Interval Selector */}
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-600">Interval:</span>
                            <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/70">
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
                                                ? 'bg-white text-purple-700 shadow-xs'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Satuan Kg / Ton */}
                        <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/70">
                            <button
                                type="button"
                                onClick={() => setUnitMode('kg')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                    unitMode === 'kg'
                                        ? 'bg-white text-purple-700 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Kg
                            </button>
                            <button
                                type="button"
                                onClick={() => setUnitMode('ton')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                    unitMode === 'ton'
                                        ? 'bg-white text-purple-700 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Ton
                            </button>
                        </div>

                        {/* Tipe Chart: Line vs Bar */}
                        <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/70">
                            <button
                                type="button"
                                onClick={() => setChartType('line')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                    chartType === 'line'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                📈 Line Chart
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartType('bar')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                    chartType === 'bar'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                📊 Bar Chart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Baris 3: Legend Interaktif & Rincian Transdepo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {seriesConfig.map((s) => {
                            const isHidden = Boolean(hiddenSeries[s.key]);
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => toggleSeries(s.key)}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                        isHidden
                                            ? 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 line-through'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 shadow-2xs'
                                    }`}
                                    title="Klik untuk tampilkan / sembunyikan garis"
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

                    {isGlobalDashboard && summary && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                                Air Hitam: <strong>{summary.airHitamKg.toLocaleString('id-ID')} kg</strong>
                                {summary.airHitamTrips ? ` (${summary.airHitamTrips} rit)` : ''}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                                Harapan Jaya: <strong>{summary.harapanJayaKg.toLocaleString('id-ID')} kg</strong>
                                {summary.harapanJayaTrips ? ` (${summary.harapanJayaTrips} rit)` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Baris 4: Grafik Recharts (LineChart / BarChart) */}
                <div className="h-[340px] w-full pt-2">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 text-xs">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mb-2"></div>
                            <span>Memuat grafik timeline tonase sampah...</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-gray-100">
                            <p className="font-semibold text-gray-600">Tidak ada data tonase pada rentang waktu ini</p>
                            <p className="text-xs text-gray-400 mt-1">Pilih rentang tanggal lain atau klik &quot;Semua (Harian)&quot;</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'line' ? (
                                <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="xLabel"
                                        axisLine={{ stroke: '#E2E8F0' }}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        dy={8}
                                        minTickGap={16}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        tickFormatter={formatYAxis}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload || payload.length === 0) return null;
                                            const pt = payload[0]?.payload as TimelineBucket;
                                            const totKg = pt?.totalKg || 0;
                                            const ahKg = pt?.airHitamKg || 0;
                                            const hjKg = pt?.harapanJayaKg || 0;
                                            return (
                                                <div className="bg-white/95 backdrop-blur-md p-3.5 border border-gray-200 shadow-xl rounded-2xl text-xs min-w-[230px]">
                                                    <p className="font-bold text-gray-900 pb-2 mb-2 border-b border-gray-100">
                                                        {pt?.fullLabel || pt?.label || pt?.month}
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-gray-600 flex items-center gap-1.5">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                                                                Total Tonase
                                                            </span>
                                                            <span className="font-extrabold text-purple-700">
                                                                {totKg.toLocaleString('id-ID')} kg ({(totKg / 1000).toFixed(2)} T)
                                                            </span>
                                                        </div>
                                                        {isGlobalDashboard && (
                                                            <>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-gray-600 flex items-center gap-1.5">
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                                                        Pos Air Hitam
                                                                    </span>
                                                                    <span className="font-bold text-blue-700">
                                                                        {ahKg.toLocaleString('id-ID')} kg
                                                                        {pt?.airHitamTrips ? ` (${pt.airHitamTrips} rit)` : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-gray-600 flex items-center gap-1.5">
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                                                                        Pos Harapan Jaya
                                                                    </span>
                                                                    <span className="font-bold text-emerald-700">
                                                                        {hjKg.toLocaleString('id-ID')} kg
                                                                        {pt?.harapanJayaTrips ? ` (${pt.harapanJayaTrips} rit)` : ''}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {typeof pt?.tripCount === 'number' && (
                                                            <div className="pt-1.5 mt-1.5 border-t border-gray-100 flex items-center justify-between text-gray-500">
                                                                <span>Total Transaksi:</span>
                                                                <strong className="text-gray-800">{pt.tripCount} ritasi</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    {seriesConfig.map((s) =>
                                        hiddenSeries[s.key] ? null : (
                                            <Line
                                                key={s.key}
                                                type="monotone"
                                                dataKey={s.key}
                                                name={s.name}
                                                stroke={s.color}
                                                strokeWidth={s.strokeWidth}
                                                dot={{ r: 3.5, fill: s.color, strokeWidth: 0 }}
                                                activeDot={{ r: 6, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
                                            />
                                        )
                                    )}
                                </LineChart>
                            ) : (
                                <BarChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="xLabel"
                                        axisLine={{ stroke: '#E2E8F0' }}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        dy={8}
                                        minTickGap={16}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        tickFormatter={formatYAxis}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload || payload.length === 0) return null;
                                            const pt = payload[0]?.payload as TimelineBucket;
                                            const totKg = pt?.totalKg || 0;
                                            return (
                                                <div className="bg-white/95 backdrop-blur-md p-3.5 border border-gray-200 shadow-xl rounded-2xl text-xs">
                                                    <p className="font-bold text-gray-900 pb-1.5 mb-1.5 border-b border-gray-100">
                                                        {pt?.fullLabel || pt?.label || pt?.month}
                                                    </p>
                                                    <p className="font-extrabold text-purple-700">
                                                        {totKg.toLocaleString('id-ID')} kg ({(totKg / 1000).toFixed(2)} Ton)
                                                    </p>
                                                    {typeof pt?.tripCount === 'number' && (
                                                        <p className="text-gray-500 mt-1">{pt.tripCount} ritasi</p>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                    {seriesConfig.map((s) =>
                                        hiddenSeries[s.key] ? null : (
                                            <Bar
                                                key={s.key}
                                                dataKey={s.key}
                                                name={s.name}
                                                fill={s.color}
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={44}
                                            />
                                        )
                                    )}
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
