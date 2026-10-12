'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface DailyItem {
    dateStr: string;
    label: string;
    day: number;
    totalKg: number;
    tripCount: number;
}

interface TransactionItem {
    id: string;
    ticketNumber: string;
    plateNumber: string;
    driverName: string;
    jenisArmada: string;
    beratKg: number;
    grossKg: number | null;
    tareKg: number | null;
    recordedAt: string;
    timeFormatted: string;
    dateFormatted: string;
    dateStr: string;
    status: string;
}

interface DailyStatsResponse {
    success: boolean;
    monthLabel: string;
    stats: {
        totalKg: number;
        totalRitasi: number;
        averageKg: number;
    };
    dailyData: DailyItem[];
    transactions: TransactionItem[];
}

export function LpsDailyTransactionsReport() {
    const [data, setData] = useState<DailyStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>('ALL');

    useEffect(() => {
        fetchDailyData();
    }, []);

    const fetchDailyData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/lps/waste-stats/daily');
            const result = await res.json();
            if (result.success) {
                setData(result);
            }
        } catch (error) {
            console.error('Error fetching LPS daily transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatYAxis = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`;
        }
        return value.toString();
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload as DailyItem;
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                    <p className="font-semibold text-gray-800 text-sm mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-purple-600">
                        {item.totalKg.toLocaleString('id-ID')} kg
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {item.tripCount} transaksi penimbangan
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-[360px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-3 font-medium">Memuat data harian per transaksi...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const filteredTransactions = data.transactions.filter(t => {
        const matchSearch =
            t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
            t.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
            t.driverName.toLowerCase().includes(search.toLowerCase());
        const matchDate = selectedDate === 'ALL' || t.dateStr === selectedDate;
        return matchSearch && matchDate;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header & KPI Summary */}
            <div className="p-6 border-b border-gray-100 bg-linear-to-r from-gray-50/70 via-white to-purple-50/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
                            <h3 className="text-lg font-bold text-gray-800">
                                Laporan Harian & Transaksi Sampah
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Data penimbangan harian per ritasi pada {data.monthLabel} (Mulai 12 Oktober 2026)
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
                            <span className="text-xs block text-purple-600/80">Total Tonase</span>
                            <strong className="text-sm font-bold">{data.stats.totalKg.toLocaleString('id-ID')} kg</strong>
                        </div>
                        <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                            <span className="text-xs block text-blue-600/80">Jumlah Ritasi</span>
                            <strong className="text-sm font-bold">{data.stats.totalRitasi} ritasi</strong>
                        </div>
                        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                            <span className="text-xs block text-emerald-600/80">Rata-rata / Ritasi</span>
                            <strong className="text-sm font-bold">{data.stats.averageKg.toLocaleString('id-ID')} kg</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Bar Chart */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Grafik Tonase Harian ({data.monthLabel})
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-3 h-3 bg-purple-600 rounded-sm"></span>
                        <span>Berat Bersih (Kg)</span>
                    </div>
                </div>

                {data.dailyData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
                        Belum ada data penimbangan harian pada bulan berjalan.
                    </div>
                ) : (
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                                    dy={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                    tickFormatter={formatYAxis}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                                <Bar
                                    dataKey="totalKg"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                >
                                    {data.dailyData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill="url(#dailyPurpleGradient)"
                                            className="transition-all hover:opacity-80"
                                        />
                                    ))}
                                </Bar>
                                <defs>
                                    <linearGradient id="dailyPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.85} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Filter and Transactions Table */}
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h4 className="text-sm font-bold text-gray-800">
                            Rincian Transaksi Timbangan
                        </h4>
                        <p className="text-xs text-gray-500">
                            Menampilkan {filteredTransactions.length} dari {data.transactions.length} transaksi pada bulan berjalan
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Tanggal */}
                        {data.dailyData.length > 1 && (
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                            >
                                <option value="ALL">Semua Tanggal</option>
                                {data.dailyData.map(d => (
                                    <option key={d.dateStr} value={d.dateStr}>
                                        {d.label} ({d.tripCount} ritasi)
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari tiket, plat, supir..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-44 sm:w-56"
                            />
                            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                        Tidak ada transaksi yang sesuai dengan filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-gray-50/80">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Waktu Timbang
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        No. Tiket
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        No. Polisi
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Pengemudi
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Jenis Armada
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Berat Bersih (Netto)
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                                            <span className="font-medium text-gray-800">{trx.timeFormatted}</span>
                                            <span className="block text-[11px] text-gray-400">{trx.dateFormatted}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                                {trx.ticketNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900">
                                            {trx.plateNumber}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                            {trx.driverName}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium border border-blue-100">
                                                {trx.jenisArmada}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-right font-bold text-emerald-600">
                                            {trx.beratKg.toLocaleString('id-ID')} kg
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-center">
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold">
                                                {trx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
