'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LaporanBulanan {
    id: string;
    bulan: string;
    kelurahan: string;
    createdAt: string;
    kinerjaAngkutan?: {
        jumlahArmada: number;
        jumlahUMKM: number;
        jumlahBadanUsaha: number;
    };
    kinerjaIuran?: {
        penerimaanIuran: number;
    };
}

interface KelurahanInfo {
    id: string;
    nama: string;
    kecamatan: string;
}

export default function LpsLaporanPage() {
    const [laporan, setLaporan] = useState<LaporanBulanan[]>([])
    const [kelurahan, setKelurahan] = useState<KelurahanInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch('/api/lps/dashboard')
            const data = await response.json()
            if (data.success) {
                setLaporan(data.laporan)
                setKelurahan(data.kelurahan)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatBulan = (bulan: string) => {
        const date = new Date(bulan + '-01')
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long'
        })
    }

    const filteredLaporan = laporan.filter(item =>
        formatBulan(item.bulan).toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Daftar Laporan Bulanan</h1>
                    {kelurahan && (
                        <p className="text-gray-600 mt-1">LPS Kelurahan {kelurahan.nama}</p>
                    )}
                </div>
                <Link
                    href="/lps/laporan/baru"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Laporan Baru
                </Link>
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Semua Laporan</h3>
                            <p className="text-sm text-gray-500">{laporan.length} laporan ditemukan</p>
                        </div>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari laporan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {filteredLaporan.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 mb-4">Belum ada laporan</p>
                        <Link
                            href="/lps/laporan/baru"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Laporan Pertama
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLaporan.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-800">{formatBulan(item.bulan)}</h4>
                                        <div className="flex gap-4 mt-1">
                                            <p className="text-sm text-gray-500">
                                                Dibuat: {new Date(item.createdAt).toLocaleDateString('id-ID')}
                                            </p>
                                            {item.kinerjaAngkutan && (
                                                <p className="text-sm text-gray-500">
                                                    Armada: {item.kinerjaAngkutan.jumlahArmada}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.open(`/api/laporan-lps/${item.id}/export`, '_blank')}
                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Export PDF"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <Link
                                        href={`/lps/laporan/${item.id}`}
                                        className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    >
                                        Detail
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
