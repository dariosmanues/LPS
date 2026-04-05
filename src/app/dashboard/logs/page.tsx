'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';

interface LogEntry {
    id: string;
    beratKg: string;
    status: 'MASUK' | 'KELUAR';
    recordedAt: string;
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Riwayat Masuk/Keluar</h1>
                    <p className="text-gray-500 text-sm">Log aktivitas armada di TPA</p>
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
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Petugas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatDate(log.recordedAt)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{log.armada.platNomor}</td>
                                        <td className="px-6 py-4 text-gray-600">{log.armada.namaSupir}</td>
                                        <td className="px-6 py-4">
                                            {log.kelurahan ? (
                                                <div>
                                                    <p className="text-gray-800">{log.kelurahan.nama}</p>
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
                                        <td className="px-6 py-4 text-gray-500">{log.user.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
