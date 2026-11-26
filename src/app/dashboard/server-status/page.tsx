'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui';

const EXCLUSIVE_EMAIL = 'fikri@lps.pekanbaru.go.id';

interface HardwareInfo {
    uptimeSeconds: number;
    uptimeFormatted: string;
    cpuModel: string;
    cpuCores: number;
    loadAvg1m: number;
    loadAvg5m: number;
    loadAvg15m: number;
    cpuLoadPercent: number;
    ramTotalMB: number;
    ramTotalGB: number;
    ramUsedMB: number;
    ramFreeMB: number;
    ramAvailableMB: number;
    ramAvailableGB: number;
    ramBuffCacheMB: number;
    ramUsagePercent: number;
    swapTotalMB: number;
    swapTotalGB: number;
    swapUsedMB: number;
    swapFreeMB: number;
    swapUsagePercent: number;
    disk: {
        filesystem: string;
        mount: string;
        totalGB: number;
        usedGB: number;
        availGB: number;
        usagePercent: number;
    };
    services: {
        nginx: string;
        postgresql: string;
    };
}

interface Pm2ServiceInfo {
    id: number;
    name: string;
    label: string;
    port: number;
    domain: string;
    pm2Status: string;
    pid: number;
    cpuPercent: number;
    memMB: number;
    uptimeFormatted: string;
    restarts: number;
    httpStatus: number;
    latencyMs: number;
    healthy: boolean;
}

interface DatabaseHealthInfo {
    name: string;
    location: string;
    status: string;
    quotaNote: string;
    latencyMs: number;
    sizePretty: string;
    summaryItems: string[];
}

interface ServerStatusPayload {
    success: boolean;
    checkedAt: string;
    vpsIp: string;
    hardware: HardwareInfo;
    pm2Services: Pm2ServiceInfo[];
    databases: DatabaseHealthInfo[];
}

function formatWibTime(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return (
        d.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }) + ' WIB'
    );
}

export default function ExclusiveServerStatusPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [data, setData] = useState<ServerStatusPayload | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

    const isAuthorizedFikri =
        status === 'authenticated' &&
        (session?.user?.email || '').toLowerCase().trim() === EXCLUSIVE_EMAIL;

    useEffect(() => {
        if (status === 'authenticated' && !isAuthorizedFikri) {
            router.replace('/dashboard');
        }
    }, [status, isAuthorizedFikri, router]);

    const fetchServerStatus = useCallback(async () => {
        if (!isAuthorizedFikri) return;
        try {
            setRefreshing(true);
            const res = await fetch('/api/server-status', { cache: 'no-store' });
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (err) {
            console.error('Error loading server status:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthorizedFikri]);

    useEffect(() => {
        if (!isAuthorizedFikri) return;
        fetchServerStatus();
    }, [isAuthorizedFikri, fetchServerStatus]);

    useEffect(() => {
        if (!isAuthorizedFikri || !autoRefresh) return;
        const timer = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            fetchServerStatus();
        }, 15000);
        return () => clearInterval(timer);
    }, [isAuthorizedFikri, autoRefresh, fetchServerStatus]);

    if (status === 'loading') {
        return (
            <div className="p-12 text-center text-gray-500 font-semibold">
                Memverifikasi otorisasi khusus...
            </div>
        );
    }

    if (!isAuthorizedFikri) {
        return null;
    }

    const hw = data?.hardware;
    const pm2List = data?.pm2Services || [];
    const dbList = data?.databases || [];

    return (
        <div className="space-y-6">
            {/* Exclusive Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-emerald-950 to-teal-950 p-6 md:p-8 shadow-xl text-white border border-emerald-500/30">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400 text-emerald-950 shadow-xs">
                                🔒 AKSES EKSKLUSIF: fikri@lps.pekanbaru.go.id
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-emerald-200 border border-white/20">
                                VPS: {data?.vpsIp || '177.202.246.42'} • READ-ONLY MONITOR
                            </span>
                            {data?.checkedAt && (
                                <span className="px-3 py-1 rounded-full text-xs font-mono bg-black/30 text-teal-200 border border-white/10">
                                    Update: {formatWibTime(data.checkedAt)}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                            Dashboard Status Server & Infrastruktur VPS
                        </h1>
                        <p className="text-emerald-100/90 text-sm mt-1.5 max-w-3xl">
                            Memantau kondisi <strong>Resource Hardware & OS (Uptime, CPU, RAM, Swap, Disk, Nginx, PostgreSQL)</strong>, <strong>Status 4 Layanan Aplikasi PM2</strong>, serta <strong>Kesehatan & Latency 3 Database</strong> secara real-time.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setAutoRefresh((v) => !v)}
                            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                                autoRefresh
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                    : 'bg-white/10 text-gray-300 border-white/20'
                            }`}
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'
                                }`}
                            />
                            {autoRefresh ? 'Live Auto-Refresh (15d)' : 'Auto-Refresh Mati'}
                        </button>
                        <button
                            type="button"
                            onClick={fetchServerStatus}
                            disabled={refreshing}
                            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-60"
                        >
                            {refreshing ? '⏳ Memperbarui...' : '🔄 Segarkan Status'}
                        </button>
                    </div>
                </div>
            </div>

            {loading && !data ? (
                <GlassCard className="p-12 text-center text-gray-500 font-semibold">
                    Memuat metrik real-time server VPS (177.202.246.42)...
                </GlassCard>
            ) : (
                <>
                    {/* Quick Visual Resource Cards */}
                    {hw && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GlassCard className="p-5 border border-emerald-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-gray-500 uppercase">
                                        Uptime Server VPS
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                        🟢 STABIL
                                    </span>
                                </div>
                                <p className="text-xl font-black text-gray-900 mt-2">
                                    {hw.uptimeFormatted}
                                </p>
                                <p className="text-xs text-emerald-700 font-semibold mt-1">
                                    Nginx: {hw.services.nginx} • PostgreSQL: {hw.services.postgresql}
                                </p>
                            </GlassCard>

                            <GlassCard className="p-5 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-gray-500 uppercase">
                                        CPU Load Average
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                                        ~{hw.cpuLoadPercent}% Beban
                                    </span>
                                </div>
                                <p className="text-xl font-black text-gray-900 mt-2 font-mono">
                                    {hw.loadAvg1m} / {hw.loadAvg5m} / {hw.loadAvg15m}
                                </p>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, Math.max(4, hw.cpuLoadPercent))}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1 truncate" title={hw.cpuModel}>
                                    {hw.cpuCores} Core • {hw.cpuModel}
                                </p>
                            </GlassCard>

                            <GlassCard className="p-5 border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-gray-500 uppercase">
                                        Penggunaan RAM
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                                        {hw.ramUsagePercent}% Terpakai
                                    </span>
                                </div>
                                <p className="text-xl font-black text-gray-900 mt-2 font-mono">
                                    {hw.ramUsedMB} MB{' '}
                                    <span className="text-sm font-semibold text-gray-500">
                                        / {hw.ramTotalGB} GB
                                    </span>
                                </p>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                                    <div
                                        className="h-full bg-purple-600 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, Math.max(4, hw.ramUsagePercent))}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Tersedia: <strong>{hw.ramAvailableGB} GB</strong> • Swap: {hw.swapUsedMB} MB / {hw.swapTotalGB} GB
                                </p>
                            </GlassCard>

                            <GlassCard className="p-5 border border-teal-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-gray-500 uppercase">
                                        Penyimpanan Disk ({hw.disk.mount})
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
                                        {hw.disk.usagePercent}% Terpakai
                                    </span>
                                </div>
                                <p className="text-xl font-black text-gray-900 mt-2 font-mono">
                                    {hw.disk.usedGB} GB{' '}
                                    <span className="text-sm font-semibold text-gray-500">
                                        / {hw.disk.totalGB} GB
                                    </span>
                                </p>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                                    <div
                                        className="h-full bg-teal-600 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, Math.max(4, hw.disk.usagePercent))}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Ruang Kosong: <strong>{hw.disk.availGB} GB</strong> ({hw.disk.filesystem})
                                </p>
                            </GlassCard>
                        </div>
                    )}

                    {/* SECTION 1: KONDISI RESOURCE SERVER (HARDWARE & OS) */}
                    {hw && (
                        <GlassCard className="p-0 overflow-hidden border border-gray-200" hover={false}>
                            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base font-extrabold">
                                        1. Kondisi Resource Server (Hardware & OS)
                                    </h2>
                                    <p className="text-xs text-slate-300">
                                        Metrik langsung dari kernel Linux VPS ({data?.vpsIp})
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                    🟢 100% Normal
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-gray-700">
                                    <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[11px] border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3.5">Parameter</th>
                                            <th className="px-5 py-3.5">Status Saat Ini</th>
                                            <th className="px-5 py-3.5">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        <tr className="hover:bg-emerald-50/30">
                                            <td className="px-5 py-3.5 font-extrabold text-gray-900">
                                                Uptime Server
                                            </td>
                                            <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                                                {hw.uptimeFormatted}
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-emerald-700">
                                                Stabil tanpa reboot
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-emerald-50/30">
                                            <td className="px-5 py-3.5 font-extrabold text-gray-900">
                                                CPU Load Average
                                            </td>
                                            <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                                                {hw.loadAvg1m} (1m) / {hw.loadAvg5m} (5m) / {hw.loadAvg15m} (15m)
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-blue-700">
                                                Sangat ringan (~{hw.cpuLoadPercent}% beban CPU dari {hw.cpuCores} Core)
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-emerald-50/30">
                                            <td className="px-5 py-3.5 font-extrabold text-gray-900">
                                                Penggunaan RAM
                                            </td>
                                            <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                                                {hw.ramUsedMB} MB terpakai dari {hw.ramTotalGB} GB ({hw.ramAvailableGB} GB tersedia)
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-purple-700">
                                                ~{hw.ramUsagePercent}% terpakai ({(100 - hw.ramUsagePercent).toFixed(1)}% masih lega)
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-emerald-50/30">
                                            <td className="px-5 py-3.5 font-extrabold text-gray-900">
                                                Swap Memory
                                            </td>
                                            <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                                                {hw.swapUsedMB} MB dari {hw.swapTotalGB} GB
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-600">
                                                Hampir tidak tersentuh ({hw.swapUsagePercent}%)
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-emerald-50/30">
                                            <td className="px-5 py-3.5 font-extrabold text-gray-900">
                                                Penyimpanan Disk ({hw.disk.mount})
                                            </td>
                                            <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                                                {hw.disk.usedGB} GB terpakai dari {hw.disk.totalGB} GB ({hw.disk.availGB} GB kosong)
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-teal-700">
                                                {hw.disk.usagePercent}% terpakai ({(100 - hw.disk.usagePercent).toFixed(1)}% masih kosong)
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-emerald-50/30">
                                            <td className="px-5 py-3.5 font-extrabold text-gray-900">
                                                Layanan Sistem
                                            </td>
                                            <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                                                Nginx: <span className="text-emerald-700">{hw.services.nginx}</span> | PostgreSQL:{' '}
                                                <span className="text-emerald-700">{hw.services.postgresql}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    🟢 100% Normal
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}

                    {/* SECTION 2: STATUS LAYANAN APLIKASI (PM2 PROCESS MANAGER) */}
                    <GlassCard className="p-0 overflow-hidden border border-gray-200" hover={false}>
                        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-base font-extrabold">
                                    2. Status Layanan Aplikasi (PM2 Process Manager)
                                </h2>
                                <p className="text-xs text-slate-300">
                                    Status real-time keempat layanan produksi beserta waktu respons HTTPS
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                {pm2List.filter((p) => p.pm2Status === 'ONLINE').length} / {pm2List.length} Layanan Online
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[11px] border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3.5 text-center">ID</th>
                                        <th className="px-4 py-3.5">Nama Layanan</th>
                                        <th className="px-4 py-3.5 text-center">Port</th>
                                        <th className="px-4 py-3.5">Domain HTTPS</th>
                                        <th className="px-4 py-3.5 text-center">Status PM2</th>
                                        <th className="px-4 py-3.5 text-center">CPU</th>
                                        <th className="px-4 py-3.5 text-center">RAM</th>
                                        <th className="px-4 py-3.5 text-center">Uptime Proses</th>
                                        <th className="px-4 py-3.5 text-center">Response Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {pm2List.map((srv) => (
                                        <tr key={srv.name} className="hover:bg-emerald-50/30">
                                            <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-800">
                                                {srv.id}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-extrabold text-gray-900 font-mono">
                                                    {srv.name}
                                                </p>
                                                <p className="text-[11px] text-gray-500">{srv.label}</p>
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono font-bold text-indigo-700">
                                                {srv.port}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <a
                                                    href={srv.domain}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-xs font-bold text-emerald-700 hover:underline"
                                                >
                                                    {srv.domain} ↗
                                                </a>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                                                        srv.pm2Status === 'ONLINE'
                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                            : 'bg-rose-100 text-rose-800 border-rose-200'
                                                    }`}
                                                >
                                                    {srv.pm2Status === 'ONLINE' ? '🟢 ONLINE' : `🔴 ${srv.pm2Status}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-800">
                                                {srv.cpuPercent}%
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-800">
                                                {srv.memMB} MB
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono text-[11px] text-gray-600">
                                                {srv.uptimeFormatted}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs bg-slate-100 text-slate-900 border border-slate-200">
                                                    {srv.latencyMs} ms ({srv.httpStatus} OK)
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>

                    {/* SECTION 3: STATUS KONEKSI & KESEHATAN DATABASE */}
                    <GlassCard className="p-0 overflow-hidden border border-gray-200" hover={false}>
                        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-base font-extrabold">
                                    3. Status Koneksi & Kesehatan Database
                                </h2>
                                <p className="text-xs text-slate-300">
                                    Koneksi langsung ke PostgreSQL VPS Lokal dan Database TimbangQR Air Hitam & Harapan Jaya
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                🟢 3 / 3 Database Terhubung Normal
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[11px] border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3.5">Database</th>
                                        <th className="px-5 py-3.5">Lokasi</th>
                                        <th className="px-5 py-3.5 text-center">Latency</th>
                                        <th className="px-5 py-3.5">Ringkasan Data Aktif</th>
                                        <th className="px-5 py-3.5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {dbList.map((db) => (
                                        <tr key={db.name} className="hover:bg-emerald-50/30">
                                            <td className="px-5 py-4">
                                                <p className="font-extrabold text-gray-900 font-mono">
                                                    {db.name}
                                                </p>
                                                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                                    {db.quotaNote}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-gray-700">
                                                {db.location}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                    {db.latencyMs} ms
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {db.summaryItems.map((item) => (
                                                        <span
                                                            key={item}
                                                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${
                                                        db.status === 'ONLINE'
                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                            : 'bg-rose-100 text-rose-800 border-rose-200'
                                                    }`}
                                                >
                                                    {db.status === 'ONLINE' ? '🟢 100% Normal' : '🔴 Gangguan'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </>
            )}
        </div>
    );
}
