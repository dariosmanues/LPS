'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui';
import * as XLSX from 'xlsx';

const EXCLUSIVE_EMAIL = 'fikri@lps.pekanbaru.go.id';

interface ActivityLogItem {
    id: string;
    user_id: string | null;
    user_email: string;
    user_name: string | null;
    user_role: string | null;
    action: string;
    category: string;
    description: string;
    target_path: string | null;
    ip_address: string | null;
    user_agent: string | null;
    device_summary: string | null;
    metadata: string | null;
    created_at: string;
}

interface UserSummaryItem {
    id: string;
    email: string;
    name: string;
    role: string;
    kelurahan_nama: string | null;
    kecamatan_nama: string | null;
    created_at: string;
    updated_at: string;
    total_logs: number;
    login_success_count: number;
    login_failed_count: number;
    password_change_count: number;
    last_activity_at: string | null;
    last_ip: string | null;
    last_device: string | null;
    last_action: string | null;
    last_description: string | null;
}

interface IpGeoInfo {
    ip: string;
    city: string;
    region: string;
    country: string;
    isp: string;
    as: string;
    mobile: boolean;
    proxy: boolean;
    connectionType: string;
    lat: number | null;
    lon: number | null;
}

interface KpiSummary {
    total_events: number;
    total_logins: number;
    total_failed_logins: number;
    total_password_changes: number;
    total_qr_regenerations: number;
    unique_active_users: number;
    unique_ips: number;
}

function formatWibDateTime(iso?: string | null): string {
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

function getActionBadge(action: string) {
    switch (action.toUpperCase()) {
        case 'LOGIN_SUCCESS':
            return { label: '🟢 LOGIN BERHASIL', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
        case 'LOGIN_FAILED':
            return { label: '🔴 LOGIN GAGAL', cls: 'bg-rose-100 text-rose-800 border-rose-200' };
        case 'LOGOUT':
            return { label: '⚫ LOGOUT / KELUAR', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
        case 'CHANGE_PASSWORD':
            return { label: '🟠 GANTI PASSWORD', cls: 'bg-amber-100 text-amber-900 border-amber-300' };
        case 'CREATE_USER':
            return { label: '🟣 BUAT USER BARU', cls: 'bg-purple-100 text-purple-800 border-purple-200' };
        case 'UPDATE_USER':
            return { label: '🟣 EDIT DATA USER', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
        case 'DELETE_USER':
            return { label: '🔴 HAPUS USER', cls: 'bg-red-100 text-red-800 border-red-200' };
        case 'REGENERATE_QR':
        case 'REGENERATE_ALL_QR':
            return { label: '🔵 GENERATE QR ARMADA', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
        case 'PAGE_VIEW':
            return { label: '🧭 BUKA MENU / HALAMAN', cls: 'bg-teal-50 text-teal-800 border-teal-200' };
        default:
            return { label: `⚡ ${action}`, cls: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
}

export default function ExclusiveUserActivityLogsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'timeline' | 'users' | 'ip_tracker'>('timeline');
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [users, setUsers] = useState<UserSummaryItem[]>([]);
    const [kpi, setKpi] = useState<KpiSummary>({
        total_events: 0,
        total_logins: 0,
        total_failed_logins: 0,
        total_password_changes: 0,
        total_qr_regenerations: 0,
        unique_active_users: 0,
        unique_ips: 0,
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedEmail, setSelectedEmail] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedAction, setSelectedAction] = useState<string>('ALL');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
    const [userSearchQuery, setUserSearchQuery] = useState<string>('');

    // IP Geo Lookup State
    const [ipGeoMap, setIpGeoMap] = useState<Record<string, IpGeoInfo>>({});
    const [loadingIp, setLoadingIp] = useState<string | null>(null);
    const [customIpInput, setCustomIpInput] = useState<string>('');

    const isAuthorizedFikri =
        status === 'authenticated' &&
        (session?.user?.email || '').toLowerCase().trim() === EXCLUSIVE_EMAIL;

    useEffect(() => {
        if (status === 'authenticated' && !isAuthorizedFikri) {
            router.replace('/dashboard');
        }
    }, [status, isAuthorizedFikri, router]);

    const fetchLogsData = useCallback(async () => {
        if (!isAuthorizedFikri) return;
        try {
            const params = new URLSearchParams({ limit: '400' });
            if (selectedEmail !== 'all') params.set('email', selectedEmail);
            if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
            if (selectedAction !== 'ALL') params.set('action', selectedAction);
            if (searchQuery.trim()) params.set('search', searchQuery.trim());

            const res = await fetch(`/api/user-activity-logs?${params.toString()}`, {
                cache: 'no-store',
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs || []);
                setUsers(data.users || []);
                if (data.kpi) setKpi(data.kpi);
            }
        } catch (err) {
            console.error('Error loading user activity logs:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthorizedFikri, selectedEmail, selectedCategory, selectedAction, searchQuery]);

    useEffect(() => {
        if (!isAuthorizedFikri) return;
        fetchLogsData();
    }, [isAuthorizedFikri, fetchLogsData]);

    useEffect(() => {
        if (!isAuthorizedFikri || !autoRefresh) return;
        const timer = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            fetchLogsData();
        }, 15000);
        return () => clearInterval(timer);
    }, [isAuthorizedFikri, autoRefresh, fetchLogsData]);

    const handleInspectIp = async (ip: string) => {
        const clean = (ip || '').trim();
        if (!clean || clean === 'unknown') return;
        if (ipGeoMap[clean]) return;
        setLoadingIp(clean);
        try {
            const res = await fetch(
                `/api/user-activity-logs?lookupIp=${encodeURIComponent(clean)}`,
                { cache: 'no-store' }
            );
            const data = await res.json();
            if (data.success && data.geo) {
                setIpGeoMap((prev) => ({ ...prev, [clean]: data.geo }));
            }
        } catch {
            // ignore
        } finally {
            setLoadingIp(null);
        }
    };

    const uniqueIpsFromLogs = useMemo(() => {
        const map = new Map<
            string,
            { ip: string; count: number; emails: Set<string>; lastSeen: string; lastDevice: string }
        >();
        for (const l of logs) {
            const ip = (l.ip_address || '').trim();
            if (!ip || ip === 'unknown') continue;
            const existing = map.get(ip);
            if (!existing) {
                map.set(ip, {
                    ip,
                    count: 1,
                    emails: new Set([l.user_email]),
                    lastSeen: l.created_at,
                    lastDevice: l.device_summary || '-',
                });
            } else {
                existing.count += 1;
                existing.emails.add(l.user_email);
            }
        }
        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }, [logs]);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
            if (userSearchQuery.trim()) {
                const q = userSearchQuery.toLowerCase().trim();
                return (
                    u.email.toLowerCase().includes(q) ||
                    (u.name || '').toLowerCase().includes(q) ||
                    (u.kelurahan_nama || '').toLowerCase().includes(q) ||
                    (u.last_ip || '').toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [users, userRoleFilter, userSearchQuery]);

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        const logRows = [
            ['LOG & AUDIT AKTIVITAS SELURUH USER MYLPS PEKANBARU'],
            ['DIAKSES KHUSUS OLEH: fikri@lps.pekanbaru.go.id'],
            [],
            [
                'WAKTU (WIB)',
                'EMAIL USER',
                'NAMA USER',
                'ROLE',
                'KATEGORI',
                'JENIS AKSI',
                'DESKRIPSI AKTIVITAS',
                'HALAMAN / ENDPOINT',
                'IP ADDRESS',
                'PERANGKAT & BROWSER',
            ],
            ...logs.map((l) => [
                formatWibDateTime(l.created_at),
                l.user_email,
                l.user_name || '-',
                l.user_role || '-',
                l.category,
                l.action,
                l.description,
                l.target_path || '-',
                l.ip_address || '-',
                l.device_summary || '-',
            ]),
        ];

        const userRows = [
            ['DIREKTORI & STATUS AKTIVITAS SELURUH AKUN USER MYLPS'],
            [],
            [
                'EMAIL',
                'NAMA',
                'ROLE',
                'KELURAHAN',
                'KECAMATAN',
                'TOTAL LOG',
                'LOGIN BERHASIL',
                'LOGIN GAGAL',
                'GANTI PASSWORD',
                'AKTIVITAS TERAKHIR (WIB)',
                'UPDATE PASSWORD/AKUN TERAKHIR (WIB)',
                'IP TERAKHIR',
                'PERANGKAT TERAKHIR',
                'AKSI TERAKHIR',
            ],
            ...users.map((u) => [
                u.email,
                u.name,
                u.role,
                u.kelurahan_nama || '-',
                u.kecamatan_nama || '-',
                u.total_logs,
                u.login_success_count,
                u.login_failed_count,
                u.password_change_count,
                formatWibDateTime(u.last_activity_at),
                formatWibDateTime(u.updated_at),
                u.last_ip || '-',
                u.last_device || '-',
                u.last_description || '-',
            ]),
        ];

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logRows), 'TIMELINE LOG AKTIVITAS');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(userRows), 'DIREKTORI 296 USER');
        XLSX.writeFile(wb, 'AUDIT_LOG_AKTIVITAS_SELURUH_USER_MYLPS.xlsx');
    };

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

    return (
        <div className="space-y-6">
            {/* Exclusive Security Header */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-purple-950 to-indigo-950 p-6 md:p-8 shadow-xl text-white border border-purple-500/30">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400 text-emerald-950 shadow-xs">
                                🔒 AKSES EKSKLUSIF: fikri@lps.pekanbaru.go.id
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-purple-200 border border-white/20">
                                DISEMBUNYIKAN DARI SELURUH AKUN LAIN
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                            Pusat Log & Pelacakan Aktivitas Seluruh User
                        </h1>
                        <p className="text-purple-200 text-sm mt-1.5 max-w-3xl">
                            Memantau seluruh riwayat <strong>Login Berhasil, Percobaan Login Gagal, Perubahan Password, Regenerasi QR Code, Navigasi Menu, Perangkat Browser, serta Lokasi & Jenis Jaringan IP (Data Seluler vs WiFi)</strong> secara real-time.
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
                            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`} />
                            {autoRefresh ? 'Live Auto-Refresh (15d)' : 'Auto-Refresh Mati'}
                        </button>
                        <button
                            type="button"
                            onClick={fetchLogsData}
                            className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs transition cursor-pointer"
                        >
                            🔄 Muat Ulang
                        </button>
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
                        >
                            📥 Ekspor Audit Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <GlassCard className="p-4 border border-purple-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Total Log Aktivitas</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">
                        {kpi.total_events.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
                        {kpi.unique_active_users} akun tercatat aktif
                    </p>
                </GlassCard>

                <GlassCard className="p-4 border border-emerald-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Login Berhasil</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                        {kpi.total_logins.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Sesi masuk valid</p>
                </GlassCard>

                <GlassCard className="p-4 border border-rose-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Login Gagal (401)</p>
                    <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
                        {kpi.total_failed_logins.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-rose-700 font-semibold mt-0.5">Password/email salah</p>
                </GlassCard>

                <GlassCard className="p-4 border border-amber-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Ganti Password</p>
                    <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
                        {kpi.total_password_changes.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Perubahan kredensial</p>
                </GlassCard>

                <GlassCard className="p-4 border border-blue-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Generate Ulang QR</p>
                    <p className="text-2xl font-black text-blue-600 mt-1 font-mono">
                        {kpi.total_qr_regenerations.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">Oleh Pengurus/Admin</p>
                </GlassCard>

                <GlassCard className="p-4 border border-teal-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">IP Address Unik</p>
                    <p className="text-2xl font-black text-teal-700 mt-1 font-mono">
                        {kpi.unique_ips.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-teal-700 font-semibold mt-0.5">Seluler & WiFi</p>
                </GlassCard>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
                <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                        activeTab === 'timeline'
                            ? 'bg-linear-to-r from-purple-700 to-indigo-700 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
                    }`}
                >
                    📜 Timeline Log Aktivitas ({logs.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                        activeTab === 'users'
                            ? 'bg-linear-to-r from-purple-700 to-indigo-700 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
                    }`}
                >
                    👥 Status & Riwayat Seluruh User ({users.length} Akun)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('ip_tracker')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                        activeTab === 'ip_tracker'
                            ? 'bg-linear-to-r from-purple-700 to-indigo-700 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
                    }`}
                >
                    🌐 Pelacak Lokasi & Jaringan IP ({uniqueIpsFromLogs.length} IP)
                </button>
            </div>

            {/* TAB 1: TIMELINE LOG AKTIVITAS */}
            {activeTab === 'timeline' && (
                <div className="space-y-4">
                    {/* Quick Account Shortcut Pills */}
                    <GlassCard className="p-4 border border-gray-100 space-y-3" hover={false}>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-500 mr-1">Filter Cepat Akun:</span>
                            {[
                                { label: 'Semua User', email: 'all' },
                                { label: '⭐ superadmin@lps.pekanbaru.go.id (Nisa)', email: 'superadmin@lps.pekanbaru.go.id' },
                                { label: '👤 fikri@lps.pekanbaru.go.id', email: 'fikri@lps.pekanbaru.go.id' },
                                { label: '👤 admin@lps.pekanbaru.go.id', email: 'admin@lps.pekanbaru.go.id' },
                                { label: '👤 dzakwan@lps.pekanbaru.go.id', email: 'dzakwan@lps.pekanbaru.go.id' },
                                { label: '👤 santi.rahmayanti@lps.pekanbaru.go.id', email: 'santi.rahmayanti@lps.pekanbaru.go.id' },
                                { label: '👤 sal.priadi@lps.pekanbaru.go.id', email: 'sal.priadi@lps.pekanbaru.go.id' },
                            ].map((q) => (
                                <button
                                    key={q.email}
                                    type="button"
                                    onClick={() => setSelectedEmail(q.email)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                        selectedEmail === q.email
                                            ? 'bg-purple-700 text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                                    }`}
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                            <input
                                type="text"
                                placeholder="Cari email, nama, IP, deskripsi, atau halaman..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            />

                            <select
                                value={selectedEmail}
                                onChange={(e) => setSelectedEmail(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:outline-none focus:border-purple-500"
                            >
                                <option value="all">-- Semua Akun User ({users.length}) --</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.email.toLowerCase()}>
                                        {u.email} ({u.name} - {u.role})
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:outline-none focus:border-purple-500"
                            >
                                <option value="ALL">-- Semua Kategori Aktivitas --</option>
                                <option value="AUTH">🔐 Login & Logout (AUTH)</option>
                                <option value="PASSWORD">🔑 Perubahan Password (PASSWORD)</option>
                                <option value="USER_MGMT">👥 Manajemen User (USER_MGMT)</option>
                                <option value="QR_CODE">📱 Generate Ulang QR (QR_CODE)</option>
                                <option value="NAVIGATION">🧭 Navigasi Menu / Halaman (NAVIGATION)</option>
                                <option value="DATA_ACTION">⚡ Mutasi Data Operasional</option>
                            </select>

                            <select
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:outline-none focus:border-purple-500"
                            >
                                <option value="ALL">-- Semua Jenis Aksi --</option>
                                <option value="LOGIN_SUCCESS">🟢 Login Berhasil</option>
                                <option value="LOGIN_FAILED">🔴 Login Gagal (Password Salah)</option>
                                <option value="LOGOUT">⚫ Logout / Sign Out</option>
                                <option value="CHANGE_PASSWORD">🟠 Ganti Password</option>
                                <option value="UPDATE_USER">🟣 Edit User / Role</option>
                                <option value="CREATE_USER">🟣 Buat User Baru</option>
                                <option value="REGENERATE_QR">🔵 Generate Ulang QR</option>
                                <option value="PAGE_VIEW">🧭 Buka Menu / Halaman</option>
                            </select>
                        </div>
                    </GlassCard>

                    {/* Timeline Table */}
                    <GlassCard className="p-0 overflow-hidden border border-gray-200" hover={false}>
                        {loading ? (
                            <div className="p-12 text-center text-gray-500 text-sm">
                                Memuat riwayat log aktivitas user...
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 text-sm">
                                Tidak ada log aktivitas yang cocok dengan filter saat ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-gray-700">
                                    <thead className="bg-slate-900 text-white uppercase font-bold text-[11px]">
                                        <tr>
                                            <th className="px-4 py-3.5">Waktu (WIB)</th>
                                            <th className="px-4 py-3.5">Akun User</th>
                                            <th className="px-4 py-3.5">Aksi</th>
                                            <th className="px-4 py-3.5">Deskripsi Aktivitas & Halaman</th>
                                            <th className="px-4 py-3.5">Perangkat & Browser</th>
                                            <th className="px-4 py-3.5">IP Address & Jaringan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {logs.map((item) => {
                                            const badge = getActionBadge(item.action);
                                            const ip = (item.ip_address || '').trim();
                                            const geo = ip ? ipGeoMap[ip] : undefined;
                                            const isNisa =
                                                item.user_email.toLowerCase() === 'superadmin@lps.pekanbaru.go.id';

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`hover:bg-purple-50/40 transition ${
                                                        item.action === 'CHANGE_PASSWORD'
                                                            ? 'bg-amber-50/40'
                                                            : item.action === 'LOGIN_FAILED'
                                                                ? 'bg-rose-50/30'
                                                                : isNisa
                                                                    ? 'bg-purple-50/20'
                                                                    : ''
                                                    }`}
                                                >
                                                    <td className="px-4 py-3 font-mono font-semibold text-gray-800 whitespace-nowrap">
                                                        {formatWibDateTime(item.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                            <span>{item.user_name || '-'}</span>
                                                            {item.user_role && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800">
                                                                    {item.user_role}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedEmail(item.user_email.toLowerCase())}
                                                            className="font-mono text-[11px] text-purple-700 hover:underline cursor-pointer"
                                                            title="Klik untuk memfilter log akun ini"
                                                        >
                                                            {item.user_email}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge.cls}`}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-md">
                                                        <p className="font-semibold text-gray-900">{item.description}</p>
                                                        {item.target_path && (
                                                            <p className="font-mono text-[11px] text-gray-500 mt-0.5">
                                                                Path: {item.target_path}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-gray-800">
                                                            {item.device_summary || '-'}
                                                        </p>
                                                        {item.user_agent && item.user_agent !== 'unknown' && (
                                                            <p
                                                                className="text-[10px] text-gray-400 truncate max-w-[210px]"
                                                                title={item.user_agent}
                                                            >
                                                                {item.user_agent}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                                                    {ip || 'unknown'}
                                                                </span>
                                                                {ip && ip !== 'unknown' && !geo && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleInspectIp(ip)}
                                                                        disabled={loadingIp === ip}
                                                                        className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 cursor-pointer"
                                                                    >
                                                                        {loadingIp === ip ? '...' : '📍 Cek Lokasi/ISP'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {geo && (
                                                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] space-y-0.5">
                                                                    <p className="font-extrabold text-indigo-800">
                                                                        {geo.connectionType}
                                                                    </p>
                                                                    <p className="text-gray-700">
                                                                        📍 <strong>{geo.city}, {geo.region}</strong>
                                                                    </p>
                                                                    <p className="text-gray-600 font-mono">
                                                                        ISP: {geo.isp} ({geo.as})
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}

            {/* TAB 2: DIREKTORI & STATUS SELURUH USER (296 AKUN) */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <GlassCard className="p-4 border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" hover={false}>
                        <input
                            type="text"
                            placeholder="Cari nama user, email, kelurahan, atau IP terakhir..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="flex-1 max-w-md bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
                            >
                                <option value="ALL">Semua Role ({users.length})</option>
                                <option value="SUPERADMIN">SUPERADMIN</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="OPERATOR">OPERATOR</option>
                                <option value="LPS_KETUA">LPS_KETUA</option>
                                <option value="LPS_SEKRETARIS">LPS_SEKRETARIS</option>
                                <option value="LPS_BENDAHARA">LPS_BENDAHARA</option>
                                <option value="VIEWER">VIEWER</option>
                                <option value="GATEKEEPER">GATEKEEPER</option>
                            </select>
                            <span className="text-xs font-semibold text-gray-500">
                                Menampilkan {filteredUsers.length} / {users.length} akun
                            </span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-0 overflow-hidden border border-gray-200" hover={false}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="bg-slate-900 text-white uppercase font-bold text-[11px]">
                                    <tr>
                                        <th className="px-4 py-3.5">Akun User</th>
                                        <th className="px-3 py-3.5">Role & Wilayah</th>
                                        <th className="px-3 py-3.5 text-center">Login OK</th>
                                        <th className="px-3 py-3.5 text-center">Login Gagal</th>
                                        <th className="px-3 py-3.5 text-center">Ganti Pass</th>
                                        <th className="px-4 py-3.5">Update Akun/Password Terakhir</th>
                                        <th className="px-4 py-3.5">Aktivitas & IP Terakhir</th>
                                        <th className="px-4 py-3.5 text-center">Detail Log</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-purple-50/40 transition">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900">{u.name}</p>
                                                <p className="font-mono text-[11px] text-purple-700">{u.email}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800">
                                                    {u.role}
                                                </span>
                                                {u.kelurahan_nama && (
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        Kel. {u.kelurahan_nama} ({u.kecamatan_nama})
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700">
                                                {u.login_success_count}
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-rose-600">
                                                {u.login_failed_count}
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-amber-700">
                                                {u.password_change_count}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-gray-700">
                                                {formatWibDateTime(u.updated_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {u.last_activity_at ? (
                                                    <div>
                                                        <p className="font-semibold text-gray-900 line-clamp-1">
                                                            {u.last_description}
                                                        </p>
                                                        <p className="font-mono text-[11px] text-gray-500">
                                                            {formatWibDateTime(u.last_activity_at)} • IP: {u.last_ip || '-'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500">{u.last_device}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Belum ada log aktivitas</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedEmail(u.email.toLowerCase());
                                                        setActiveTab('timeline');
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 cursor-pointer whitespace-nowrap"
                                                >
                                                    🔍 Lihat Log ({u.total_logs})
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* TAB 3: PELACAK LOKASI & JARINGAN IP (SELULER VS WIFI) */}
            {activeTab === 'ip_tracker' && (
                <div className="space-y-4">
                    <GlassCard className="p-5 border border-indigo-200 bg-indigo-50/30" hover={false}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900">
                                    Cek Lokasi Geografis, Provider ISP & Jenis Koneksi IP (Data Seluler vs WiFi)
                                </h2>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Masukkan IP Address apa pun atau klik tombol <strong>Cek Lokasi & ISP</strong> pada daftar IP di bawah untuk mengetahui lokasi kota, provider, dan tipe jaringan.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Ketik IP (mis. 114.125.57.102)..."
                                    value={customIpInput}
                                    onChange={(e) => setCustomIpInput(e.target.value)}
                                    className="bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-indigo-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleInspectIp(customIpInput)}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                                >
                                    📍 Lacak IP
                                </button>
                            </div>
                        </div>

                        {customIpInput.trim() && ipGeoMap[customIpInput.trim()] && (
                            <div className="mt-4 p-4 rounded-2xl bg-white border border-indigo-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <span className="text-gray-500 block">IP Address</span>
                                    <strong className="font-mono text-sm text-gray-900">
                                        {ipGeoMap[customIpInput.trim()].ip}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Jenis Jaringan</span>
                                    <strong className="text-indigo-700">
                                        {ipGeoMap[customIpInput.trim()].connectionType}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Lokasi Gateway</span>
                                    <strong className="text-gray-900">
                                        {ipGeoMap[customIpInput.trim()].city}, {ipGeoMap[customIpInput.trim()].region}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Provider / ASN</span>
                                    <strong className="font-mono text-gray-800">
                                        {ipGeoMap[customIpInput.trim()].isp} ({ipGeoMap[customIpInput.trim()].as})
                                    </strong>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard className="p-0 overflow-hidden border border-gray-200" hover={false}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="bg-slate-900 text-white uppercase font-bold text-[11px]">
                                    <tr>
                                        <th className="px-4 py-3.5">IP Address</th>
                                        <th className="px-4 py-3.5">Akun User yang Menggunakan</th>
                                        <th className="px-4 py-3.5 text-center">Jumlah Aktivitas</th>
                                        <th className="px-4 py-3.5">Perangkat Terakhir</th>
                                        <th className="px-4 py-3.5">Waktu Terakhir (WIB)</th>
                                        <th className="px-4 py-3.5">Hasil Deteksi Lokasi & Jaringan (WiFi / Seluler)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {uniqueIpsFromLogs.map((row) => {
                                        const geo = ipGeoMap[row.ip];
                                        return (
                                            <tr key={row.ip} className="hover:bg-indigo-50/30">
                                                <td className="px-4 py-3 font-mono font-bold text-gray-900">
                                                    {row.ip}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Array.from(row.emails).map((em) => (
                                                            <button
                                                                key={em}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedEmail(em.toLowerCase());
                                                                    setActiveTab('timeline');
                                                                }}
                                                                className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[11px] hover:bg-purple-100 cursor-pointer"
                                                            >
                                                                {em}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-gray-800">
                                                    {row.count}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-semibold">
                                                    {row.lastDevice}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-gray-600">
                                                    {formatWibDateTime(row.lastSeen)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {geo ? (
                                                        <div className="space-y-0.5">
                                                            <p className="font-extrabold text-indigo-800">
                                                                {geo.connectionType}
                                                            </p>
                                                            <p className="text-gray-800">
                                                                📍 <strong>{geo.city}, {geo.region}</strong> ({geo.country})
                                                            </p>
                                                            <p className="font-mono text-[11px] text-gray-500">
                                                                {geo.isp} • {geo.as}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleInspectIp(row.ip)}
                                                            disabled={loadingIp === row.ip}
                                                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 cursor-pointer"
                                                        >
                                                            {loadingIp === row.ip ? 'Melacak...' : '📍 Cek Lokasi & Seluler/WiFi'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
