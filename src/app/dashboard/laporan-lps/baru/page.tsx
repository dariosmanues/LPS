'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RumahTanggaData {
    [key: string]: number
}

export default function FormLaporanBaru() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('pendahuluan')

    // Form state
    const [formData, setFormData] = useState({
        // Data Utama
        bulan: '',
        kelurahan: '',
        latarBelakang: '',
        tujuan: '',
        manfaat: '',
        strukturLPS: '',
        layanan: '',
        perkembanganLPS: '',
        laporanKeuangan: '',

        // Kinerja Angkutan
        kinerjaAngkutan: {
            jumlahArmada: 0,
            jumlahRumahTangga: {} as RumahTanggaData,
            jumlahUMKM: 0,
            jumlahBadanUsaha: 0,
            permasalahan: '',
            aksiYangDilakukan: ''
        },

        // Kinerja Pengolahan
        kinerjaPengolahan: {
            programPengolahan: '',
            volumePemilahanOrganik: 0,
            volumePemilahanUnorganik: 0,
            volumePenjualanOrganik: 0,
            volumePenjualanUnorganik: 0,
            programEdukasi: '',
            permasalahan: '',
            aksiYangDilakukan: ''
        },

        // Kinerja Iuran
        kinerjaIuran: {
            penerimaanIuran: 0,
            iuranPerRT: 0,
            penerimaanLain: 0,
            sewaArmada: 0,
            bbm: 0,
            tenagaKerja: 0,
            administrasi: 0,
            biayaRapat: 0,
            feePetugasPungut: 0,
            gajiPengurus: 0,
            pemanfaatanIuran: '',
            permasalahan: '',
            aksiYangDilakukan: ''
        }
    })

    // State untuk input RT/RW dinamis
    const [rtInput, setRtInput] = useState({ rt: '', rw: '', jumlah: 0 })

    type FormDataSection = keyof typeof formData;
    type NestedSection = 'kinerjaAngkutan' | 'kinerjaPengolahan' | 'kinerjaIuran';

    const handleInputChange = (section: string, field: string, value: string | number) => {
        if (section === 'kinerjaAngkutan' || section === 'kinerjaPengolahan' || section === 'kinerjaIuran') {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...(prev[section as NestedSection]),
                    [field]: value
                }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [section as FormDataSection]: value
            }))
        }
    }

    const addRumahTangga = () => {
        if (rtInput.rt && rtInput.rw && rtInput.jumlah > 0) {
            const key = `RT${rtInput.rt}/RW${rtInput.rw}`
            setFormData(prev => ({
                ...prev,
                kinerjaAngkutan: {
                    ...prev.kinerjaAngkutan,
                    jumlahRumahTangga: {
                        ...prev.kinerjaAngkutan.jumlahRumahTangga,
                        [key]: rtInput.jumlah
                    }
                }
            }))
            setRtInput({ rt: '', rw: '', jumlah: 0 })
        }
    }

    const removeRumahTangga = (key: string) => {
        setFormData(prev => {
            const newRumahTangga = { ...prev.kinerjaAngkutan.jumlahRumahTangga }
            delete newRumahTangga[key]
            return {
                ...prev,
                kinerjaAngkutan: {
                    ...prev.kinerjaAngkutan,
                    jumlahRumahTangga: newRumahTangga
                }
            }
        })
    }

    const handleSubmit = async () => {
        if (!formData.bulan || !formData.kelurahan) {
            alert('Bulan dan Kelurahan wajib diisi!')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/laporan-lps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                alert('Laporan berhasil disimpan!')
                router.push('/dashboard/laporan-lps')
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert('Terjadi kesalahan saat menyimpan laporan')
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

    const tabs = [
        { id: 'pendahuluan', label: 'Pendahuluan', icon: '📄' },
        { id: 'angkutan', label: 'Angkutan', icon: '🚛' },
        { id: 'pengolahan', label: 'Pengolahan', icon: '♻️' },
        { id: 'iuran', label: 'Iuran', icon: '💰' }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
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
                    <h1 className="text-2xl font-bold text-gray-800">Buat Laporan Bulanan Baru</h1>
                    <p className="text-gray-600">Lembaga Pengelola Sampah Kelurahan</p>
                </div>
            </div>

            {/* Informasi Utama */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Laporan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bulan Laporan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="month"
                            value={formData.bulan}
                            onChange={(e) => handleInputChange('bulan', '', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kelurahan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Nama Kelurahan"
                            value={formData.kelurahan}
                            onChange={(e) => handleInputChange('kelurahan', '', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Latar Belakang</label>
                                <textarea
                                    placeholder="Uraikan secara ringkas tentang LPS kelurahan..."
                                    value={formData.latarBelakang}
                                    onChange={(e) => handleInputChange('latarBelakang', '', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label>
                                <textarea
                                    placeholder="Tujuan dalam pelaksanaan kegiatan LPS..."
                                    value={formData.tujuan}
                                    onChange={(e) => handleInputChange('tujuan', '', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Manfaat</label>
                                <textarea
                                    placeholder="Jelaskan secara ringkas manfaat operasional LPS..."
                                    value={formData.manfaat}
                                    onChange={(e) => handleInputChange('manfaat', '', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <hr className="border-gray-200" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Struktur LPS</label>
                                <textarea
                                    placeholder="Jelaskan struktur LPS yang ada lengkap dengan tugas dan fungsi..."
                                    value={formData.strukturLPS}
                                    onChange={(e) => handleInputChange('strukturLPS', '', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Layanan</label>
                                <textarea
                                    placeholder="Jelaskan program dan layanan LPS..."
                                    value={formData.layanan}
                                    onChange={(e) => handleInputChange('layanan', '', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Perkembangan LPS</label>
                                <textarea
                                    placeholder="Jelaskan secara singkat perkembangan LPS..."
                                    value={formData.perkembanganLPS}
                                    onChange={(e) => handleInputChange('perkembanganLPS', '', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Laporan Keuangan</label>
                                <textarea
                                    placeholder="Jelaskan laporan keuangan secara keseluruhan..."
                                    value={formData.laporanKeuangan}
                                    onChange={(e) => handleInputChange('laporanKeuangan', '', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab Angkutan */}
                    {activeTab === 'angkutan' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Armada</label>
                                    <input
                                        type="number"
                                        value={formData.kinerjaAngkutan.jumlahArmada}
                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahArmada', parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah UMKM</label>
                                    <input
                                        type="number"
                                        value={formData.kinerjaAngkutan.jumlahUMKM}
                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahUMKM', parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Badan Usaha</label>
                                    <input
                                        type="number"
                                        value={formData.kinerjaAngkutan.jumlahBadanUsaha}
                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahBadanUsaha', parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Input Rumah Tangga per RT/RW */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Rumah Tangga per RT/RW</label>
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        placeholder="RT"
                                        value={rtInput.rt}
                                        onChange={(e) => setRtInput(prev => ({ ...prev, rt: e.target.value }))}
                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        placeholder="RW"
                                        value={rtInput.rw}
                                        onChange={(e) => setRtInput(prev => ({ ...prev, rw: e.target.value }))}
                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Jumlah"
                                        value={rtInput.jumlah || ''}
                                        onChange={(e) => setRtInput(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 0 }))}
                                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={addRumahTangga}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Tambah
                                    </button>
                                </div>

                                {/* Daftar Rumah Tangga */}
                                <div className="mt-4 space-y-2">
                                    {Object.entries(formData.kinerjaAngkutan.jumlahRumahTangga).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                                {key}: <strong>{value}</strong> rumah tangga
                                            </span>
                                            <button
                                                onClick={() => removeRumahTangga(key)}
                                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permasalahan yang Dihadapi</label>
                                <textarea
                                    placeholder="Jelaskan permasalahan yang dihadapi..."
                                    value={formData.kinerjaAngkutan.permasalahan}
                                    onChange={(e) => handleInputChange('kinerjaAngkutan', 'permasalahan', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aksi yang Telah Dilakukan</label>
                                <textarea
                                    placeholder="Jelaskan aksi yang telah dilakukan dalam mengatasi masalah..."
                                    value={formData.kinerjaAngkutan.aksiYangDilakukan}
                                    onChange={(e) => handleInputChange('kinerjaAngkutan', 'aksiYangDilakukan', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab Pengolahan */}
                    {activeTab === 'pengolahan' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Program Pengolahan Sampah</label>
                                <textarea
                                    placeholder="Program dan kegiatan pengolahan sampah yang telah dilakukan..."
                                    value={formData.kinerjaPengolahan.programPengolahan}
                                    onChange={(e) => handleInputChange('kinerjaPengolahan', 'programPengolahan', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume Pemilahan Organik (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.kinerjaPengolahan.volumePemilahanOrganik}
                                        onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePemilahanOrganik', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume Pemilahan Anorganik (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.kinerjaPengolahan.volumePemilahanUnorganik}
                                        onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePemilahanUnorganik', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume Penjualan Organik (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.kinerjaPengolahan.volumePenjualanOrganik}
                                        onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePenjualanOrganik', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume Penjualan Anorganik (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.kinerjaPengolahan.volumePenjualanUnorganik}
                                        onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePenjualanUnorganik', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Program Edukasi</label>
                                <textarea
                                    placeholder="Program kegiatan edukasi yang telah dilakukan..."
                                    value={formData.kinerjaPengolahan.programEdukasi}
                                    onChange={(e) => handleInputChange('kinerjaPengolahan', 'programEdukasi', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permasalahan yang Dihadapi</label>
                                <textarea
                                    placeholder="Jelaskan permasalahan yang dihadapi..."
                                    value={formData.kinerjaPengolahan.permasalahan}
                                    onChange={(e) => handleInputChange('kinerjaPengolahan', 'permasalahan', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aksi yang Telah Dilakukan</label>
                                <textarea
                                    placeholder="Jelaskan aksi yang telah dilakukan dalam mengatasi masalah..."
                                    value={formData.kinerjaPengolahan.aksiYangDilakukan}
                                    onChange={(e) => handleInputChange('kinerjaPengolahan', 'aksiYangDilakukan', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab Iuran */}
                    {activeTab === 'iuran' && (
                        <div className="space-y-6">
                            {/* Penerimaan */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Penerimaan</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Penerimaan Iuran Bulanan</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.penerimaanIuran}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'penerimaanIuran', parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Iuran per RT</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.iuranPerRT || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'iuranPerRT', parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Penerimaan Lain-lain</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.penerimaanLain || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'penerimaanLain', parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pengeluaran */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Pengeluaran</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sewa Armada</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.sewaArmada || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'sewaArmada', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">BBM</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.bbm || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'bbm', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tenaga Kerja</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.tenagaKerja || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'tenagaKerja', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Administrasi</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.administrasi || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'administrasi', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Rapat (Makan Minum)</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.biayaRapat || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'biayaRapat', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fee Petugas Pungut</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.feePetugasPungut || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'feePetugasPungut', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gaji/Honor Pengurus LPS</label>
                                        <input
                                            type="number"
                                            value={formData.kinerjaIuran.gajiPengurus || 0}
                                            onChange={(e) => handleInputChange('kinerjaIuran', 'gajiPengurus', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pemanfaatan Iuran</label>
                                <textarea
                                    placeholder="Jelaskan pemanfaatan iuran sampah..."
                                    value={formData.kinerjaIuran.pemanfaatanIuran}
                                    onChange={(e) => handleInputChange('kinerjaIuran', 'pemanfaatanIuran', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permasalahan yang Dihadapi</label>
                                <textarea
                                    placeholder="Jelaskan permasalahan yang dihadapi..."
                                    value={formData.kinerjaIuran.permasalahan}
                                    onChange={(e) => handleInputChange('kinerjaIuran', 'permasalahan', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aksi yang Telah Dilakukan</label>
                                <textarea
                                    placeholder="Jelaskan aksi yang telah dilakukan dalam mengatasi masalah..."
                                    value={formData.kinerjaIuran.aksiYangDilakukan}
                                    onChange={(e) => handleInputChange('kinerjaIuran', 'aksiYangDilakukan', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                <Link
                    href="/dashboard/laporan-lps"
                    className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                    Batal
                </Link>
                {/* eslint-disable-next-line */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Simpan Laporan
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
