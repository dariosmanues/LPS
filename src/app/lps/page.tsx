'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { LpsDailyTransactionsReport } from '@/components/dashboard/LpsDailyTransactionsReport'
import { MonthlyWasteChart } from '@/components/dashboard/MonthlyWasteChart'

interface LaporanStats {
    totalLaporan: number;
    bulanIni: number;
    totalArmada: number;
    totalRumahTangga: number;
    totalUMKM: number;
    totalBadanUsaha: number;
    totalPenerimaanIuran: number;
}

interface KelurahanInfo {
    id: string;
    nama: string;
    kecamatan: string;
}

interface ArmadaStats {
    id: string;
    platNomor: string;
    namaSupir: string;
    jenisArmada: string;
    wilayahKerja?: string;
    noIzinOperasi?: string;
    lokasiTransdepo?: string;
    totalBerat: number;
}

export default function LpsDashboardPage() {
    const [stats, setStats] = useState<LaporanStats>({
        totalLaporan: 0,
        bulanIni: 0,
        totalArmada: 0,
        totalRumahTangga: 0,
        totalUMKM: 0,
        totalBadanUsaha: 0,
        totalPenerimaanIuran: 0
    })

    const [kelurahan, setKelurahan] = useState<KelurahanInfo | null>(null)
    const [armadaStats, setArmadaStats] = useState<ArmadaStats[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily')

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/lps/dashboard')
            const data = await response.json()

            if (data.success) {
                setStats(data.stats)
                setArmadaStats(data.armadaStats || [])
                setKelurahan(data.kelurahan)
            } else {
                setError(data.error || 'Gagal memuat data')
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            setError('Gagal memuat data dashboard')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <svg className="w-16 h-16 mx-auto text-amber-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Terjadi Kendala</h3>
                    <p className="text-gray-600 text-sm mb-6">{error}</p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                        >
                            Login Ulang
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Dashboard LPS
                    </h1>
                    {kelurahan && (
                        <p className="text-gray-600 mt-1">
                            Kelurahan {kelurahan.nama}, Kecamatan {kelurahan.kecamatan}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Armada Aktif</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalArmada}</p>
                            <p className="text-xs text-gray-500 mt-1">Unit kendaraan</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Armada Aktif</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalArmada}</p>
                            <p className="text-xs text-gray-500 mt-1">Unit kendaraan</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Rumah Tangga</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalRumahTangga}</p>
                            <p className="text-xs text-gray-500 mt-1">Terlayani</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Penerimaan Iuran</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalPenerimaanIuran)}</p>
                            <p className="text-xs text-gray-500 mt-1">Total keseluruhan</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analisis Sampah: Tab Switcher (Harian vs Tren Bulanan) */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-xl w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('daily')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'daily'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                        >
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Harian (Bulan Berjalan)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('monthly')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'monthly'
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                        >
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Tren Bulanan (Tahunan)</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/70 rounded-xl text-xs text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Data resmi terhitung mulai <strong>12 Oktober 2026</strong></span>
                    </div>
                </div>

                {/* Konten Tab */}
                {activeTab === 'daily' ? (
                    <LpsDailyTransactionsReport />
                ) : (
                    <MonthlyWasteChart
                        apiUrl="/api/lps/waste-stats/monthly"
                        title="Tren Sampah Bulanan Kelurahan"
                        subtitle="Grafik perbandingan volume sampah per bulan tahun ini (Data resmi terhitung mulai 12 Okt 2026)"
                    />
                )}
            </div>

            {/* Armada Stats Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 00-1 1v1a1 1 0 001 1h1m-1-1a1 1 0 011 1v1a1 1 0 01-1 1h-1" />
                    </svg>
                    Laporan Total Sampah per Armada
                </h3>

                {armadaStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Belum ada data armada yang tercatat.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plat Nomor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Izin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah Kerja / Rute</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sampah (Kg)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {armadaStats.map((armada) => (
                                    <tr key={armada.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{armada.platNomor}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                                {armada.jenisArmada}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{armada.noIzinOperasi || '-'}</td>
                                        <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate" title={armada.wilayahKerja}>
                                            {armada.wilayahKerja || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                            {armada.totalBerat.toLocaleString('id-ID')} Kg
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

