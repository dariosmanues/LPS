'use client';

import { useState, useEffect } from 'react';
import { GlassCard, StatCard } from '@/components/ui';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

interface ReportData {
    kecamatan: string;
    totalBeratKg: number;
    totalTransaksi: number;
}

interface ArmadaReport {
    platNomor: string;
    driverName: string;
    totalBerat: number;
    totalTrips: number;
}

const COLORS = ['#7C3AED', '#F97316', '#14B8A6', '#EAB308', '#10b981', '#3b82f6', '#ef4444', '#EC4899'];

export default function ReportsPage() {
    const [kecamatanData, setKecamatanData] = useState<ReportData[]>([]);
    const [armadaData, setArmadaData] = useState<ArmadaReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('today');

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports?range=${dateRange}`);
            const data = await res.json();
            setKecamatanData(data.byKecamatan || []);
            setArmadaData(data.byArmada || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalBerat = kecamatanData.reduce((acc, d) => acc + d.totalBeratKg, 0);
    const totalTransaksi = kecamatanData.reduce((acc, d) => acc + d.totalTransaksi, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Laporan Real-time</h1>
                    <p className="text-gray-500 text-sm">Visualisasi data sampah per wilayah dan armada</p>
                </div>
                <div className="flex gap-2">
                    {['today', 'week', 'month'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${dateRange === range
                                ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {range === 'today' ? 'Hari Ini' : range === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Sampah"
                    value={`${totalBerat.toLocaleString()} kg`}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                    }
                    color="blue"
                />
                <StatCard
                    title="Total Transaksi"
                    value={totalTransaksi}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    }
                    color="purple"
                />
                <StatCard
                    title="Rata-rata per Trip"
                    value={`${totalTransaksi > 0 ? Math.round(totalBerat / totalTransaksi).toLocaleString() : 0} kg`}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                    }
                    color="green"
                />
            </div>

            {/* Charts */}
            {loading ? (
                <GlassCard hover={false}>
                    <p className="text-gray-500 text-center py-12">Memuat data...</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart - By Kecamatan */}
                    <GlassCard hover={false}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Sampah per Kecamatan (kg)</h2>
                        <div className="h-80">
                            {kecamatanData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={kecamatanData.slice(0, 8)}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis type="number" stroke="#9CA3AF" />
                                        <YAxis
                                            dataKey="kecamatan"
                                            type="category"
                                            stroke="#9CA3AF"
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Bar dataKey="totalBeratKg" fill="url(#colorGradient)" radius={[0, 4, 4, 0]} />
                                        <defs>
                                            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#7C3AED" />
                                                <stop offset="100%" stopColor="#9333EA" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    Belum ada data
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Pie Chart - Distribution */}
                    <GlassCard hover={false}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Distribusi per Kecamatan</h2>
                        <div className="h-80">
                            {kecamatanData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={kecamatanData.slice(0, 6)}
                                            dataKey="totalBeratKg"
                                            nameKey="kecamatan"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: '#9CA3AF' }}
                                        >
                                            {kecamatanData.slice(0, 6).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                            formatter={(value?: number) => [`${(value ?? 0).toLocaleString()} kg`, 'Total'] as [string, string]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    Belum ada data
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Armada Performance Table */}
            <GlassCard hover={false}>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Performa Armada</h2>
                {armadaData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Armada</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Driver</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total Trips</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total Berat (kg)</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Rata-rata (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {armadaData.map((armada, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-800">{armada.platNomor}</td>
                                        <td className="px-6 py-4 text-gray-600">{armada.driverName}</td>
                                        <td className="px-6 py-4 text-gray-600">{armada.totalTrips}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">{armada.totalBerat.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-600">{armada.totalTrips > 0 ? Math.round(armada.totalBerat / armada.totalTrips).toLocaleString() : 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-8">Belum ada data</p>
                )}
            </GlassCard>
        </div>
    );
}
