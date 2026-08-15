'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface KelurahanInfo {
    id: string;
    nama: string;
    kecamatan: string;
}

interface RumahTanggaData {
    [key: string]: number
}

export default function FormLaporanBaruLps() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [kelurahan, setKelurahan] = useState<KelurahanInfo | null>(null)
    const [activeTab, setActiveTab] = useState('pendahuluan')

    // Fetch kelurahan info on mount
    useEffect(() => {
        fetch('/api/lps/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.kelurahan) {
                    setKelurahan(data.kelurahan)
                    setFormData(prev => ({
                        ...prev,
                        kelurahan: data.kelurahan.nama
                    }))
                }
            })
            .catch(console.error)
    }, [])

    // Form state
    const [formData, setFormData] = useState({
        bulan: '',
        kelurahan: '',
        latarBelakang: '',
        tujuan: '',
        manfaat: '',
        strukturLPS: '',
        layanan: '',
        perkembanganLPS: '',
        laporanKeuangan: '',

        kinerjaAngkutan: {
            jumlahArmada: 0,
            jumlahRumahTangga: {} as RumahTanggaData,
            jumlahUMKM: 0,
            jumlahBadanUsaha: 0,
            permasalahan: '',
            aksiYangDilakukan: ''
        },

        kinerjaPengolahan: {
            programPengolahan: '',
            volumePemilahanOrganik: 0,
            volumePemilahanUnorganik: 0,
            volumePenjualanOrganik: 0,
            volumePenjualanUnorganik: 0,
            rincianAnorganik: {} as Record<string, number>,
            programEdukasi: '',
            permasalahan: '',
            aksiYangDilakukan: ''
        },

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

    const [rtInput, setRtInput] = useState({ rt: '', rw: '', jumlah: 0 })

    type NestedSection = 'kinerjaAngkutan' | 'kinerjaPengolahan' | 'kinerjaIuran';

    const handleInputChange = (section: keyof typeof formData, field: string, value: any) => {
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
                [section]: value
            }))
        }
    }

    const handleRincianAnorganikChange = (kategori: string, subkategori: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            kinerjaPengolahan: {
                ...prev.kinerjaPengolahan,
                rincianAnorganik: {
                    ...prev.kinerjaPengolahan.rincianAnorganik,
                    [`${kategori}_${subkategori}`]: value
                }
            }
        }))
    }

    const addRumahTangga = () => {
        if (!rtInput.rt || !rtInput.rw || rtInput.jumlah <= 0) {
            alert('Mohon lengkapi RT, RW, dan Jumlah Rumah Tangga (> 0)');
            return;
        }

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
        if (!formData.bulan) {
            alert('Bulan wajib diisi!')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/laporan-lps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                alert('Laporan berhasil disimpan!')
                router.push('/lps')
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

    const tabs = [
        { id: 'pendahuluan', label: 'Pendahuluan', icon: '📄' },
        { id: 'angkutan', label: 'Angkutan', icon: '🚛' },
        { id: 'pengolahan', label: 'Pengolahan', icon: '♻️' },
        { id: 'iuran', label: 'Iuran', icon: '💰' }
    ]

    // Premium styling helpers
    const inputClasses = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/15 focus:border-green-500 hover:border-green-400 hover:bg-white transition-all duration-300 text-gray-700 shadow-sm";
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide";
    const cardClasses = "bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-all duration-300";

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-green-600 to-green-800 rounded-3xl p-8 text-white shadow-xl shadow-green-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-10 -mb-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <Link
                        href="/lps"
                        className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all duration-300 hover:-translate-x-1"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Buat Laporan Baru</h1>
                        <div className="flex items-center gap-2 text-green-50 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                            {kelurahan ? `LPS Kelurahan ${kelurahan.nama}` : 'Memuat data...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Informasi Utama */}
            <div className={cardClasses + " hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-green-100 rounded-lg text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Informasi Laporan</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group">
                        <label className={labelClasses}>
                            Bulan Laporan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="month"
                            value={formData.bulan}
                            onChange={(e) => handleInputChange('bulan', '', e.target.value)}
                            className={inputClasses}
                            required
                        />
                    </div>
                    <div className="group">
                        <label className={labelClasses}>Kelurahan</label>
                        <input
                            type="text"
                            value={kelurahan?.nama || ''}
                            disabled
                            className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50/50 text-gray-500 font-medium cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Otomatis dari akun Anda
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Tabs Area */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden transition-all duration-300">
                {/* Tab Navigation */}
                <div className="border-b border-gray-100 bg-white/50 p-2">
                    <div className="flex overflow-x-auto gap-2 p-1 hide-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center flex-1 min-w-[140px] px-6 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                    ? 'text-green-700 bg-green-50 shadow-sm border border-green-100/50 scale-100'
                                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50/50 hover:scale-[0.98]'
                                    }`}
                            >
                                <span className="mr-2.5 text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {/* Tab Pendahuluan */}
                    {activeTab === 'pendahuluan' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <label className={labelClasses}>Latar Belakang</label>
                                <textarea
                                    placeholder="Uraikan secara ringkas tentang LPS kelurahan..."
                                    value={formData.latarBelakang}
                                    onChange={(e) => handleInputChange('latarBelakang', '', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Tujuan</label>
                                <textarea
                                    placeholder="Tujuan pelaksanaan kegiatan LPS..."
                                    value={formData.tujuan}
                                    onChange={(e) => handleInputChange('tujuan', '', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Manfaat</label>
                                <textarea
                                    placeholder="Manfaat operasional LPS..."
                                    value={formData.manfaat}
                                    onChange={(e) => handleInputChange('manfaat', '', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8"></div>
                            <div>
                                <label className={labelClasses}>Struktur LPS</label>
                                <textarea
                                    placeholder="Struktur organisasi LPS..."
                                    value={formData.strukturLPS}
                                    onChange={(e) => handleInputChange('strukturLPS', '', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Layanan</label>
                                <textarea
                                    placeholder="Program dan layanan LPS..."
                                    value={formData.layanan}
                                    onChange={(e) => handleInputChange('layanan', '', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab Angkutan */}
                    {activeTab === 'angkutan' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className={labelClasses}>Jumlah Armada</label>
                                    <input
                                        type="number"
                                        value={formData.kinerjaAngkutan.jumlahArmada}
                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahArmada', parseInt(e.target.value) || 0)}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Jumlah UMKM</label>
                                    <input
                                        type="number"
                                        value={formData.kinerjaAngkutan.jumlahUMKM}
                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahUMKM', parseInt(e.target.value) || 0)}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Jumlah Badan Usaha</label>
                                    <input
                                        type="number"
                                        value={formData.kinerjaAngkutan.jumlahBadanUsaha}
                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahBadanUsaha', parseInt(e.target.value) || 0)}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <label className="block text-base font-bold text-gray-800 mb-4">Data Rumah Tangga per RT/RW</label>
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <input placeholder="RT (Misal: 01)" value={rtInput.rt} onChange={(e) => setRtInput(prev => ({ ...prev, rt: e.target.value }))} className="w-24 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-shadow shadow-sm" />
                                    <span className="text-gray-400 font-bold">/</span>
                                    <input placeholder="RW (Misal: 02)" value={rtInput.rw} onChange={(e) => setRtInput(prev => ({ ...prev, rw: e.target.value }))} className="w-24 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-shadow shadow-sm" />
                                    <input type="number" placeholder="Jumlah KK" value={rtInput.jumlah || ''} onChange={(e) => setRtInput(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 0 }))} className="w-32 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition-shadow shadow-sm" />
                                    <button type="button" onClick={addRumahTangga} className="px-5 py-2.5 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 hover:shadow-lg transition-all active:scale-95">
                                        + Tambah Data
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(formData.kinerjaAngkutan.jumlahRumahTangga).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-green-200 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                </div>
                                                <span className="font-medium text-gray-700">{key}: <span className="text-green-600 font-bold">{value}</span> Rumah Tangga</span>
                                            </div>
                                            <button type="button" onClick={() => removeRumahTangga(key)} className="px-4 py-1.5 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100">Hapus</button>
                                        </div>
                                    ))}
                                    {Object.keys(formData.kinerjaAngkutan.jumlahRumahTangga).length === 0 && (
                                        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">Belum ada data rumah tangga yang ditambahkan.</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>Permasalahan & Kendala</label>
                                <textarea
                                    value={formData.kinerjaAngkutan.permasalahan}
                                    onChange={(e) => handleInputChange('kinerjaAngkutan', 'permasalahan', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab Pengolahan */}
                    {activeTab === 'pengolahan' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <label className={labelClasses}>Program Pengolahan Sampah</label>
                                <textarea
                                    value={formData.kinerjaPengolahan.programPengolahan}
                                    onChange={(e) => handleInputChange('kinerjaPengolahan', 'programPengolahan', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-2xl border border-green-100/50">
                                <div>
                                    <label className={labelClasses}>Volume Pemilahan Organik (kg)</label>
                                    <div className="relative">
                                        <input type="number" step="0.1" value={formData.kinerjaPengolahan.volumePemilahanOrganik} onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePemilahanOrganik', parseFloat(e.target.value) || 0)} className={inputClasses + " pr-12"} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Volume Pemilahan Anorganik (kg)</label>
                                    <div className="relative">
                                        <input type="number" step="0.1" value={formData.kinerjaPengolahan.volumePemilahanUnorganik} onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePemilahanUnorganik', parseFloat(e.target.value) || 0)} className={inputClasses + " pr-12"} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8"></div>
                            
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <h3 className="text-lg font-bold text-gray-800">Rincian Volume Spesifik Anorganik</h3>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Opsional</span>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Map over categories for cleaner code and consistent UI */}
                                    {[
                                        { key: 'Plastik', title: 'Plastik', items: [
                                            { id: 'KantongKresek', label: 'Kantong Kresek' }, { id: 'BotolAirMineral', label: 'Botol Air Mineral' },
                                            { id: 'WadahMakanan', label: 'Wadah Makanan' }, { id: 'Sedotan', label: 'Sedotan' },
                                            { id: 'TutupBotol', label: 'Tutup Botol' }, { id: 'Lainnya', label: 'Lainnya' }
                                        ]},
                                        { key: 'Logam', title: 'Logam & Kaleng', items: [
                                            { id: 'KalengMinuman', label: 'Kaleng Minuman' }, { id: 'AluminiumFoil', label: 'Aluminium Foil' },
                                            { id: 'PakuBekas', label: 'Paku Bekas' }, { id: 'Kawat', label: 'Kawat' }, { id: 'Lainnya', label: 'Lainnya' }
                                        ]},
                                        { key: 'Kaca', title: 'Kaca', items: [
                                            { id: 'PecahanBotol', label: 'Pecahan Botol' }, { id: 'GelasBeling', label: 'Gelas Beling' },
                                            { id: 'JendelaRusak', label: 'Jendela Rusak' }, { id: 'Lainnya', label: 'Lainnya' }
                                        ]},
                                        { key: 'Karet', title: 'Karet', items: [
                                            { id: 'BanBekas', label: 'Ban Bekas' }, { id: 'SandalJepit', label: 'Sandal Jepit Rusak' }, { id: 'Lainnya', label: 'Lainnya' }
                                        ]},
                                        { key: 'Elektronik', title: 'Elektronik (Limbah B3)', items: [
                                            { id: 'BateraiBekas', label: 'Baterai Bekas' }, { id: 'Kabel', label: 'Kabel' },
                                            { id: 'BohlamLampu', label: 'Bohlam Lampu' }, { id: 'Lainnya', label: 'Lainnya' }
                                        ]}
                                    ].map(category => (
                                        <div key={category.key} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:border-green-100 transition-colors">
                                            <h4 className="text-base font-bold text-gray-700 mb-5 flex items-center gap-2">
                                                <span className="w-1.5 h-6 bg-green-500 rounded-full inline-block"></span>
                                                {category.title}
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {category.items.map(item => (
                                                    <div key={`${category.key}_${item.id}`} className="group">
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 group-hover:text-green-600 transition-colors">{item.label}</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number" step="0.1"
                                                                value={formData.kinerjaPengolahan.rincianAnorganik?.[`${category.key}_${item.id}`] || ''}
                                                                onChange={(e) => handleRincianAnorganikChange(category.key, item.id, parseFloat(e.target.value) || 0)}
                                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 hover:border-green-300 transition-all text-sm"
                                                                placeholder="0.0"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">kg</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8"></div>

                            <div>
                                <label className={labelClasses}>Program Edukasi & Sosialisasi</label>
                                <textarea
                                    value={formData.kinerjaPengolahan.programEdukasi}
                                    onChange={(e) => handleInputChange('kinerjaPengolahan', 'programEdukasi', e.target.value)}
                                    rows={3}
                                    className={inputClasses + " resize-none"}
                                    placeholder="Jelaskan program edukasi yang telah dilakukan..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab Iuran */}
                    {activeTab === 'iuran' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/50 p-6 md:p-8 rounded-3xl border border-green-100 shadow-sm relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-green-200/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                <h3 className="text-lg font-bold text-green-900 mb-6 flex items-center gap-2 relative z-10">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Penerimaan Keuangan
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                    {[
                                        { id: 'penerimaanIuran', label: 'Iuran Bulanan Total' },
                                        { id: 'iuranPerRT', label: 'Iuran per Rumah Tangga' },
                                        { id: 'penerimaanLain', label: 'Penerimaan Lainnya' }
                                    ].map(item => (
                                        <div key={item.id} className="bg-white/80 backdrop-blur p-1 rounded-2xl shadow-sm">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider px-3 pt-3 mb-1">{item.label}</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                                <input type="number" value={formData.kinerjaIuran[item.id as keyof typeof formData.kinerjaIuran] || 0} onChange={(e) => handleInputChange('kinerjaIuran', item.id, parseFloat(e.target.value) || 0)} className="w-full pl-10 pr-4 py-2.5 bg-transparent focus:outline-none focus:bg-white rounded-xl transition-colors font-medium text-gray-800" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-50/80 to-orange-50/50 p-6 md:p-8 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 w-64 h-64 bg-red-200/20 rounded-full blur-3xl -mr-20 -mb-20"></div>
                                <h3 className="text-lg font-bold text-red-900 mb-6 flex items-center gap-2 relative z-10">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                                    Pengeluaran Operasional
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                    {[
                                        { id: 'sewaArmada', label: 'Sewa Armada' },
                                        { id: 'bbm', label: 'Bahan Bakar (BBM)' },
                                        { id: 'tenagaKerja', label: 'Tenaga Kerja' }
                                    ].map(item => (
                                        <div key={item.id} className="bg-white/80 backdrop-blur p-1 rounded-2xl shadow-sm">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider px-3 pt-3 mb-1">{item.label}</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                                <input type="number" value={formData.kinerjaIuran[item.id as keyof typeof formData.kinerjaIuran] || 0} onChange={(e) => handleInputChange('kinerjaIuran', item.id, parseFloat(e.target.value) || 0)} className="w-full pl-10 pr-4 py-2.5 bg-transparent focus:outline-none focus:bg-white rounded-xl transition-colors font-medium text-gray-800" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-4">
                <Link
                    href="/lps"
                    className="px-6 py-3.5 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
                >
                    Batalkan
                </Link>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-bold hover:from-green-500 hover:to-green-400 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Menyimpan Data...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Simpan Laporan
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

