'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';

interface LogEntry {
    id: string;
    beratKg: string;
    status: 'MASUK' | 'KELUAR';
    recordedAt: string;
    metadata?: string;
    armada: { platNomor: string; namaSupir: string };
    kelurahan: { nama: string; kecamatan: { nama: string } } | null;
    user: { name: string };
}

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/waste-logs?limit=100');
            const data = await res.json();
            if (data && Array.isArray(data.logs)) {
                setLogs(data.logs);
                setTotal(data.total || 0);
            } else {
                console.error('Invalid logs data:', data);
                setLogs([]);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Riwayat Masuk/Keluar</h1>
                    <p className="text-gray-500 text-sm">Log aktivitas armada & audit keamanan pemindaian di TPA</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-sm">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-800">{total}</p>
                </div>
            </div>

            {/* Table */}
            <GlassCard padding="p-0" className="overflow-hidden" hover={false}>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Memuat data...</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Belum ada data</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Waktu</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Armada</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Driver</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Asal Kelurahan</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Berat (kg)</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Audit IP & Perangkat</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Petugas / Sistem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const audit = parseAuditMeta(log.metadata);
                                    return (
                                        <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{formatDate(log.recordedAt)}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-800">{log.armada.platNomor}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{log.armada.namaSupir}</td>
                                            <td className="px-6 py-4">
                                                {log.kelurahan ? (
                                                    <div>
                                                        <p className="text-gray-800 font-medium text-sm">{log.kelurahan.nama}</p>
                                                        <p className="text-gray-400 text-xs">Kec. {log.kelurahan.kecamatan.nama}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-800">{parseFloat(log.beratKg).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`badge ${log.status === 'MASUK' ? 'badge-success' : 'badge-warning'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {audit?.clientIp ? (
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1 text-xs font-mono font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit border border-purple-100">
                                                            <span>🌐</span>
                                                            <span>{audit.clientIp}</span>
                                                        </div>
                                                        {audit.userAgent && (
                                                            <div className="text-[10px] text-gray-400 max-w-[180px] truncate" title={audit.userAgent}>
                                                                📱 {audit.userAgent}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : audit?.source === 'TimbangQR' ? (
                                                    <div className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100">
                                                        <span>⚖️ TimbangQR ({audit.ticketNumber || 'Pos'})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{log.user.name}</td>
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
