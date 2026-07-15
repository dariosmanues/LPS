'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
    LogOut, FileText, Search, ShieldAlert,
    TrendingUp, MapPin, Calendar, Clock,
    ChevronDown, ChevronUp, Download
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function AdminDashboard() {
    const router = useRouter()
    const [laporan, setLaporan] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/laporan-lps')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setLaporan(data.data)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const handleLogout = () => {
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        router.push('/admin/auth')
    }

    const filteredLaporan = laporan.filter(item => 
        item.kelurahan?.nama?.toLowerCase().includes(search.toLowerCase()) ||
        item.bulan?.toLowerCase().includes(search.toLowerCase())
    )

    const toggleExpand = (id: string) => {
        if (expandedId === id) setExpandedId(null)
        else setExpandedId(id)
    }

    const generatePDF = (item: any) => {
        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 20
        const contentWidth = pageWidth - margin * 2
        let y = 20

        const kelurahanNama = item.kelurahan?.nama || 'Unknown'
        const bulanLabel = item.bulan || '-'

        // === HEADER ===
        doc.setFillColor(16, 185, 129)
        doc.rect(0, 0, pageWidth, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(`LAPORAN LPS KELURAHAN ${kelurahanNama.toUpperCase()}`, pageWidth / 2, 18, { align: 'center' })
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.text(`Periode: ${bulanLabel}`, pageWidth / 2, 28, { align: 'center' })
        const createdDate = new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        doc.text(`Tanggal Dibuat: ${createdDate}`, pageWidth / 2, 35, { align: 'center' })
        y = 50

        // Helper: Section Title
        const sectionTitle = (title: string) => {
            if (y > 270) { doc.addPage(); y = 20 }
            doc.setFillColor(240, 253, 244)
            doc.rect(margin, y - 5, contentWidth, 10, 'F')
            doc.setTextColor(5, 150, 105)
            doc.setFontSize(13)
            doc.setFont('helvetica', 'bold')
            doc.text(title, margin + 3, y + 2)
            y += 12
            doc.setTextColor(30, 30, 30)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
        }

        // Helper: Label + Value
        const addField = (label: string, value: string) => {
            if (y > 275) { doc.addPage(); y = 20 }
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.text(`${label}:`, margin, y)
            doc.setFont('helvetica', 'normal')
            const lines = doc.splitTextToSize(value || '-', contentWidth - 2)
            doc.text(lines, margin + 2, y + 5)
            y += 5 + lines.length * 5 + 3
        }

        const formatRp = (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`

        // === I. PENDAHULUAN ===
        sectionTitle('I. PENDAHULUAN')
        addField('Latar Belakang', item.latarBelakang)
        addField('Tujuan', item.tujuan)
        addField('Manfaat', item.manfaat)
        addField('Struktur LPS', item.strukturLPS)
        addField('Layanan', item.layanan)
        if (item.perkembanganLPS) addField('Perkembangan LPS', item.perkembanganLPS)

        // === II. KINERJA ANGKUTAN ===
        sectionTitle('II. KINERJA ANGKUTAN')
        const angkutan = item.kinerjaAngkutan
        if (angkutan) {
            autoTable(doc, {
                startY: y,
                margin: { left: margin, right: margin },
                head: [['Parameter', 'Nilai']],
                body: [
                    ['Jumlah Armada', String(angkutan.jumlahArmada || 0)],
                    ['Jumlah UMKM Dilayani', String(angkutan.jumlahUMKM || 0)],
                    ['Jumlah Badan Usaha', String(angkutan.jumlahBadanUsaha || 0)],
                ],
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9 },
            })
            y = (doc as any).lastAutoTable.finalY + 6

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.text('Data Rumah Tangga per RT/RW:', margin, y)
            y += 5
            const rtData = angkutan.rumahTangga || []
            if (rtData.length > 0) {
                autoTable(doc, {
                    startY: y,
                    margin: { left: margin, right: margin },
                    head: [['RT/RW', 'Jumlah KK']],
                    body: rtData.map((rt: any) => [rt.rtRw, String(rt.jumlah)]),
                    theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 9 },
                })
                y = (doc as any).lastAutoTable.finalY + 6
            } else {
                doc.setFont('helvetica', 'italic')
                doc.setFontSize(9)
                doc.setTextColor(150, 150, 150)
                doc.text('Tidak ada data rumah tangga.', margin + 2, y)
                y += 8
                doc.setTextColor(30, 30, 30)
            }
            if (angkutan.permasalahan) addField('Permasalahan', angkutan.permasalahan)
            if (angkutan.aksiYangDilakukan) addField('Aksi yang Dilakukan', angkutan.aksiYangDilakukan)
        }

        // === III. KINERJA PENGOLAHAN ===
        sectionTitle('III. KINERJA PENGOLAHAN')
        const pengolahan = item.kinerjaPengolahan
        if (pengolahan) {
            autoTable(doc, {
                startY: y,
                margin: { left: margin, right: margin },
                head: [['Parameter', 'Volume (kg)']],
                body: [
                    ['Pemilahan Organik', String(pengolahan.volumePemilahanOrganik || 0)],
                    ['Pemilahan Anorganik', String(pengolahan.volumePemilahanUnorganik || 0)],
                    ['Penjualan Organik', String(pengolahan.volumePenjualanOrganik || 0)],
                    ['Penjualan Anorganik', String(pengolahan.volumePenjualanUnorganik || 0)],
                ],
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9 },
            })
            y = (doc as any).lastAutoTable.finalY + 6

            if (pengolahan.rincianAnorganik && pengolahan.rincianAnorganik.length > 0) {
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(10)
                doc.text('Rincian Anorganik:', margin, y)
                y += 5
                autoTable(doc, {
                    startY: y,
                    margin: { left: margin, right: margin },
                    head: [['Kategori', 'Volume (kg)']],
                    body: pengolahan.rincianAnorganik.map((r: any) => [
                        r.kategori.replace(/_/g, ' - '), String(r.volume)
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 9 },
                })
                y = (doc as any).lastAutoTable.finalY + 6
            }
            if (pengolahan.programPengolahan) addField('Program Pengolahan', pengolahan.programPengolahan)
            if (pengolahan.programEdukasi) addField('Program Edukasi', pengolahan.programEdukasi)
            if (pengolahan.permasalahan) addField('Permasalahan', pengolahan.permasalahan)
        }

        // === IV. KINERJA IURAN ===
        sectionTitle('IV. KINERJA IURAN')
        const iuran = item.kinerjaIuran
        if (iuran) {
            autoTable(doc, {
                startY: y,
                margin: { left: margin, right: margin },
                head: [['Penerimaan', 'Jumlah']],
                body: [
                    ['Total Iuran', formatRp(iuran.penerimaanIuran)],
                    ['Iuran per RT', formatRp(iuran.iuranPerRT)],
                    ['Penerimaan Lain', formatRp(iuran.penerimaanLain)],
                ],
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9 },
            })
            y = (doc as any).lastAutoTable.finalY + 6

            autoTable(doc, {
                startY: y,
                margin: { left: margin, right: margin },
                head: [['Pengeluaran', 'Jumlah']],
                body: [
                    ['Sewa Armada', formatRp(iuran.sewaArmada)],
                    ['BBM', formatRp(iuran.bbm)],
                    ['Tenaga Kerja', formatRp(iuran.tenagaKerja)],
                    ['Administrasi', formatRp(iuran.administrasi)],
                    ['Biaya Rapat', formatRp(iuran.biayaRapat)],
                    ['Fee Petugas Pungut', formatRp(iuran.feePetugasPungut)],
                    ['Gaji Pengurus', formatRp(iuran.gajiPengurus)],
                ],
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9 },
            })
            y = (doc as any).lastAutoTable.finalY + 6

            if (iuran.pemanfaatanIuran) addField('Pemanfaatan Iuran', iuran.pemanfaatanIuran)
            if (iuran.permasalahan) addField('Permasalahan', iuran.permasalahan)
            if (iuran.aksiYangDilakukan) addField('Aksi yang Dilakukan', iuran.aksiYangDilakukan)
        }

        // === FOOTER ===
        const totalPages = doc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`Laporan LPS ${kelurahanNama} - ${bulanLabel} | Hal ${i}/${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
        }

        doc.save(`Laporan_LPS_${kelurahanNama.replace(/\s+/g, '_')}_${bulanLabel}.pdf`)
    }

    const cardClasses = "bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]";
    const inputClasses = "w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-white placeholder-white/30 font-medium tracking-wide";

    return (
        <div className="min-h-screen bg-[#0a0f14] text-white selection:bg-emerald-500/30 font-sans pb-20">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen" />
            </div>

            <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-600 drop-shadow-sm">
                                Admin Dashboard
                            </h1>
                            <div className="flex items-center gap-2 text-white/60 font-medium text-sm">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                Monitoring Laporan LPS
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all font-bold tracking-wide text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        Keluar Admin
                    </button>
                </header>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(cardClasses, "relative overflow-hidden")}
                >
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[64px] rounded-full pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                        <h2 className="text-xl font-bold tracking-wide flex items-center gap-3">
                            <FileText className="text-emerald-400 w-6 h-6" />
                            Daftar Laporan Masuk
                        </h2>
                        <div className="relative w-full md:w-80 group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari kelurahan atau bulan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-emerald-500 gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-500"></div>
                            <p className="font-bold tracking-widest uppercase text-xs">Memuat Data...</p>
                        </div>
                    ) : filteredLaporan.length === 0 ? (
                        <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                            <p className="text-white/40">Belum ada laporan yang ditemukan.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredLaporan.map((item, idx) => {
                                const isExpanded = expandedId === item.id;
                                const date = new Date(item.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                });
                                
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.id} 
                                        className={cn(
                                            "bg-black/40 border transition-all duration-300 overflow-hidden",
                                            isExpanded ? "rounded-3xl border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "rounded-2xl border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer"
                                        )}
                                    >
                                        <div 
                                            className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                                            onClick={() => !isExpanded && toggleExpand(item.id)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-lg tracking-wide mb-1">
                                                        LPS {item.kelurahan?.nama || 'Unknown'}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-xs font-semibold tracking-wider uppercase text-white/40">
                                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> {item.bulan}</span>
                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                                <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-sm font-bold flex items-center gap-2">
                                                    Rp {(item.kinerjaIuran?.penerimaanIuran || 0).toLocaleString('id-ID')}
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); generatePDF(item); }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all text-sm font-bold"
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    PDF
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors ml-auto"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-400" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                                                </button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-6 md:p-8 border-t border-white/5 bg-gradient-to-b from-transparent to-black/40">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Detail Iuran</h4>
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex justify-between"><span className="text-white/60">Total Iuran</span> <span className="font-bold text-emerald-400">Rp {(item.kinerjaIuran?.penerimaanIuran || 0).toLocaleString('id-ID')}</span></div>
                                                            <div className="flex justify-between"><span className="text-white/60">Pengeluaran (Gaji)</span> <span className="font-bold text-red-400">Rp {(item.kinerjaIuran?.gajiPengurus || 0).toLocaleString('id-ID')}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Kinerja Angkutan</h4>
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex justify-between"><span className="text-white/60">Jml Armada</span> <span className="font-bold text-white">{item.kinerjaAngkutan?.jumlahArmada || 0}</span></div>
                                                            <div className="flex justify-between"><span className="text-white/60">Jml UMKM Dilayani</span> <span className="font-bold text-white">{item.kinerjaAngkutan?.jumlahUMKM || 0}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Kinerja Pengolahan</h4>
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex justify-between"><span className="text-white/60">Organik Dipilah</span> <span className="font-bold text-emerald-400">{item.kinerjaPengolahan?.volumePemilahanOrganik || 0} kg</span></div>
                                                            <div className="flex justify-between"><span className="text-white/60">Anorganik Dipilah</span> <span className="font-bold text-emerald-400">{item.kinerjaPengolahan?.volumePemilahanUnorganik || 0} kg</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-8 pt-6 border-t border-white/10">
                                                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Latar Belakang</h4>
                                                    <p className="text-sm text-white/70 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                                                        {item.latarBelakang || <span className="italic text-white/30">Tidak ada deskripsi latar belakang.</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
