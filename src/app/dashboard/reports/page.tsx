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
    const [waNumber, setWaNumber] = useState('');
    const [showWaPanel, setShowWaPanel] = useState(false);
    const [waSent, setWaSent] = useState(false);

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

    const getRangeLabel = () => {
        if (dateRange === 'today') return 'Hari Ini';
        if (dateRange === 'week') return 'Minggu Ini';
        return 'Bulan Ini';
    };

    const sendToWhatsApp = () => {
        const phone = waNumber.replace(/\D/g, '');
        if (!phone) return;

        const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let message = `📊 *LAPORAN SAMPAH LPS*\n`;
        message += `📅 Periode: ${getRangeLabel()} (${now})\n`;
        message += `━━━━━━━━━━━━━━━━━━\n\n`;

        message += `📈 *RINGKASAN*\n`;
        message += `• Total Sampah: *${totalBerat.toLocaleString()} kg*\n`;
        message += `• Total Transaksi: *${totalTransaksi}*\n`;
        message += `• Rata-rata/Trip: *${totalTransaksi > 0 ? Math.round(totalBerat / totalTransaksi).toLocaleString() : 0} kg*\n\n`;

        if (kecamatanData.length > 0) {
            message += `🏘️ *PER KECAMATAN*\n`;
            kecamatanData.slice(0, 8).forEach((k, i) => {
                message += `${i + 1}. ${k.kecamatan}: ${k.totalBeratKg.toLocaleString()} kg (${k.totalTransaksi} trip)\n`;
            });
            message += `\n`;
        }

        if (armadaData.length > 0) {
            message += `🚛 *PERFORMA ARMADA*\n`;
            armadaData.slice(0, 5).forEach((a, i) => {
                message += `${i + 1}. ${a.platNomor} (${a.driverName}): ${a.totalBerat.toLocaleString()} kg - ${a.totalTrips} trip\n`;
            });
            message += `\n`;
        }

        message += `━━━━━━━━━━━━━━━━━━\n`;
        message += `_Dikirim dari Sistem LPS_`;

        const formatted = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
        const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setWaSent(true);
        setTimeout(() => setWaSent(false), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Laporan Real-time</h1>
                    <p className="text-gray-500 text-sm">Visualisasi data sampah per wilayah dan armada</p>
                </div>
                <div className="flex gap-2 flex-wrap">
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
                    <button
                        onClick={() => setShowWaPanel(!showWaPanel)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                            showWaPanel
                                ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                : 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-100'
                        }`}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Kirim ke WhatsApp
                    </button>
                </div>
            </div>

            {/* WhatsApp Send Panel */}
            {showWaPanel && (
                <div className="bg-white rounded-2xl border border-green-200 shadow-lg shadow-green-50 p-6 animate-in">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">Kirim Laporan via WhatsApp</h3>
                            <p className="text-sm text-gray-500 mb-4">Ringkasan laporan {getRangeLabel().toLowerCase()} akan dikirim sebagai pesan WhatsApp</p>
                            <div className="flex gap-3 flex-wrap">
                                <div className="relative flex-1 min-w-[200px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+62</span>
                                    <input
                                        type="tel"
                                        value={waNumber}
                                        onChange={(e) => setWaNumber(e.target.value)}
                                        placeholder="8123456789"
                                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <button
                                    onClick={sendToWhatsApp}
                                    disabled={!waNumber.replace(/\D/g, '') || loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Kirim
                                </button>
                            </div>
                            {waSent && (
                                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    WhatsApp terbuka! Kirim pesan dari sana.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
