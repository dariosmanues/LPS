'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface LaporanDetail {
    id: string;
    bulan: string;
    kelurahan: string;
    latarBelakang?: string;
    tujuan?: string;
    manfaat?: string;
    strukturLPS?: string;
    layanan?: string;
    perkembanganLPS?: string;
    laporanKeuangan?: string;
    createdAt: string;
    updatedAt: string;
    kinerjaAngkutan?: {
        jumlahArmada?: number;
        jumlahRumahTangga?: string;
        jumlahUMKM?: number;
        jumlahBadanUsaha?: number;
        permasalahan?: string;
        aksiYangDilakukan?: string;
    };
    kinerjaPengolahan?: {
        programPengolahan?: string;
        volumePemilahanOrganik?: number;
        volumePemilahanUnorganik?: number;
        volumePenjualanOrganik?: number;
        volumePenjualanUnorganik?: number;
        rincianAnorganik?: string | Record<string, number>;
        programEdukasi?: string;
        permasalahan?: string;
        aksiYangDilakukan?: string;
    };
    kinerjaIuran?: {
        penerimaanIuran?: number;
        pemanfaatanIuran?: string;
        permasalahan?: string;
        aksiYangDilakukan?: string;
    };
}

export default function DetailLaporan() {
    const params = useParams()
    const router = useRouter()
    const [laporan, setLaporan] = useState<LaporanDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('pendahuluan')

    useEffect(() => {
        if (params.id) {
            fetchLaporanDetail(params.id as string)
        }
    }, [params.id])

    const fetchLaporanDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/laporan-lps/${id}`)
            const result = await response.json()

            if (result.success) {
                setLaporan(result.data)
            } else {
                alert('Error: ' + result.error)
                router.push('/dashboard/laporan-lps')
            }
        } catch (error) {
            console.error('Fetch error:', error)
            alert('Terjadi kesalahan saat mengambil data laporan')
            router.push('/dashboard/laporan-lps')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
            return
        }

        try {
            const response = await fetch(`/api/laporan-lps/${params.id}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                alert('Laporan berhasil dihapus')
                router.push('/dashboard/laporan-lps')
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert('Terjadi kesalahan saat menghapus laporan')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount)
    }

    const formatBulan = (bulan: string) => {
        const date = new Date(bulan + '-01')
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long'
        })
    }

    const parseRumahTangga = (rumahTanggaStr?: string) => {
        if (!rumahTanggaStr) return {}
        try {
            return JSON.parse(rumahTanggaStr)
        } catch {
            return {}
        }
    }

    const tabs = [
        { id: 'pendahuluan', label: 'Pendahuluan', icon: '📄' },
        { id: 'angkutan', label: 'Angkutan', icon: '🚛' },
        { id: 'pengolahan', label: 'Pengolahan', icon: '♻️' },
        { id: 'iuran', label: 'Iuran', icon: '💰' }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data laporan...</p>
                </div>
            </div>
        )
    }

    if (!laporan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-4">Laporan tidak ditemukan</p>
                <Link
                    href="/dashboard/laporan-lps"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Kembali ke Dashboard
                </Link>
            </div>
        )
    }

    const rumahTanggaData = parseRumahTangga(laporan.kinerjaAngkutan?.jumlahRumahTangga)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/laporan-lps"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Detail Laporan Bulanan</h1>
                        <p className="text-gray-600">{formatBulan(laporan.bulan)} - {laporan.kelurahan}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.open(`/api/laporan-lps/${laporan.id}/export`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export PDF
                    </button>
                    <Link
                        href={`/dashboard/laporan-lps/${laporan.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Armada</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{laporan.kinerjaAngkutan?.jumlahArmada || 0}</p>
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
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {Object.values(rumahTanggaData).reduce((sum: number, val: unknown) => sum + (typeof val === 'number' ? val : 0), 0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Terlayani</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">UMKM & Badan Usaha</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {(laporan.kinerjaAngkutan?.jumlahUMKM || 0) + (laporan.kinerjaAngkutan?.jumlahBadanUsaha || 0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Total terlayani</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Penerimaan Iuran</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(laporan.kinerjaIuran?.penerimaanIuran || 0)}</p>
                            <p className="text-xs text-gray-500 mt-1">Bulanan</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[120px] px-4 py-4 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* Tab Pendahuluan */}
                    {activeTab === 'pendahuluan' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    📄 Bagian 1: Pendahuluan
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Latar Belakang</h4>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {laporan.latarBelakang || 'Belum diisi'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Tujuan</h4>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {laporan.tujuan || 'Belum diisi'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Manfaat</h4>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {laporan.manfaat || 'Belum diisi'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    🏢 Bagian 2: Gambaran Umum LPS
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Struktur LPS</h4>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {laporan.strukturLPS || 'Belum diisi'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Layanan</h4>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {laporan.layanan || 'Belum diisi'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Perkembangan LPS</h4>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {laporan.perkembanganLPS || 'Belum diisi'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Laporan Keuangan</h4>
                                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {laporan.laporanKeuangan || 'Belum diisi'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Angkutan */}
                    {activeTab === 'angkutan' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-xl">
                                    <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    <p className="text-2xl font-bold text-blue-600">{laporan.kinerjaAngkutan?.jumlahArmada || 0}</p>
                                    <p className="text-sm text-gray-600">Armada Dioperasikan</p>
                                </div>

                                <div className="text-center p-4 bg-green-50 rounded-xl">
                                    <svg className="w-8 h-8 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-2xl font-bold text-green-600">{laporan.kinerjaAngkutan?.jumlahUMKM || 0}</p>
                                    <p className="text-sm text-gray-600">UMKM Terlayani</p>
                                </div>

                                <div className="text-center p-4 bg-purple-50 rounded-xl">
                                    <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <p className="text-2xl font-bold text-purple-600">{laporan.kinerjaAngkutan?.jumlahBadanUsaha || 0}</p>
                                    <p className="text-sm text-gray-600">Badan Usaha Terlayani</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    🏠 Jumlah Rumah Tangga per RT/RW
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(rumahTanggaData).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{key}</span>
                                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">{value as number} rumah tangga</span>
                                        </div>
                                    ))}
                                    {Object.keys(rumahTanggaData).length === 0 && (
                                        <p className="text-gray-500 col-span-full">Belum ada data rumah tangga</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Permasalahan yang Dihadapi</h4>
                                <p className="text-gray-600 bg-red-50 p-4 rounded-lg whitespace-pre-wrap border border-red-100">
                                    {laporan.kinerjaAngkutan?.permasalahan || 'Tidak ada permasalahan dilaporkan'}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Aksi yang Telah Dilakukan</h4>
                                <p className="text-gray-600 bg-green-50 p-4 rounded-lg whitespace-pre-wrap border border-green-100">
                                    {laporan.kinerjaAngkutan?.aksiYangDilakukan || 'Belum ada aksi yang dilaporkan'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tab Pengolahan */}
                    {activeTab === 'pengolahan' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Program Pengolahan Sampah</h4>
                                <p className="text-gray-600 bg-blue-50 p-4 rounded-lg whitespace-pre-wrap border border-blue-100">
                                    {laporan.kinerjaPengolahan?.programPengolahan || 'Belum ada program pengolahan'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-3">Volume Pemilahan Sampah</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span>Sampah Organik</span>
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                                {laporan.kinerjaPengolahan?.volumePemilahanOrganik || 0} kg
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                            <span>Sampah Anorganik</span>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                                                {laporan.kinerjaPengolahan?.volumePemilahanUnorganik || 0} kg
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700 mb-3">Volume Penjualan Sampah</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span>Sampah Organik</span>
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                                {laporan.kinerjaPengolahan?.volumePenjualanOrganik || 0} kg
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                            <span>Sampah Anorganik</span>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                                                {laporan.kinerjaPengolahan?.volumePenjualanUnorganik || 0} kg
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-3">Rincian Volume Pemilahan Spesifik</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(() => {
                                        const rawRincian = laporan.kinerjaPengolahan?.rincianAnorganik;
                                        let rincianObj: Record<string, number> = {};
                                        try {
                                            if (typeof rawRincian === 'string') {
                                                rincianObj = JSON.parse(rawRincian);
                                            } else if (typeof rawRincian === 'object' && rawRincian !== null) {
                                                rincianObj = rawRincian;
                                            }
                                        } catch (e) {
                                            console.error("Failed to parse rincianAnorganik", e);
                                        }

                                        const entries = Object.entries(rincianObj).filter(([_, val]) => val > 0);
                                        
                                        if (entries.length === 0) {
                                            return <p className="text-gray-500 col-span-full">Belum ada rincian pemilahan</p>;
                                        }

                                        return entries.map(([key, value]) => {
                                            const formattedKey = key.replace('_', ' - ').replace(/([A-Z])/g, ' $1').trim();
                                            return (
                                                <div key={key} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center">
                                                    <p className="text-sm text-gray-600 mb-1 capitalize">{formattedKey}</p>
                                                    <p className="font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full text-sm">{value} kg</p>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Program Edukasi</h4>
                                <p className="text-gray-600 bg-purple-50 p-4 rounded-lg whitespace-pre-wrap border border-purple-100">
                                    {laporan.kinerjaPengolahan?.programEdukasi || 'Belum ada program edukasi'}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Permasalahan yang Dihadapi</h4>
                                <p className="text-gray-600 bg-red-50 p-4 rounded-lg whitespace-pre-wrap border border-red-100">
                                    {laporan.kinerjaPengolahan?.permasalahan || 'Tidak ada permasalahan dilaporkan'}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Aksi yang Telah Dilakukan</h4>
                                <p className="text-gray-600 bg-green-50 p-4 rounded-lg whitespace-pre-wrap border border-green-100">
                                    {laporan.kinerjaPengolahan?.aksiYangDilakukan || 'Belum ada aksi yang dilaporkan'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tab Iuran */}
                    {activeTab === 'iuran' && (
                        <div className="space-y-6">
                            <div className="text-center p-6 bg-green-50 rounded-xl">
                                <svg className="w-12 h-12 mx-auto mb-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-3xl font-bold text-green-600 mb-2">
                                    {formatCurrency(laporan.kinerjaIuran?.penerimaanIuran || 0)}
                                </p>
                                <p className="text-gray-600">Penerimaan Iuran Bulanan</p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Pemanfaatan Iuran</h4>
                                <p className="text-gray-600 bg-blue-50 p-4 rounded-lg whitespace-pre-wrap border border-blue-100">
                                    {laporan.kinerjaIuran?.pemanfaatanIuran || 'Belum ada pemanfaatan iuran dilaporkan'}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Permasalahan yang Dihadapi</h4>
                                <p className="text-gray-600 bg-red-50 p-4 rounded-lg whitespace-pre-wrap border border-red-100">
                                    {laporan.kinerjaIuran?.permasalahan || 'Tidak ada permasalahan dilaporkan'}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Aksi yang Telah Dilakukan</h4>
                                <p className="text-gray-600 bg-green-50 p-4 rounded-lg whitespace-pre-wrap border border-green-100">
                                    {laporan.kinerjaIuran?.aksiYangDilakukan || 'Belum ada aksi yang dilaporkan'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between text-sm text-gray-500">
                    <span>Dibuat: {new Date(laporan.createdAt).toLocaleString('id-ID')}</span>
                    <span>Diubah: {new Date(laporan.updatedAt).toLocaleString('id-ID')}</span>
                </div>
            </div>
        </div>
    )
}
