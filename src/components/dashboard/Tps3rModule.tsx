'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePermissions } from '@/lib/permissions';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';

export interface Tps3rStats {
    todaySampahMasuk: number;
    todaySampahDibakar: number;
    totalReportsToday: number;
    latestStatus: string;
    totalWorkers: number;
    weeklyAvgSampah: number;
}

export interface OperationalHoursData {
    date: string;
    pemilahanHours: number;
    pembakaranHours: number;
}

export interface FuelConsumptionData {
    date: string;
    kayu: number;
    oli: number;
    ban: number;
}

export interface MaintenanceItem {
    id: string;
    tanggal: string;
    statusOperasi: string;
    catatanKerusakan: string | null;
    tindakanPerbaikan: string | null;
    tindakanPerawatan: string | null;
    namaOperator: string;
}

export interface ReadinessStats {
    normalDays: number;
    kendalaDays: number;
    perawatanDays: number;
    totalDays: number;
    readinessPercentage: number;
}

export interface Tps3rReportItem {
    id: string;
    tanggal: string;
    namaOperator: string;
    jumlahPekerja: number;
    jenisSampah: string;
    beratSampahMasuk: number;
    beratAmpasSetelahPilahan: number;
    beratPlastikSetelahPilahan: number;
    beratSampahDibakar: number;
    jenisBBM: string;
    jumlahKayu: number | null;
    jumlahBan: number | null;
    jumlahOli: number | null;
    waktuPemilahanMulai: string;
    waktuPemilahanSelesai: string;
    waktuPembakaranMulai: string;
    waktuPembakaranSelesai: string;
    statusOperasi: string;
    catatanKerusakan: string | null;
    tindakanPerbaikan: string | null;
    tindakanPerawatan: string | null;
    fotoIncinerator: string | null;
    createdAt: string;
}

export type Tps3rTab = 'dashboard' | 'input' | 'reports' | 'gallery';

export function Tps3rModule({ initialTab = 'dashboard' }: { initialTab?: Tps3rTab }) {
    const { isSuperAdmin } = usePermissions();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const tabFromQuery = searchParams?.get('tab') as Tps3rTab | null;
    const [activeTab, setActiveTab] = useState<Tps3rTab>(tabFromQuery || initialTab);

    useEffect(() => {
        if (tabFromQuery && ['dashboard', 'input', 'reports', 'gallery'].includes(tabFromQuery)) {
            setActiveTab(tabFromQuery);
        } else {
            setActiveTab(initialTab);
        }
    }, [tabFromQuery, initialTab]);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Tps3rStats>({
        todaySampahMasuk: 0,
        todaySampahDibakar: 0,
        totalReportsToday: 0,
        latestStatus: 'normal',
        totalWorkers: 0,
        weeklyAvgSampah: 0,
    });
    const [operationalHours, setOperationalHours] = useState<OperationalHoursData[]>([]);
    const [fuelData, setFuelData] = useState<FuelConsumptionData[]>([]);
    const [maintenanceData, setMaintenanceData] = useState<MaintenanceItem[]>([]);
    const [readinessStats, setReadinessStats] = useState<ReadinessStats>({
        normalDays: 0,
        kendalaDays: 0,
        perawatanDays: 0,
        totalDays: 0,
        readinessPercentage: 100,
    });
    const [recentWorkers, setRecentWorkers] = useState<{ name: string; role: string; date: string }[]>([]);
    const [reports, setReports] = useState<Tps3rReportItem[]>([]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form state for Input Data Harian
    const todayIso = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        tanggal: todayIso,
        namaOperator: '',
        jumlahPekerja: 1,
        jenisSampah: 'organik',
        beratSampahMasuk: 0,
        beratAmpasSetelahPilahan: 0,
        beratPlastikSetelahPilahan: 0,
        beratSampahDibakar: 0,
        jenisBBM: 'kayu',
        jumlahKayu: 0,
        jumlahOli: 0,
        jumlahBan: 0,
        waktuPemilahanMulai: '08:00',
        waktuPemilahanSelesai: '12:00',
        waktuPembakaranMulai: '09:00',
        waktuPembakaranSelesai: '14:00',
        statusOperasi: 'normal',
        catatanKerusakan: '',
        tindakanPerbaikan: '',
        tindakanPerawatan: '',
        fotoIncinerator: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reports table state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState<Tps3rReportItem | null>(null);
    const pageSize = 10;

    // Gallery modal state
    const [selectedImage, setSelectedImage] = useState<Tps3rReportItem | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchTps3rData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/tps3r', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setOperationalHours(data.operationalHours || []);
                setFuelData(data.fuelData || []);
                setMaintenanceData(data.maintenanceData || []);
                setReadinessStats(data.readinessStats);
                setRecentWorkers(data.recentWorkers || []);
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error('Error loading TPS3R data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTps3rData();
    }, []);

    const handleSwitchTab = (tab: Tps3rTab) => {
        setActiveTab(tab);
        if (pathname !== '/dashboard/tps3r') {
            router.push(`/dashboard/tps3r?tab=${tab}`);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showToast('error', 'Hanya file JPEG, PNG, atau WebP yang diizinkan');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'Ukuran file maksimal 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setPhotoPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);

            const res = await fetch('/api/tps3r/upload', {
                method: 'POST',
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Upload gagal');
            }

            setFormData((prev) => ({ ...prev, fotoIncinerator: data.url }));
            showToast('success', 'Foto dokumentasi berhasil diupload');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('error', 'Gagal mengupload foto');
            setPhotoPreview('');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoPreview('');
        setFormData((prev) => ({ ...prev, fotoIncinerator: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.namaOperator || formData.namaOperator.trim().length < 2) {
            showToast('error', 'Nama operator minimal 2 karakter');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/tps3r', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast('success', 'Laporan harian TPS3R berhasil disimpan!');
                setFormData({
                    tanggal: todayIso,
                    namaOperator: '',
                    jumlahPekerja: 1,
                    jenisSampah: 'organik',
                    beratSampahMasuk: 0,
                    beratAmpasSetelahPilahan: 0,
                    beratPlastikSetelahPilahan: 0,
                    beratSampahDibakar: 0,
                    jenisBBM: 'kayu',
                    jumlahKayu: 0,
                    jumlahOli: 0,
                    jumlahBan: 0,
                    waktuPemilahanMulai: '08:00',
                    waktuPemilahanSelesai: '12:00',
                    waktuPembakaranMulai: '09:00',
                    waktuPembakaranSelesai: '14:00',
                    statusOperasi: 'normal',
                    catatanKerusakan: '',
                    tindakanPerbaikan: '',
                    tindakanPerawatan: '',
                    fotoIncinerator: '',
                });
                setPhotoPreview('');
                await fetchTps3rData();
                setActiveTab('dashboard');
            } else {
                showToast('error', data.error || 'Gagal menyimpan laporan');
            }
        } catch (error) {
            console.error('Submit error:', error);
            showToast('error', 'Terjadi kesalahan sistem saat menyimpan laporan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReport = async (id: string) => {
        if (!confirm('Hapus laporan harian TPS3R ini?')) return;
        try {
            const res = await fetch(`/api/tps3r?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('success', 'Laporan berhasil dihapus');
                await fetchTps3rData();
            } else {
                showToast('error', data.error || 'Gagal menghapus laporan');
            }
        } catch {
            showToast('error', 'Gagal menghapus laporan');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'kendala':
                return 'Ada Kendala';
            case 'perawatan':
                return 'Dalam Perawatan';
            default:
                return 'Normal';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'kendala':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'perawatan':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    // Chart helpers
    const maxHours = Math.max(
        ...operationalHours.map((d) => Math.max(d.pemilahanHours, d.pembakaranHours)),
        1
    );

    const fuelTotals = fuelData.reduce(
        (acc, d) => ({
            kayu: acc.kayu + d.kayu,
            oli: acc.oli + d.oli,
            ban: acc.ban + d.ban,
        }),
        { kayu: 0, oli: 0, ban: 0 }
    );
    const maxFuelTotal = Math.max(...fuelData.map((d) => d.kayu + d.oli + d.ban), 1);

    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset =
        circumference - (readinessStats.readinessPercentage / 100) * circumference;
    const readinessColor =
        readinessStats.readinessPercentage >= 80
            ? 'text-emerald-500'
            : readinessStats.readinessPercentage >= 60
            ? 'text-amber-500'
            : 'text-red-500';

    // Filtered reports & pagination
    const filteredReports = reports.filter((r) => {
        const matchSearch =
            r.namaOperator.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.jenisSampah.toLowerCase().includes(searchQuery.toLowerCase()) ||
            new Date(r.tanggal).toLocaleDateString('id-ID').includes(searchQuery);
        const matchStatus = statusFilter === 'all' || r.statusOperasi === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Gallery photos
    const galleryItems = reports.filter((r) => r.fotoIncinerator && r.fotoIncinerator.trim() !== '');

    return (
        <div className="space-y-6">
            <ReadOnlyBanner />

            {/* Toast Notification */}
            {notification && (
                <div
                    className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all ${
                        notification.type === 'success'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-red-600 text-white border-red-500'
                    }`}
                >
                    <span className="font-semibold text-sm">{notification.message}</span>
                    <button
                        onClick={() => setNotification(null)}
                        className="text-white/80 hover:text-white text-xs font-bold ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Top Header & Sub-Menu Navigation Bar */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="relative h-12 w-12 rounded-2xl overflow-hidden shadow-sm ring-2 ring-orange-100 bg-orange-50 flex items-center justify-center shrink-0">
                        <img
                            src="/tps3r-logo.png"
                            alt="TPS3R Logo"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-linear-to-r from-orange-500 via-amber-500 to-green-500 bg-clip-text text-transparent tracking-tight">
                            TPS3R
                        </h1>
                        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                            DLHK Kota Pekanbaru • Sistem Operasional & Incinerator
                        </p>
                    </div>
                </div>

                {/* Sub-Navigation Pills (Matching all 4 menus of TPS3R App) */}
                <div className="flex flex-wrap items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => handleSwitchTab('dashboard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === 'dashboard'
                                ? 'bg-white text-orange-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Dashboard</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSwitchTab('input')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === 'input'
                                ? 'bg-white text-orange-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Input Data Harian</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSwitchTab('reports')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === 'reports'
                                ? 'bg-white text-orange-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Laporan ({reports.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSwitchTab('gallery')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            activeTab === 'gallery'
                                ? 'bg-white text-orange-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Galeri Foto ({galleryItems.length})</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[360px] bg-white rounded-3xl shadow-xs">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-3 text-sm text-gray-500">Memuat data operasional TPS3R...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* =====================================================================
                        TAB 1: DASHBOARD TPS3R
                    ===================================================================== */}
                    {activeTab === 'dashboard' && (
                        <div className="flex flex-col gap-6">
                            {/* Top Banner */}
                            <div className="w-full rounded-[2rem] bg-[#FDECDC] p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between min-h-[170px]">
                                <div className="z-10 max-w-xl space-y-2">
                                    <h2 className="text-3xl font-bold text-orange-500 tracking-tight">
                                        Halo, Admin TPS3R!
                                    </h2>
                                    <p className="text-gray-600 font-medium">
                                        {stats.totalReportsToday > 0
                                            ? `${stats.totalReportsToday} laporan sudah masuk hari ini.`
                                            : 'Belum ada laporan hari ini.'}
                                    </p>
                                    <div className="flex items-center gap-6 mt-3 flex-wrap">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <span className="text-orange-500 text-lg">🗑️</span>
                                            <span className="font-bold text-lg">{stats.todaySampahMasuk} Kg</span>
                                            <span className="text-sm">Sampah Masuk</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <span className="text-red-500 text-lg">🔥</span>
                                            <span className="font-bold text-lg">{stats.todaySampahDibakar} Kg</span>
                                            <span className="text-sm">Dibakar</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="z-10 mt-4 md:mt-0">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchTab('input')}
                                        className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl shadow-md transition-all cursor-pointer"
                                    >
                                        + Input Laporan Harian
                                    </button>
                                </div>
                                <div className="absolute right-0 bottom-0 h-48 w-48 bg-orange-200/50 rounded-full blur-3xl translate-y-12 translate-x-12 pointer-events-none" />
                                <div className="absolute top-0 right-20 h-24 w-24 bg-yellow-200/50 rounded-full blur-2xl -translate-y-8 pointer-events-none" />
                            </div>

                            {/* 4 Stats Cards Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Card 1: Laporan Hari Ini */}
                                <div className="bg-violet-500 text-white rounded-[2rem] p-6 flex flex-col justify-between h-36 shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold">{stats.totalReportsToday}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">Laporan Hari Ini</p>
                                        <button
                                            type="button"
                                            onClick={() => handleSwitchTab('input')}
                                            className="text-white/80 text-sm hover:text-white underline cursor-pointer"
                                        >
                                            Input Laporan Baru →
                                        </button>
                                    </div>
                                </div>

                                {/* Card 2: Sampah Masuk */}
                                <div className="bg-amber-400 text-white rounded-[2rem] p-6 flex flex-col justify-between h-36 shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold">{stats.todaySampahMasuk}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">Sampah Masuk (Kg)</p>
                                        <p className="text-white/85 text-sm">Rata-rata: {stats.weeklyAvgSampah} Kg/hari</p>
                                    </div>
                                </div>

                                {/* Card 3: Status Incinerator */}
                                <div className="bg-orange-400 text-white rounded-[2rem] p-6 flex flex-col justify-between h-36 shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                            </svg>
                                        </div>
                                        <span className="text-xl font-bold">
                                            {stats.latestStatus === 'normal' ? '✓' : stats.latestStatus === 'kendala' ? '⚠' : '🔧'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">Incinerator</p>
                                        <p className="text-white/85 text-sm capitalize">{getStatusText(stats.latestStatus)}</p>
                                    </div>
                                </div>

                                {/* Card 4: Pekerja */}
                                <div className="bg-cyan-400 text-white rounded-[2rem] p-6 flex flex-col justify-between h-36 shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold">{stats.totalWorkers}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">Pekerja Hari Ini</p>
                                        <p className="text-white/85 text-sm">{recentWorkers.length} operator aktif minggu ini</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Operational Hours Chart */}
                                <div className="bg-white rounded-[2rem] p-6 shadow-xs">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        📊 Jam Operasional (7 Hari Terakhir)
                                    </h3>
                                    <div className="flex items-center gap-4 mb-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-violet-500" />
                                            <span className="text-gray-500">Pemilahan</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                                            <span className="text-gray-500">Pembakaran</span>
                                        </div>
                                    </div>
                                    <div className="h-48 flex items-end justify-between gap-2">
                                        {operationalHours.map((item, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full flex gap-1 items-end h-40">
                                                    <div
                                                        className="flex-1 bg-violet-500 rounded-t-lg transition-all duration-300 hover:bg-violet-600"
                                                        style={{
                                                            height: `${(item.pemilahanHours / maxHours) * 100}%`,
                                                            minHeight: item.pemilahanHours > 0 ? '4px' : '0px',
                                                        }}
                                                        title={`Pemilahan: ${item.pemilahanHours} jam`}
                                                    />
                                                    <div
                                                        className="flex-1 bg-orange-500 rounded-t-lg transition-all duration-300 hover:bg-orange-600"
                                                        style={{
                                                            height: `${(item.pembakaranHours / maxHours) * 100}%`,
                                                            minHeight: item.pembakaranHours > 0 ? '4px' : '0px',
                                                        }}
                                                        title={`Pembakaran: ${item.pembakaranHours} jam`}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">{item.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fuel Consumption Chart */}
                                <div className="bg-white rounded-[2rem] p-6 shadow-xs">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        ⛽ Konsumsi Bahan Bakar
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="text-center p-2 bg-amber-50 rounded-xl">
                                            <div className="text-lg font-bold text-amber-700">{fuelTotals.kayu.toFixed(1)}</div>
                                            <div className="text-xs text-amber-600">Kayu (kg)</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-100 rounded-xl">
                                            <div className="text-lg font-bold text-gray-700">{fuelTotals.oli.toFixed(1)}</div>
                                            <div className="text-xs text-gray-600">Oli (L)</div>
                                        </div>
                                        <div className="text-center p-2 bg-slate-100 rounded-xl">
                                            <div className="text-lg font-bold text-slate-700">{fuelTotals.ban.toFixed(1)}</div>
                                            <div className="text-xs text-slate-600">Ban (pcs)</div>
                                        </div>
                                    </div>
                                    <div className="h-32 flex items-end justify-between gap-2">
                                        {fuelData.map((item, i) => {
                                            const total = item.kayu + item.oli + item.ban;
                                            const heightPercent = (total / maxFuelTotal) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <div
                                                        className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse"
                                                        style={{
                                                            height: `${heightPercent}%`,
                                                            minHeight: total > 0 ? '4px' : '0',
                                                        }}
                                                    >
                                                        {item.kayu > 0 && (
                                                            <div
                                                                className="w-full bg-amber-500"
                                                                style={{ flex: item.kayu }}
                                                                title={`Kayu: ${item.kayu} kg`}
                                                            />
                                                        )}
                                                        {item.oli > 0 && (
                                                            <div
                                                                className="w-full bg-gray-500"
                                                                style={{ flex: item.oli }}
                                                                title={`Oli: ${item.oli} L`}
                                                            />
                                                        )}
                                                        {item.ban > 0 && (
                                                            <div
                                                                className="w-full bg-slate-700"
                                                                style={{ flex: item.ban }}
                                                                title={`Ban: ${item.ban} pcs`}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-medium">{item.date}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span>Kayu</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                                            <span>Oli</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                                            <span>Ban</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Readiness Gauge, Maintenance List, & Team */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Readiness Gauge */}
                                <div className="bg-white rounded-[2rem] p-6 shadow-xs">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        ✅ Kesiapan Alat & Operasional
                                    </h3>
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="relative w-32 h-32 shrink-0">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    className="text-gray-200"
                                                />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    strokeLinecap="round"
                                                    className={readinessColor}
                                                    style={{
                                                        strokeDasharray: circumference,
                                                        strokeDashoffset,
                                                        transition: 'stroke-dashoffset 0.5s ease-in-out',
                                                    }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-bold ${readinessColor}`}>
                                                    {readinessStats.readinessPercentage}%
                                                </span>
                                                <span className="text-xs text-gray-500">Kesiapan</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                <span>
                                                    Normal: <strong>{readinessStats.normalDays}</strong> laporan
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                                <span>
                                                    Kendala: <strong>{readinessStats.kendalaDays}</strong> laporan
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                <span>
                                                    Perawatan: <strong>{readinessStats.perawatanDays}</strong> laporan
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                                Data 30 hari terakhir ({readinessStats.totalDays} laporan)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Maintenance History */}
                                <div className="bg-white rounded-[2rem] p-6 shadow-xs">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        🔧 Riwayat Kendala & Perawatan
                                    </h3>
                                    {maintenanceData.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <p className="text-sm">Tidak ada kendala atau perawatan tercatat</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                                            {maintenanceData.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span
                                                            className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize border ${getStatusBadgeClass(
                                                                item.statusOperasi
                                                            )}`}
                                                        >
                                                            {item.statusOperasi}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(item.tanggal).toLocaleDateString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                    {item.catatanKerusakan && (
                                                        <p className="text-xs text-gray-700 mt-1">{item.catatanKerusakan}</p>
                                                    )}
                                                    {item.tindakanPerbaikan && (
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            <strong>Perbaikan:</strong> {item.tindakanPerbaikan}
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        Operator: {item.namaOperator}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Team Bertugas */}
                                <div className="bg-white rounded-[2rem] p-6 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-800">👷 Tim Bertugas</h3>
                                            <button
                                                type="button"
                                                onClick={() => handleSwitchTab('reports')}
                                                className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
                                            >
                                                Lihat Semua →
                                            </button>
                                        </div>
                                        {recentWorkers.length === 0 ? (
                                            <p className="text-center text-gray-400 text-sm py-8">
                                                Belum ada data operator
                                            </p>
                                        ) : (
                                            <div className="space-y-3.5">
                                                {recentWorkers.map((worker, index) => (
                                                    <div key={index} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex items-center justify-center">
                                                                {worker.name
                                                                    .split(' ')
                                                                    .map((n) => n[0])
                                                                    .join('')
                                                                    .substring(0, 2)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-gray-800">{worker.name}</p>
                                                                <p className="text-xs text-gray-500">{worker.role}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(worker.date).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                            })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchTab('reports')}
                                        className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
                                    >
                                        Lihat Semua Laporan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =====================================================================
                        TAB 2: INPUT DATA HARIAN
                    ===================================================================== */}
                    {activeTab === 'input' && (
                        <form onSubmit={handleSubmitReport} className="space-y-6">
                            {/* Identitas & Waktu */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Identitas & Waktu</h3>
                                <div className="grid gap-5 md:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Tanggal Laporan
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.tanggal}
                                            max={todayIso}
                                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Nama Operator
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nama Operator..."
                                            value={formData.namaOperator}
                                            onChange={(e) => setFormData({ ...formData, namaOperator: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Jumlah Pekerja
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={formData.jumlahPekerja}
                                            onChange={(e) =>
                                                setFormData({ ...formData, jumlahPekerja: Number(e.target.value) })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Data Sampah & Pemilahan */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Data Sampah & Pemilahan</h3>
                                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Jenis Sampah
                                        </label>
                                        <select
                                            value={formData.jenisSampah}
                                            onChange={(e) => setFormData({ ...formData, jenisSampah: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                                        >
                                            <option value="organik">Organik</option>
                                            <option value="anorganik">Anorganik</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Berat Sampah Masuk (Kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            value={formData.beratSampahMasuk}
                                            onChange={(e) =>
                                                setFormData({ ...formData, beratSampahMasuk: Number(e.target.value) })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Berat Ampas Setelah Pilahan (Kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            value={formData.beratAmpasSetelahPilahan}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    beratAmpasSetelahPilahan: Number(e.target.value),
                                                })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Berat Plastik Setelah Pilahan (Kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            value={formData.beratPlastikSetelahPilahan}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    beratPlastikSetelahPilahan: Number(e.target.value),
                                                })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Sampah Dibakar (Kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            value={formData.beratSampahDibakar}
                                            onChange={(e) =>
                                                setFormData({ ...formData, beratSampahDibakar: Number(e.target.value) })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bahan Bakar & Waktu Operasional */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Bahan Bakar & Waktu Operasional
                                </h3>
                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* Fuel Inputs */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm text-gray-500">Bahan Bakar</h4>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Jenis Bahan Bakar Utama
                                            </label>
                                            <select
                                                value={formData.jenisBBM}
                                                onChange={(e) => setFormData({ ...formData, jenisBBM: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                                            >
                                                <option value="kayu">Kayu</option>
                                                <option value="oli">Oli</option>
                                                <option value="ban">Ban</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Kayu (Ikat/Kg)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.1"
                                                    value={formData.jumlahKayu}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, jumlahKayu: Number(e.target.value) })
                                                    }
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Oli (Liter)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.1"
                                                    value={formData.jumlahOli}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, jumlahOli: Number(e.target.value) })
                                                    }
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Ban (Pcs)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="1"
                                                    value={formData.jumlahBan}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, jumlahBan: Number(e.target.value) })
                                                    }
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Inputs */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm text-gray-500">Jam Operasional</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Mulai Pilah
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.waktuPemilahanMulai}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, waktuPemilahanMulai: e.target.value })
                                                    }
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Selesai Pilah
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.waktuPemilahanSelesai}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            waktuPemilahanSelesai: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Mulai Bakar
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.waktuPembakaranMulai}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            waktuPembakaranMulai: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Selesai Bakar
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.waktuPembakaranSelesai}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            waktuPembakaranSelesai: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kondisi Incinerator */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Kondisi Incinerator</h3>
                                <div className="grid gap-5 md:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Status Operasi
                                        </label>
                                        <select
                                            value={formData.statusOperasi}
                                            onChange={(e) =>
                                                setFormData({ ...formData, statusOperasi: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="kendala">Kendala</option>
                                            <option value="perawatan">Dalam Perawatan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Catatan Kerusakan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Jika ada kerusakan..."
                                            value={formData.catatanKerusakan}
                                            onChange={(e) =>
                                                setFormData({ ...formData, catatanKerusakan: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Tindakan Perbaikan / Perawatan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Tindakan yang dilakukan..."
                                            value={formData.tindakanPerbaikan}
                                            onChange={(e) =>
                                                setFormData({ ...formData, tindakanPerbaikan: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dokumentasi Foto Incinerator */}
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    📷 Dokumentasi Foto Incinerator
                                </h3>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="tps3r-photo-upload"
                                />
                                {photoPreview ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-w-md">
                                        <img
                                            src={photoPreview}
                                            alt="Preview"
                                            className="w-full h-56 object-cover"
                                        />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                            </div>
                                        )}
                                        {!isUploading && (
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shadow-md hover:bg-red-700 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="tps3r-photo-upload"
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className="p-3 bg-orange-100 rounded-full mb-3 text-orange-500">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <p className="mb-1 text-sm font-semibold text-gray-700">
                                                Klik untuk upload foto alat incinerator
                                            </p>
                                            <p className="text-xs text-gray-500">JPEG, PNG atau WebP (maks. 5MB)</p>
                                        </div>
                                    </label>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSwitchTab('dashboard')}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isUploading}
                                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    {isSubmitting ? 'Menyimpan...' : '💾 Simpan Laporan'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* =====================================================================
                        TAB 3: LAPORAN HARIAN
                    ===================================================================== */}
                    {activeTab === 'reports' && (
                        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Laporan Harian TPS3R</h3>
                                    <p className="text-sm text-gray-500">
                                        Daftar laporan harian operasional dan incinerator yang telah masuk.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="Cari operator / tanggal..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="normal">Normal</option>
                                        <option value="kendala">Kendala</option>
                                        <option value="perawatan">Perawatan</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchTab('input')}
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
                                    >
                                        + Input Baru
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="py-3.5 px-4">Tanggal</th>
                                            <th className="py-3.5 px-4">Operator</th>
                                            <th className="py-3.5 px-4">Pekerja</th>
                                            <th className="py-3.5 px-4">Jenis Sampah</th>
                                            <th className="py-3.5 px-4">Masuk (Kg)</th>
                                            <th className="py-3.5 px-4">Dibakar (Kg)</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedReports.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-gray-400">
                                                    Belum ada data laporan harian TPS3R.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedReports.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="py-3 px-4 font-medium text-gray-800">
                                                        {new Date(row.tanggal).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4">{row.namaOperator}</td>
                                                    <td className="py-3 px-4">{row.jumlahPekerja} org</td>
                                                    <td className="py-3 px-4 capitalize">{row.jenisSampah}</td>
                                                    <td className="py-3 px-4 font-semibold">{row.beratSampahMasuk}</td>
                                                    <td className="py-3 px-4 font-semibold text-orange-600">
                                                        {row.beratSampahDibakar}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize border ${getStatusBadgeClass(
                                                                row.statusOperasi
                                                            )}`}
                                                        >
                                                            {row.statusOperasi}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedReport(row)}
                                                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                                                        >
                                                            Detail
                                                        </button>
                                                        {isSuperAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteReport(row.id)}
                                                                className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                                                            >
                                                                Hapus
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-gray-500">
                                    Menampilkan {paginatedReports.length} dari {filteredReports.length} laporan
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs font-semibold text-gray-600">
                                        Hal {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =====================================================================
                        TAB 4: GALERI FOTO
                    ===================================================================== */}
                    {activeTab === 'gallery' && (
                        <div className="space-y-5">
                            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800">Galeri Dokumentasi</h3>
                                <p className="text-sm text-gray-500">
                                    Kumpulan foto dokumentasi incinerator dari laporan harian TPS3R.
                                </p>
                            </div>

                            {galleryItems.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                                    <svg className="h-12 w-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-medium">Belum ada foto dokumentasi</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {galleryItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedImage(item)}
                                            className="bg-white rounded-3xl overflow-hidden shadow-xs border border-gray-100 cursor-pointer group hover:shadow-md transition-all"
                                        >
                                            <div className="aspect-video relative bg-gray-100 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={item.fotoIncinerator || ''}
                                                    alt={`Dokumentasi ${new Date(item.tanggal).toLocaleDateString('id-ID')}`}
                                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">
                                                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                                                            weekday: 'long',
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Operator: {item.namaOperator}</p>
                                                </div>
                                                <span
                                                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize border ${getStatusBadgeClass(
                                                        item.statusOperasi
                                                    )}`}
                                                >
                                                    {item.statusOperasi}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal Detail Laporan */}
            {selectedReport && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setSelectedReport(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">Detail Laporan Harian TPS3R</h4>
                                <p className="text-xs text-gray-500">
                                    {new Date(selectedReport.tanggal).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500 block">Operator</span>
                                <span className="font-bold text-gray-800">{selectedReport.namaOperator}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500 block">Jumlah Pekerja</span>
                                <span className="font-bold text-gray-800">{selectedReport.jumlahPekerja} Orang</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500 block">Sampah Masuk</span>
                                <span className="font-bold text-gray-800">{selectedReport.beratSampahMasuk} Kg</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500 block">Sampah Dibakar</span>
                                <span className="font-bold text-orange-600">{selectedReport.beratSampahDibakar} Kg</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500 block">Ampas / Plastik</span>
                                <span className="font-bold text-gray-800">
                                    {selectedReport.beratAmpasSetelahPilahan} Kg / {selectedReport.beratPlastikSetelahPilahan} Kg
                                </span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500 block">Bahan Bakar ({selectedReport.jenisBBM})</span>
                                <span className="font-bold text-gray-800">
                                    Kayu: {selectedReport.jumlahKayu || 0} | Oli: {selectedReport.jumlahOli || 0} | Ban: {selectedReport.jumlahBan || 0}
                                </span>
                            </div>
                        </div>

                        {(selectedReport.catatanKerusakan || selectedReport.tindakanPerbaikan) && (
                            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-sm space-y-1">
                                {selectedReport.catatanKerusakan && (
                                    <p>
                                        <strong>Catatan Kerusakan:</strong> {selectedReport.catatanKerusakan}
                                    </p>
                                )}
                                {selectedReport.tindakanPerbaikan && (
                                    <p>
                                        <strong>Tindakan:</strong> {selectedReport.tindakanPerbaikan}
                                    </p>
                                )}
                            </div>
                        )}

                        {selectedReport.fotoIncinerator && (
                            <div className="rounded-2xl overflow-hidden border border-gray-200">
                                <img
                                    src={selectedReport.fotoIncinerator}
                                    alt="Dokumentasi Incinerator"
                                    className="w-full max-h-64 object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Zoom Foto Galeri */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage.fotoIncinerator || ''}
                            alt="Foto Incinerator"
                            className="w-full max-h-[70vh] object-contain bg-black"
                        />
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-800">
                                    {new Date(selectedImage.tanggal).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                                <p className="text-xs text-gray-500">Operator: {selectedImage.namaOperator}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
