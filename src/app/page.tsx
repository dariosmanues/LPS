'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Truck, Recycle, Coins, 
  ChevronLeft, Building2, Calendar, 
  Plus, Trash2, Save, Info, AlertCircle, 
  MapPin, CheckCircle2, LogOut, Users 
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for cleaner tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface KelurahanInfo {
    id: string;
    nama: string;
    kecamatan: string;
}

interface RumahTanggaData {
    [key: string]: {
        jumlah: number;
        hari: string;
    }
}

export default function FormLaporanBaruLps() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [kelurahan, setKelurahan] = useState<KelurahanInfo | null>(null)
    const [kelurahanList, setKelurahanList] = useState<KelurahanInfo[]>([])
    const [activeTab, setActiveTab] = useState('pendahuluan')

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/auth'
    }

    // Fetch kelurahan info on mount
    useEffect(() => {
        // Fetch current user's kelurahan dashboard
        fetch('/api/lps/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.kelurahan) {
                    setKelurahan(data.kelurahan)
                    // Do not auto-fill kelurahan so required validation works
                    // setFormData(prev => ({
                    //     ...prev,
                    //     kelurahan: data.kelurahan.nama
                    // }))
                }
            })
            .catch(console.error)

        // Fetch all kelurahan list for dropdown
        fetch('/api/kelurahan')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setKelurahanList(data.data)
                }
            })
            .catch(console.error)
    }, [])

    // Form state
    const [formData, setFormData] = useState({
        bulan: '',
        kelurahanId: '',
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
            persentasePartisipasi: 0,
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
            iuranPerRW: [] as { rw: string, nilai: number }[],
            nilaiIuran: [] as number[],
            penerimaanLain: 0,
            sewaArmada: 0,
            bbm: 0,
            tenagaKerja: 0,
            administrasi: 0,
            biayaRapat: 0,
            feePetugasPungut: 0,
            gajiPengurus: 0,
            biayaLainLain: 0,
            pemanfaatanIuran: '',
            permasalahan: '',
            aksiYangDilakukan: ''
        }
    })

    const [rtInput, setRtInput] = useState({ rt: '', rw: '', jumlah: 0, hari: '' })
    const [anorganikInput, setAnorganikInput] = useState({ kategori: '', volume: 0 })

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
        if (!rtInput.rt || !rtInput.rw || rtInput.jumlah <= 0 || !rtInput.hari) {
            alert('Mohon lengkapi RT, RW, Jumlah KK, dan Hari');
            return;
        }

        const key = `RT${rtInput.rt}/RW${rtInput.rw}`
        setFormData(prev => ({
            ...prev,
            kinerjaAngkutan: {
                ...prev.kinerjaAngkutan,
                jumlahRumahTangga: {
                    ...prev.kinerjaAngkutan.jumlahRumahTangga,
                    [key]: { jumlah: rtInput.jumlah, hari: rtInput.hari }
                }
            }
        }))
        setRtInput({ rt: '', rw: '', jumlah: 0, hari: '' })
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

    const addIuranPerRW = () => {
        setFormData(prev => ({
            ...prev,
            kinerjaIuran: {
                ...prev.kinerjaIuran,
                iuranPerRW: [...prev.kinerjaIuran.iuranPerRW, { rw: '', nilai: 0 }]
            }
        }))
    }

    const removeIuranPerRW = (index: number) => {
        setFormData(prev => {
            const newIuran = [...prev.kinerjaIuran.iuranPerRW]
            newIuran.splice(index, 1)
            return {
                ...prev,
                kinerjaIuran: {
                    ...prev.kinerjaIuran,
                    iuranPerRW: newIuran
                }
            }
        })
    }

    const updateIuranPerRW = (index: number, field: 'rw' | 'nilai', value: any) => {
        setFormData(prev => {
            const newIuran = [...prev.kinerjaIuran.iuranPerRW]
            newIuran[index] = { ...newIuran[index], [field]: value }
            return {
                ...prev,
                kinerjaIuran: {
                    ...prev.kinerjaIuran,
                    iuranPerRW: newIuran
                }
            }
        })
    }

    const addNilaiIuran = () => {
        setFormData(prev => ({
            ...prev,
            kinerjaIuran: {
                ...prev.kinerjaIuran,
                nilaiIuran: [...prev.kinerjaIuran.nilaiIuran, 0]
            }
        }))
    }

    const removeNilaiIuran = (index: number) => {
        setFormData(prev => {
            const newNilaiIuran = [...prev.kinerjaIuran.nilaiIuran]
            newNilaiIuran.splice(index, 1)
            return {
                ...prev,
                kinerjaIuran: {
                    ...prev.kinerjaIuran,
                    nilaiIuran: newNilaiIuran
                }
            }
        })
    }

    const updateNilaiIuran = (index: number, value: number) => {
        setFormData(prev => {
            const newNilaiIuran = [...prev.kinerjaIuran.nilaiIuran]
            newNilaiIuran[index] = value
            return {
                ...prev,
                kinerjaIuran: {
                    ...prev.kinerjaIuran,
                    nilaiIuran: newNilaiIuran
                }
            }
        })
    }

    const handleSubmit = async () => {
        if (!formData.bulan) {
            alert('Bulan wajib diisi!')
            return
        }
        if (!formData.kelurahanId) {
            alert('Kelurahan wajib dipilih!')
            return
        }

        const { kinerjaAngkutan: a, kinerjaIuran: i } = formData;

        if (
            a.jumlahArmada == null || 
            a.jumlahUMKM == null || 
            a.jumlahBadanUsaha == null || 
            a.persentasePartisipasi == null ||
            !a.permasalahan.trim()
        ) {
            setActiveTab('angkutan');
            alert('Seluruh field (termasuk teks) pada tab Angkutan wajib diisi!');
            return;
        }

        if (
            i.penerimaanIuran == null ||
            i.penerimaanLain == null ||
            i.sewaArmada == null ||
            i.bbm == null ||
            i.tenagaKerja == null ||
            i.administrasi == null ||
            i.biayaRapat == null ||
            i.feePetugasPungut == null ||
            i.gajiPengurus == null ||
            i.biayaLainLain == null
        ) {
            setActiveTab('iuran');
            alert('Seluruh field pada tab Iuran wajib diisi!');
            return;
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
        { id: 'pendahuluan', label: 'Pendahuluan', icon: FileText },
        { id: 'angkutan', label: 'Angkutan', icon: Truck },
        { id: 'pengolahan', label: 'Pengolahan', icon: Recycle },
        { id: 'iuran', label: 'Iuran', icon: Coins }
    ]

    // Premium styling constants
    const inputWrapperClasses = "relative group flex items-center";
    const iconWrapperClasses = "absolute left-4 text-white/30 group-focus-within:text-emerald-400 transition-colors pointer-events-none";
    const inputClasses = "w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-white placeholder-white/30 font-medium tracking-wide";
    const labelClasses = "block text-xs font-semibold text-white/50 mb-2 tracking-widest uppercase";
    const cardClasses = "bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]";

    return (
        <div className="min-h-screen bg-[#0a0f14] text-white selection:bg-emerald-500/30 font-sans pb-20">
            {/* Background ambient glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen" />
            </div>

            <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/lps"
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:-translate-x-1 group"
                        >
                            <ChevronLeft className="w-6 h-6 text-white/70 group-hover:text-emerald-400 transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-600 drop-shadow-sm">
                                Buat Laporan Baru
                            </h1>
                            <div className="flex items-center gap-2 text-white/60 font-medium text-sm">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                {formData.kelurahanId ? `LPS Kelurahan ${kelurahanList.find(k => k.id === formData.kelurahanId)?.nama || ''}` : 'Pilih Kelurahan...'}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all font-bold tracking-wide text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Keluar
                    </button>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8 items-start">
                    {/* Left Sidebar: Informasi Laporan (Bento Grid Style) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-6"
                    >
                        <div className={cn(cardClasses, "relative overflow-hidden")}>
                            {/* Card Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 blur-[64px] rounded-full pointer-events-none" />
                            
                            <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-emerald-400">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-wide">Informasi</h2>
                                    <p className="text-xs text-white/40">Data utama laporan</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className={labelClasses}>Bulan Laporan <span className="text-red-400">*</span></label>
                                    <div className={inputWrapperClasses}>
                                        <div className={iconWrapperClasses}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="month"
                                            value={formData.bulan}
                                            onChange={(e) => handleInputChange('bulan', '', e.target.value)}
                                            className={inputClasses}
                                            required
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Kelurahan <span className="text-red-400">*</span></label>
                                    <div className={inputWrapperClasses}>
                                        <div className="absolute left-4 text-emerald-500/50 pointer-events-none">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <select
                                            value={formData.kelurahanId}
                                            onChange={(e) => handleInputChange('kelurahanId', '', e.target.value)}
                                            className={cn(inputClasses, "appearance-none")}
                                            required
                                        >
                                            <option value="" disabled className="bg-[#0a0f14] text-white/50">Pilih Kelurahan</option>
                                            {kelurahanList.map((k) => (
                                                <option key={k.id} value={k.id} className="bg-[#0a0f14] text-white">
                                                    {k.nama}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats or Tips Bento Box */}
                        <div className={cn(cardClasses, "bg-gradient-to-br from-emerald-500/5 to-emerald-900/10 border-emerald-500/20")}>
                            <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Panduan Pengisian
                            </h3>
                            <p className="text-xs text-white/60 leading-relaxed">
                                Pastikan seluruh data yang dimasukkan telah divalidasi. 
                                Anda dapat menyimpan draft jika belum selesai, atau langsung submit jika sudah lengkap.
                            </p>
                        </div>
                    </motion.div>

                    {/* Main Content Area */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={cn(cardClasses, "p-2 md:p-3")}
                    >
                        {/* Tab Navigation */}
                        <nav className="flex overflow-x-auto gap-2 p-2 bg-black/20 rounded-2xl border border-white/5 hide-scrollbar mb-6">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "relative flex items-center justify-center gap-2.5 flex-1 min-w-[140px] px-6 py-3.5 text-sm font-bold rounded-xl transition-colors duration-300 z-10",
                                            isActive ? "text-emerald-50" : "text-white/40 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-tab"
                                                className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-xl"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-emerald-400" : "")} />
                                        <span className="relative z-10 tracking-wide">{tab.label}</span>
                                    </button>
                                )
                            })}
                        </nav>

                        {/* Tab Content Container */}
                        <div className="p-4 md:p-6 lg:p-8 min-h-[500px]">
                            <AnimatePresence mode="wait">
                                {/* Tab Pendahuluan */}
                                {activeTab === 'pendahuluan' && (
                                    <motion.div 
                                        key="pendahuluan"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-8"
                                    >
                                        <div className="space-y-6">
                                            <div>
                                                <label className={labelClasses}>Aksi yang Dilakukan <span className="text-red-400">*</span></label>
                                                <textarea
                                                    placeholder="Uraikan secara ringkas tentang LPS kelurahan..."
                                                    value={formData.latarBelakang}
                                                    onChange={(e) => handleInputChange('latarBelakang', '', e.target.value)}
                                                    rows={3}
                                                    className={cn(inputClasses, "pl-4 resize-none")}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={labelClasses}>Tujuan</label>
                                                    <textarea
                                                        placeholder="Tujuan pelaksanaan kegiatan..."
                                                        value={formData.tujuan}
                                                        onChange={(e) => handleInputChange('tujuan', '', e.target.value)}
                                                        rows={3}
                                                        className={cn(inputClasses, "pl-4 resize-none")}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Manfaat</label>
                                                    <textarea
                                                        placeholder="Manfaat operasional..."
                                                        value={formData.manfaat}
                                                        onChange={(e) => handleInputChange('manfaat', '', e.target.value)}
                                                        rows={3}
                                                        className={cn(inputClasses, "pl-4 resize-none")}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClasses}>Struktur LPS</label>
                                                <textarea
                                                    placeholder="Struktur organisasi LPS..."
                                                    value={formData.strukturLPS}
                                                    onChange={(e) => handleInputChange('strukturLPS', '', e.target.value)}
                                                    rows={3}
                                                    className={cn(inputClasses, "pl-4 resize-none")}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Layanan</label>
                                                <textarea
                                                    placeholder="Program dan layanan LPS..."
                                                    value={formData.layanan}
                                                    onChange={(e) => handleInputChange('layanan', '', e.target.value)}
                                                    rows={3}
                                                    className={cn(inputClasses, "pl-4 resize-none")}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Tab Angkutan */}
                                {activeTab === 'angkutan' && (
                                    <motion.div 
                                        key="angkutan"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-10"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                            <div className="space-y-2">
                                                <label className={labelClasses}>Jumlah Armada <span className="text-red-400">*</span></label>
                                                <div className={inputWrapperClasses}>
                                                    <div className={iconWrapperClasses}><Truck className="w-5 h-5" /></div>
                                                    <input
                                                        type="number"
                                                        value={formData.kinerjaAngkutan.jumlahArmada}
                                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahArmada', parseInt(e.target.value) || 0)}
                                                        className={inputClasses}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClasses}>Jumlah UMKM <span className="text-red-400">*</span></label>
                                                <div className={inputWrapperClasses}>
                                                    <div className={iconWrapperClasses}><Building2 className="w-5 h-5" /></div>
                                                    <input
                                                        type="number"
                                                        value={formData.kinerjaAngkutan.jumlahUMKM}
                                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahUMKM', parseInt(e.target.value) || 0)}
                                                        className={inputClasses}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClasses}>Jumlah Badan Usaha <span className="text-red-400">*</span></label>
                                                <div className={inputWrapperClasses}>
                                                    <div className={iconWrapperClasses}><Building2 className="w-5 h-5" /></div>
                                                    <input
                                                        type="number"
                                                        value={formData.kinerjaAngkutan.jumlahBadanUsaha}
                                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'jumlahBadanUsaha', parseInt(e.target.value) || 0)}
                                                        className={inputClasses}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClasses}>Partisipasi Masy. (%) <span className="text-red-400">*</span></label>
                                                <div className={inputWrapperClasses}>
                                                    <div className={iconWrapperClasses}><Users className="w-5 h-5" /></div>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={formData.kinerjaAngkutan.persentasePartisipasi}
                                                        onChange={(e) => handleInputChange('kinerjaAngkutan', 'persentasePartisipasi', parseFloat(e.target.value) || 0)}
                                                        className={inputClasses}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-black/20 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
                                            <label className="block text-lg font-bold text-white mb-6 relative z-10">Data Rumah Tangga per RT/RW</label>
                                            
                                            <div className="flex flex-wrap items-center gap-4 mb-8 relative z-10">
                                                <input placeholder="RT (01)" value={rtInput.rt} onChange={(e) => setRtInput(prev => ({ ...prev, rt: e.target.value }))} className={cn(inputClasses, "w-24 pl-4 text-center")} />
                                                <span className="text-white/30 font-light text-2xl">/</span>
                                                <input placeholder="RW (02)" value={rtInput.rw} onChange={(e) => setRtInput(prev => ({ ...prev, rw: e.target.value }))} className={cn(inputClasses, "w-24 pl-4 text-center")} />
                                                <input type="number" placeholder="Jml KK" value={rtInput.jumlah || ''} onChange={(e) => setRtInput(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 0 }))} className={cn(inputClasses, "w-32 pl-4 text-center")} />
                                                <select value={rtInput.hari} onChange={(e) => setRtInput(prev => ({ ...prev, hari: e.target.value }))} className={cn(inputClasses, "w-36 pl-4 pr-10 appearance-none bg-[#0a0f14]")}>
                                                    <option value="" disabled className="text-white/50">Pilih Hari</option>
                                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => <option key={h} value={h} className="text-white">{h}</option>)}
                                                </select>
                                                <button type="button" onClick={addRumahTangga} className="px-6 py-3.5 bg-white/10 text-white font-bold rounded-2xl border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-400 transition-all flex items-center gap-2">
                                                    <Plus className="w-4 h-4" /> Tambah
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                {Object.entries(formData.kinerjaAngkutan.jumlahRumahTangga).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white tracking-wider">{key}</div>
                                                                <div className="text-sm text-white/50">{value.jumlah} Rumah Tangga - {value.hari}</div>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => removeRumahTangga(key)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {Object.keys(formData.kinerjaAngkutan.jumlahRumahTangga).length === 0 && (
                                                    <div className="col-span-full text-center py-10 px-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                                        <p className="text-white/40 text-sm">Belum ada data rumah tangga ditambahkan.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className={labelClasses}>Permasalahan & Kendala <span className="text-red-400">*</span></label>
                                            <textarea
                                                placeholder="Kendala yang dihadapi bagian angkutan..."
                                                value={formData.kinerjaAngkutan.permasalahan}
                                                onChange={(e) => handleInputChange('kinerjaAngkutan', 'permasalahan', e.target.value)}
                                                rows={3}
                                                className={cn(inputClasses, "pl-4 resize-none")}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Tab Pengolahan */}
                                {activeTab === 'pengolahan' && (
                                    <motion.div 
                                        key="pengolahan"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-10"
                                    >
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Program Pengolahan Sampah</label>
                                            <textarea
                                                placeholder="Deskripsi program pengolahan..."
                                                value={formData.kinerjaPengolahan.programPengolahan}
                                                onChange={(e) => handleInputChange('kinerjaPengolahan', 'programPengolahan', e.target.value)}
                                                rows={3}
                                                className={cn(inputClasses, "pl-4 resize-none")}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-emerald-950/20 rounded-3xl border border-emerald-500/10 relative overflow-hidden">
                                            <div className="absolute top-[-50%] left-[-20%] w-full h-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
                                            <div className="space-y-2 relative z-10">
                                                <label className={labelClasses}>Vol. Pemilahan Organik (kg)</label>
                                                <div className="relative">
                                                    <input type="number" step="0.1" value={formData.kinerjaPengolahan.volumePemilahanOrganik} onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePemilahanOrganik', parseFloat(e.target.value) || 0)} className={cn(inputClasses, "pl-4 pr-12 bg-black/40 border-emerald-500/20 focus:bg-black/60 focus:border-emerald-500")} />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold text-xs">KG</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 relative z-10">
                                                <label className={labelClasses}>Vol. Pemilahan Anorganik (kg)</label>
                                                <div className="relative">
                                                    <input type="number" step="0.1" value={formData.kinerjaPengolahan.volumePemilahanUnorganik} onChange={(e) => handleInputChange('kinerjaPengolahan', 'volumePemilahanUnorganik', parseFloat(e.target.value) || 0)} className={cn(inputClasses, "pl-4 pr-12 bg-black/40 border-emerald-500/20 focus:bg-black/60 focus:border-emerald-500")} />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold text-xs">KG</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
                                        
                                        <div>
                                            <div className="flex items-center gap-3 mb-8">
                                                <h3 className="text-xl font-bold text-white tracking-wide">Rincian Anorganik</h3>
                                                <span className="px-3 py-1 bg-white/10 text-white/60 text-[10px] uppercase font-bold tracking-wider rounded-lg border border-white/10">Opsional</span>
                                            </div>
                                            
                                            <div className="grid gap-6">
                                                {[
                                                    { key: 'Plastik', title: 'Plastik', items: [
                                                        { id: 'KantongKresek', label: 'Kantong Kresek' }, { id: 'BotolAirMineral', label: 'Botol Air Mineral' },
                                                        { id: 'WadahMakanan', label: 'Wadah Makanan' }, { id: 'Lainnya', label: 'Lainnya' }
                                                    ]},
                                                    { key: 'Logam', title: 'Logam & Kaleng', items: [
                                                        { id: 'KalengMinuman', label: 'Kaleng Minuman' }, { id: 'AluminiumFoil', label: 'Aluminium Foil' }, { id: 'Lainnya', label: 'Lainnya' }
                                                    ]}
                                                ].map(category => (
                                                    <div key={category.key} className="bg-black/20 border border-white/5 p-6 md:p-8 rounded-3xl">
                                                        <h4 className="text-sm font-bold text-white/80 mb-6 flex items-center gap-3 tracking-widest uppercase">
                                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                                                            {category.title}
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                                                            {category.items.map(item => (
                                                                <div key={`${category.key}_${item.id}`} className="space-y-2">
                                                                    <label className="block text-xs font-semibold text-white/40">{item.label}</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number" step="0.1"
                                                                            value={formData.kinerjaPengolahan.rincianAnorganik?.[`${category.key}_${item.id}`] || ''}
                                                                            onChange={(e) => handleRincianAnorganikChange(category.key, item.id, parseFloat(e.target.value) || 0)}
                                                                            className={cn(inputClasses, "pl-4 pr-10 py-2.5 text-sm bg-white/[0.02]")}
                                                                            placeholder="0.0"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-bold">KG</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Tab Iuran */}
                                {activeTab === 'iuran' && (
                                    <motion.div 
                                        key="iuran"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-8"
                                    >
                                        <div className="bg-gradient-to-br from-emerald-950/40 to-black/40 p-6 md:p-10 rounded-3xl border border-emerald-500/20 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
                                            <h3 className="text-lg font-bold text-emerald-400 mb-8 flex items-center gap-3 tracking-wide relative z-10">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Coins className="w-5 h-5" /></div>
                                                Penerimaan Keuangan
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                                {[
                                                    { id: 'penerimaanIuran', label: 'Total Iuran' },
                                                    { id: 'penerimaanLain', label: 'Penerimaan Lain' }
                                                ].map(item => (
                                                    <div key={item.id} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">{item.label} <span className="text-red-400">*</span></label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold text-sm">Rp</span>
                                                            <input type="number" value={formData.kinerjaIuran[item.id as keyof typeof formData.kinerjaIuran] as number || 0} onChange={(e) => handleInputChange('kinerjaIuran', item.id, parseFloat(e.target.value) || 0)} className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl focus:outline-none transition-colors text-white font-medium" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Iuran per RW - Multiple Dynamic Input */}
                                            <div className="mt-8 relative z-10 bg-black/40 p-4 md:p-6 rounded-2xl border border-white/5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Iuran per RW <span className="text-red-400">*</span></label>
                                                    <button type="button" onClick={addIuranPerRW} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all font-bold text-xs">
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Tambah
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {formData.kinerjaIuran.iuranPerRW.length === 0 ? (
                                                        <div className="text-center py-4 text-white/30 text-sm italic">Belum ada Iuran per RW. Klik "Tambah".</div>
                                                    ) : (
                                                        formData.kinerjaIuran.iuranPerRW.map((item, index) => (
                                                            <div key={index} className="flex gap-3 items-center">
                                                                <div className="relative w-1/3 md:w-1/4">
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold text-sm">RW</span>
                                                                    <input 
                                                                        type="text" 
                                                                        value={item.rw} 
                                                                        onChange={(e) => updateIuranPerRW(index, 'rw', e.target.value)} 
                                                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl focus:outline-none transition-colors text-white font-medium"
                                                                        placeholder="01"
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold text-sm">Rp</span>
                                                                    <input 
                                                                        type="number" 
                                                                        value={item.nilai || ''} 
                                                                        onChange={(e) => updateIuranPerRW(index, 'nilai', parseFloat(e.target.value) || 0)} 
                                                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl focus:outline-none transition-colors text-white font-medium"
                                                                        placeholder="Masukkan nilai iuran..."
                                                                    />
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeIuranPerRW(index)}
                                                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Nilai Iuran - Multiple Dynamic Input */}
                                            <div className="mt-8 relative z-10 bg-black/40 p-4 md:p-6 rounded-2xl border border-white/5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Nilai Iuran <span className="text-red-400">*</span></label>
                                                    <button type="button" onClick={addNilaiIuran} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all font-bold text-xs">
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Tambah Nilai
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {formData.kinerjaIuran.nilaiIuran.length === 0 ? (
                                                        <div className="text-center py-4 text-white/30 text-sm italic">Belum ada nilai iuran. Klik "Tambah Nilai".</div>
                                                    ) : (
                                                        formData.kinerjaIuran.nilaiIuran.map((nilai, index) => (
                                                            <div key={index} className="flex gap-3 items-center">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold text-sm">Rp</span>
                                                                    <input 
                                                                        type="number" 
                                                                        value={nilai || ''} 
                                                                        onChange={(e) => updateNilaiIuran(index, parseFloat(e.target.value) || 0)} 
                                                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl focus:outline-none transition-colors text-white font-medium"
                                                                        placeholder="Masukkan nilai iuran..."
                                                                    />
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeNilaiIuran(index)}
                                                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-red-950/20 to-black/40 p-6 md:p-10 rounded-3xl border border-red-500/10 relative overflow-hidden">
                                            <div className="absolute right-0 bottom-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />
                                            <h3 className="text-lg font-bold text-red-400 mb-8 flex items-center gap-3 tracking-wide relative z-10">
                                                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20"><Trash2 className="w-5 h-5" /></div>
                                                Pengeluaran Operasional
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                                {[
                                                    { id: 'sewaArmada', label: 'Sewa Armada' },
                                                    { id: 'bbm', label: 'BBM' },
                                                    { id: 'tenagaKerja', label: 'Tenaga Kerja' },
                                                    { id: 'administrasi', label: 'Administrasi' },
                                                    { id: 'biayaRapat', label: 'Biaya Rapat' },
                                                    { id: 'feePetugasPungut', label: 'Fee Petugas Pungut' },
                                                    { id: 'gajiPengurus', label: 'Gaji Pengurus' },
                                                    { id: 'biayaLainLain', label: 'Biaya Lain-lain' }
                                                ].map(item => (
                                                    <div key={item.id} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">{item.label} <span className="text-red-400">*</span></label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400/50 font-bold text-sm">Rp</span>
                                                            <input type="number" value={(formData.kinerjaIuran[item.id as keyof typeof formData.kinerjaIuran] as number) || 0} onChange={(e) => handleInputChange('kinerjaIuran', item.id, parseFloat(e.target.value) || 0)} className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl focus:outline-none transition-colors text-white font-medium" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-end gap-4 mt-8 pt-8 border-t border-white/10">
                    <Link
                        href="/lps"
                        className="px-8 py-4 bg-white/5 text-white/70 rounded-2xl font-bold hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                    >
                        Batal
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="group relative flex items-center gap-2 px-10 py-4 bg-emerald-500 text-black rounded-2xl font-extrabold hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100 overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/20 border-t-black"></div>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Simpan Laporan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            {/* Define shimmer animation in global CSS or here */}
            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    )
}
