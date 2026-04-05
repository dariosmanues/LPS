'use client';

import { useState, useEffect } from 'react';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatPanel } from '@/components/dashboard/StatPanel';
import { GlassCard, StatCard } from '@/components/ui';
import { MonthlyWasteChart } from '@/components/dashboard/MonthlyWasteChart';

interface TransdepoStats {
    totalKg: number;
    tripCount: number;
    lpsStats: {
        name: string;
        totalKg: number;
        tripCount: number;
    }[];
}

interface WasteStats {
    totalKg: number;
    tripCount: number;
    uniqueArmada: number;
    harapanJaya: TransdepoStats;
    airHitam: TransdepoStats;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<WasteStats>({
        totalKg: 0,
        tripCount: 0,
        uniqueArmada: 0,
        harapanJaya: { totalKg: 0, tripCount: 0, lpsStats: [] },
        airHitam: { totalKg: 0, tripCount: 0, lpsStats: [] },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/waste-stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleReset = async (type: 'today' | 'all') => {
        if (!confirm(type === 'today'
            ? 'Reset semua data sampah hari ini?'
            : 'PERINGATAN: Hapus SEMUA data sampah? Tindakan ini tidak dapat dibatalkan!'
        )) return;

        setResetting(true);
        try {
            const res = await fetch(`/api/waste-logs/reset?type=${type}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                // Refresh stats
                const statsRes = await fetch('/api/waste-stats');
                if (statsRes.ok) {
                    const newStats = await statsRes.json();
                    setStats(newStats);
                }
            } else {
                alert('Gagal reset data');
            }
        } catch (error) {
            console.error('Error resetting:', error);
            alert('Terjadi kesalahan');
        } finally {
            setResetting(false);
            setShowResetModal(false);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('id-ID');
    };

    // Calculate dial percentage (target: 20,000 kg)
    const TARGET_KG = 750000;
    const dialPercentage = Math.min((stats.totalKg / TARGET_KG) * 100, 100);
    const dialDasharray = Math.round((dialPercentage / 100) * 450);

    return (
        <div className="flex flex-col xl:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-auto">
                        <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari..."
                            className="w-full sm:w-[300px] bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                A
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-gray-700">Admin</p>
                                <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Welcome Banner */}
                <WelcomeBanner
                    userName="Admin"
                    message="Selamat datang! Kualitas udara baik dan cuaca cerah, cocok untuk operasi pengumpulan sampah."
                    stats={{
                        temperature: "+32°C",
                        weather: "Cerah berawan"
                    }}
                />

                {/* Transdepo Harapan Jaya Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            Transdepo Harapan Jaya
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                                {formatNumber(stats.harapanJaya.totalKg)} kg
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                8 Kecamatan
                            </span>
                        </div>
                    </div>
                    {/* LPS Detail */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.harapanJaya.lpsStats.map((lps, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-xs">
                                        {lps.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{lps.name}</p>
                                        <p className="text-xs text-gray-500">{lps.tripCount} trip</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-gray-700">{formatNumber(lps.totalKg)} kg</span>
                            </div>
                        ))}
                        {stats.harapanJaya.lpsStats.length === 0 && (
                            <div className="col-span-full text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-xl">
                                Belum ada data hari ini
                            </div>
                        )}
                    </div>
                </div>

                {/* Transdepo Air Hitam Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                            Transdepo Air Hitam
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                                {formatNumber(stats.airHitam.totalKg)} kg
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                7 Kecamatan
                            </span>
                        </div>
                    </div>
                    {/* LPS Detail */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.airHitam.lpsStats.map((lps, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">
                                        {lps.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{lps.name}</p>
                                        <p className="text-xs text-gray-500">{lps.tripCount} trip</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-gray-700">{formatNumber(lps.totalKg)} kg</span>
                            </div>
                        ))}
                        {stats.airHitam.lpsStats.length === 0 && (
                            <div className="col-span-full text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-xl">
                                Belum ada data hari ini
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <GlassCard className="p-4 sm:p-6" hover={false}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-800">Total Sampah Hari Ini</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Reset Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowResetModal(!showResetModal)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                    disabled={resetting}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Reset
                                </button>
                                {showResetModal && (
                                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-10 min-w-[180px]">
                                        <button
                                            onClick={() => handleReset('today')}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                            disabled={resetting}
                                        >
                                            Reset Hari Ini
                                        </button>
                                        <button
                                            onClick={() => handleReset('all')}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                            disabled={resetting}
                                        >
                                            Reset Semua Data
                                        </button>
                                    </div>
                                )}
                            </div>
                            <span className="text-sm text-green-600 font-medium">AKTIF</span>
                            <div className="w-10 h-5 bg-purple-600 rounded-full relative">
                                <div className="absolute w-4 h-4 bg-white rounded-full top-0.5 right-0.5 shadow"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Left Controls */}
                        <div className="hidden sm:flex flex-col items-center gap-2">
                            <span className="text-sm text-gray-500">Min</span>
                            <span className="text-lg font-medium text-gray-700">0 kg</span>
                        </div>

                        {/* Dial */}
                        <div className="temp-dial mx-auto sm:mx-0">
                            <div className="temp-dial-inner">
                                {loading ? (
                                    <div className="animate-pulse">
                                        <span className="temp-value text-2xl sm:text-3xl text-gray-300">---</span>
                                    </div>
                                ) : (
                                    <span className="temp-value text-2xl sm:text-3xl">{formatNumber(stats.totalKg)}</span>
                                )}
                                <span className="text-gray-500 text-xs sm:text-sm">Kilogram</span>
                            </div>
                            {/* Dial arc indicator */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="95"
                                    fill="none"
                                    stroke="#F3F4F6"
                                    strokeWidth="6"
                                    strokeDasharray="450 600"
                                    strokeLinecap="round"
                                    transform="rotate(135 100 100)"
                                />
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="95"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="6"
                                    strokeDasharray={`${dialDasharray} 600`}
                                    strokeLinecap="round"
                                    transform="rotate(135 100 100)"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#7C3AED" />
                                        <stop offset="100%" stopColor="#F97316" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Right Controls */}
                        <div className="hidden sm:flex flex-col items-center gap-2">
                            <span className="text-sm text-gray-500">Target</span>
                            <span className="text-lg font-medium text-orange-500">{formatNumber(TARGET_KG)} kg</span>
                        </div>
                    </div>

                    {/* Mobile Min/Target */}
                    <div className="flex sm:hidden justify-between mt-4 text-center">
                        <div>
                            <span className="text-xs text-gray-500 block">Min</span>
                            <span className="text-sm font-medium text-gray-700">0 kg</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">Target</span>
                            <span className="text-sm font-medium text-orange-500">{formatNumber(TARGET_KG)} kg</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                        title="Total Sampah"
                        value={loading ? "..." : `${formatNumber(stats.totalKg)} kg`}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        }
                        trend={stats.tripCount > 0 ? { value: Math.round((stats.totalKg / TARGET_KG) * 100), isPositive: true } : undefined}
                        color="blue"
                    />
                    <StatCard
                        title="Armada Aktif"
                        value={loading ? "..." : String(stats.uniqueArmada)}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        }
                        color="purple"
                    />
                    <StatCard
                        title="Total Kecamatan"
                        value="15"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                        }
                        color="green"
                    />
                    <StatCard
                        title="Transaksi Hari Ini"
                        value={loading ? "..." : String(stats.tripCount)}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                        trend={stats.tripCount > 0 ? { value: stats.tripCount, isPositive: true } : undefined}
                        color="orange"
                    />
                </div>

                {/* Monthly Analysis Chart */}
                <MonthlyWasteChart />
            </div>

            {/* Right Sidebar - visible on xl screens */}
            <div className="xl:w-80 xl:shrink-0">
                <StatPanel title="Status Armada" />
            </div>
        </div>
    );
}

