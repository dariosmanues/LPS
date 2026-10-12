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

interface MonthlyData {
    month: string;
    totalKg: number;
}

interface MonthlyWasteChartProps {
    apiUrl?: string;
    title?: string;
    subtitle?: string;
}

export function MonthlyWasteChart({
    apiUrl = '/api/waste-stats/monthly',
    title = 'Tren Sampah Bulanan (Januari - Desember)',
    subtitle = 'Total volume sampah per bulan tahun ini (Data resmi terhitung mulai 12 Okt 2026)'
}: MonthlyWasteChartProps) {
    const [data, setData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(apiUrl);
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error('Error fetching monthly stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl]);

    const totalAnnualKg = data.reduce((acc, curr) => acc + (curr.totalKg || 0), 0);
    const highestMonth = data.reduce((max, curr) => (curr.totalKg > max.totalKg ? curr : max), { month: '-', totalKg: 0 });

    const formatYAxis = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`;
        }
        return value.toString();
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
                    <p className="font-semibold text-gray-800 mb-1">{label}</p>
                    <p className="text-sm text-purple-600 font-medium">
                        {payload[0].value.toLocaleString('id-ID')} kg
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* KPI Cards for Monthly Trend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-linear-to-br from-purple-50 to-indigo-50/50 p-4 rounded-2xl border border-purple-100/80">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Total Sampah Terdata</span>
                        <span className="text-purple-600">📦</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {totalAnnualKg.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-500">Kg</span>
                    </div>
                    <p className="text-xs text-purple-700 mt-1">
                        ± {(totalAnnualKg / 1000).toFixed(2)} Ton (Tahun 2026)
                    </p>
                </div>

                <div className="bg-linear-to-br from-blue-50 to-sky-50/50 p-4 rounded-2xl border border-blue-100/80">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Volume Tertinggi</span>
                        <span className="text-blue-600">📈</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {highestMonth.totalKg > 0 ? `${highestMonth.month} (${highestMonth.totalKg.toLocaleString('id-ID')} kg)` : '-'}
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                        {highestMonth.totalKg > 0 ? `Bulan dengan ritasi timbang terbanyak` : 'Belum ada data'}
                    </p>
                </div>

                <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-100/80">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Periode Data Aktif</span>
                        <span className="text-emerald-600">🛡️</span>
                    </div>
                    <div className="text-base font-bold text-gray-900 mt-0.5">
                        Mulai 12 Okt 2026
                    </div>
                    <p className="text-xs text-emerald-700 mt-1">
                        Data uji coba pra-12 Okt diabaikan
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                        <span className="text-sm text-gray-600 font-medium">Total Berat (Kg)</span>
                    </div>
                </div>

            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                        <Bar
                            dataKey="totalKg"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill="url(#colorGradient)"
                                />
                            ))}
                        </Bar>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
    );
}
