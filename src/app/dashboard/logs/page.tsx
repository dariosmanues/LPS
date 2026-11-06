'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/ui';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';

interface LogEntry {
    id: string;
    beratKg: string;
    status: 'MASUK' | 'KELUAR';
    recordedAt: string;
    metadata?: string;
    armada: { platNomor: string; namaSupir: string; namaLps?: string };
    kelurahan: { nama: string; kecamatan: { nama: string } } | null;
    user: { name: string };
}

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const fetchLogs = useCallback(async (query: string = '') => {
        setLoading(true);
        try {
            const url = query.trim()
                ? `/api/waste-logs?limit=150&search=${encodeURIComponent(query.trim())}`
                : `/api/waste-logs?limit=100`;

            const res = await fetch(url);
            const data = await res.json();
            if (data && Array.isArray(data.logs)) {
                setLogs(data.logs);
                setTotal(data.total || 0);
            } else {
                console.error('Invalid logs data:', data);
                setLogs([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce search effect (350ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setActiveSearch(searchTerm);
            fetchLogs(searchTerm);
        }, 350);

        return () => clearTimeout(handler);
    }, [searchTerm, fetchLogs]);

    const handleClearSearch = () => {
        setSearchTerm('');
        setActiveSearch('');
        fetchLogs('');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const parseAuditMeta = (metadataStr?: string) => {
        if (!metadataStr) return null;
        try {
            const parsed = JSON.parse(metadataStr);
            return {
                clientIp: parsed.clientIp || null,
                userAgent: parsed.userAgent || null,
                source: parsed.source || null,
                ticketNumber: parsed.ticketNumber || null,
            };
        } catch {
            return null;
        }
    };

    return (
        <div className="space-y-6">
            <ReadOnlyBanner featureName="Riwayat" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Riwayat Masuk/Keluar</h1>
                    <p className="text-gray-500 text-sm">
                        Log aktivitas armada timbangan & audit pemindaian di TPA
                    </p>
                </div>
                <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-gray-100 shadow-2xs sm:shadow-none">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">Total Transaksi</p>
                    <p className="text-2xl font-bold text-purple-700">{total.toLocaleString('id-ID')}</p>
                </div>
            </div>

            {/* Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari berdasarkan Plat Nomor (misal: BM 8608 TR) atau Kelurahan..."
                        className="w-full pl-11 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Hapus pencarian"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {activeSearch && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-purple-50 px-3 py-2 rounded-xl border border-purple-100">
                        <span>Menampilkan hasil pencarian: <strong>&ldquo;{activeSearch}&rdquo;</strong></span>
                        <button
                            onClick={handleClearSearch}
                            className="text-purple-700 hover:text-purple-900 font-semibold underline ml-1 cursor-pointer"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <GlassCard padding="p-0" className="overflow-hidden" hover={false}>
                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Mencari & memuat data riwayat...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 space-y-2">
                        <div className="text-3xl">🔍</div>
                        <p className="font-semibold text-gray-700">Tidak ada riwayat transaksi ditemukan</p>
                        {activeSearch ? (
                            <p className="text-xs text-gray-400">
                                Tidak ada data yang cocok dengan kata kunci &ldquo;{activeSearch}&rdquo;. Silakan periksa kembali nomor plat atau nama kelurahan.
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">Belum ada catatan transaksi penimbangan masuk.</p>
                        )}
                        {activeSearch && (
                            <button
                                onClick={handleClearSearch}
                                className="mt-2 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                            >
                                Hapus Filter Pencarian
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                                    <th className="text-left px-5 py-3.5">Waktu</th>
                                    <th className="text-left px-5 py-3.5">Armada / Plat</th>
                                    <th className="text-left px-5 py-3.5">Driver</th>
                                    <th className="text-left px-5 py-3.5">Asal Kelurahan</th>
                                    <th className="text-right px-5 py-3.5">Berat (kg)</th>
                                    <th className="text-center px-5 py-3.5">Status</th>
                                    <th className="text-left px-5 py-3.5">Audit IP & Perangkat</th>
                                    <th className="text-left px-5 py-3.5">Petugas / Sistem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map((log) => {
                                    const audit = parseAuditMeta(log.metadata);
                                    return (
                                        <tr key={log.id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 text-xs">
                                                {formatDate(log.recordedAt)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-gray-800 text-sm">{log.armada.platNomor}</div>
                                                {log.armada.namaLps && (
                                                    <div className="text-[11px] text-gray-500 font-medium">{log.armada.namaLps}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600 text-xs">
                                                {log.armada.namaSupir || '-'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {log.kelurahan ? (
                                                    <div>
                                                        <p className="text-gray-800 font-medium text-xs">
                                                            {log.kelurahan.nama.toLowerCase().startsWith('pasar') ? log.kelurahan.nama : `Kel. ${log.kelurahan.nama}`}
                                                        </p>
                                                        {log.kelurahan.kecamatan?.nama && (
                                                            <p className="text-gray-400 text-[10px]">Kec. {log.kelurahan.kecamatan.nama}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-gray-800 text-sm">
                                                {parseFloat(log.beratKg).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                    log.status === 'MASUK'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {audit?.clientIp ? (
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit border border-purple-100">
                                                            <span>🌐</span>
                                                            <span>{audit.clientIp}</span>
                                                        </div>
                                                        {audit.userAgent && (
                                                            <div className="text-[10px] text-gray-400 max-w-[170px] truncate" title={audit.userAgent}>
                                                                📱 {audit.userAgent}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : audit?.source === 'TimbangQR' ? (
                                                    <div className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100 font-medium">
                                                        <span>⚖️ TimbangQR ({audit.ticketNumber || 'Pos'})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500 text-xs">{log.user.name}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
