'use client';

import { useState, useEffect, useCallback } from 'react';

interface Laporan {
    id: string;
    senderPhone: string;
    senderName: string | null;
    message: string;
    kategori: string;
    status: string;
    adminNotes: string | null;
    replyMessage: string | null;
    repliedAt: string | null;
    createdAt: string;
}

interface Stats {
    baru: number;
    diproses: number;
    selesai: number;
    ditolak: number;
    total: number;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    BARU: { label: 'Baru', bg: 'bg-blue-100', text: 'text-blue-700' },
    DIPROSES: { label: 'Diproses', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    SELESAI: { label: 'Selesai', bg: 'bg-green-100', text: 'text-green-700' },
    DITOLAK: { label: 'Ditolak', bg: 'bg-red-100', text: 'text-red-700' },
};

const KATEGORI_CONFIG: Record<string, { label: string; emoji: string }> = {
    SAMPAH_MENUMPUK: { label: 'Sampah Menumpuk', emoji: '🗑️' },
    ARMADA_TIDAK_DATANG: { label: 'Armada Tidak Datang', emoji: '🚛' },
    JADWAL_PENGANGKUTAN: { label: 'Jadwal Pengangkutan', emoji: '📅' },
    IURAN: { label: 'Iuran', emoji: '💰' },
    LAINNYA: { label: 'Lainnya', emoji: '📋' },
};

export default function LaporanMasyarakatPage() {
    const [data, setData] = useState<Laporan[]>([]);
    const [stats, setStats] = useState<Stats>({ baru: 0, diproses: 0, selesai: 0, ditolak: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterKategori, setFilterKategori] = useState('ALL');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Laporan | null>(null);
    const [replyText, setReplyText] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [sending, setSending] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'ALL') params.set('status', filterStatus);
            if (filterKategori !== 'ALL') params.set('kategori', filterKategori);
            if (search) params.set('search', search);
            const res = await fetch(`/api/laporan-masyarakat?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setStats(json.stats);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterKategori, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const updateStatus = async (id: string, status: string) => {
        await fetch(`/api/laporan-masyarakat/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        fetchData();
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    };

    const sendReply = async () => {
        if (!selected || !replyText.trim()) return;
        setSending(true);
        try {
            await fetch(`/api/laporan-masyarakat/${selected.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    replyMessage: replyText,
                    adminNotes: adminNotes || undefined,
                    status: 'DIPROSES',
                }),
            });
            setReplyText('');
            setSelected(null);
            fetchData();
        } catch (e) {
            console.error('Reply error:', e);
        } finally {
            setSending(false);
        }
    };

    const openDetail = (item: Laporan) => {
        setSelected(item);
        setAdminNotes(item.adminNotes || '');
        setReplyText('');
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const formatPhone = (p: string) => {
        if (p.startsWith('62')) return '0' + p.slice(2);
        return p;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Laporan Masyarakat</h1>
                <p className="text-gray-500 text-sm">Kelola aduan masyarakat yang masuk via WhatsApp</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'bg-purple-600', icon: '📊' },
                    { label: 'Baru', value: stats.baru, color: 'bg-blue-500', icon: '🆕' },
                    { label: 'Diproses', value: stats.diproses, color: 'bg-yellow-500', icon: '⏳' },
                    { label: 'Selesai', value: stats.selesai, color: 'bg-green-500', icon: '✅' },
                    { label: 'Ditolak', value: stats.ditolak, color: 'bg-red-500', icon: '❌' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{s.icon}</span>
                            <span className={`w-3 h-3 rounded-full ${s.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari nama, nomor, pesan..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                    <option value="ALL">Semua Status</option>
                    <option value="BARU">Baru</option>
                    <option value="DIPROSES">Diproses</option>
                    <option value="SELESAI">Selesai</option>
                    <option value="DITOLAK">Ditolak</option>
                </select>
                <select
                    value={filterKategori}
                    onChange={e => setFilterKategori(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                    <option value="ALL">Semua Kategori</option>
                    {Object.entries(KATEGORI_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
                        <p className="mt-4 text-gray-500 text-sm">Memuat data...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-gray-500">Belum ada laporan masuk</p>
                        <p className="text-gray-400 text-sm mt-1">Laporan dari WhatsApp akan muncul di sini</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pengirim</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pesan</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map(item => {
                                    const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.BARU;
                                    const kt = KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG.LAINNYA;
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetail(item)}>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-800 text-sm">{item.senderName || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400">{formatPhone(item.senderPhone)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">{item.message}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm">{kt.emoji} {kt.label}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                    {item.status === 'BARU' && (
                                                        <button onClick={() => updateStatus(item.id, 'DIPROSES')} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Proses">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </button>
                                                    )}
                                                    {(item.status === 'BARU' || item.status === 'DIPROSES') && (
                                                        <button onClick={() => updateStatus(item.id, 'SELESAI')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Selesai">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
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
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h3 className="font-semibold text-gray-800">Detail Laporan</h3>
                            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Sender Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{selected.senderName || 'Unknown'}</p>
                                    <p className="text-sm text-gray-500">{formatPhone(selected.senderPhone)}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[selected.status]?.bg} ${STATUS_CONFIG[selected.status]?.text}`}>
                                        {STATUS_CONFIG[selected.status]?.label}
                                    </span>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <p className="text-xs text-green-600 font-medium mb-1">Pesan WhatsApp</p>
                                <p className="text-gray-800 text-sm whitespace-pre-wrap">{selected.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{formatDate(selected.createdAt)}</p>
                            </div>

                            {/* Category + Status Controls */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Kategori</label>
                                    <select
                                        value={selected.kategori}
                                        onChange={async (e) => {
                                            await fetch(`/api/laporan-masyarakat/${selected.id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ kategori: e.target.value }),
                                            });
                                            setSelected({ ...selected, kategori: e.target.value });
                                            fetchData();
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        {Object.entries(KATEGORI_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.emoji} {v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                                    <select
                                        value={selected.status}
                                        onChange={async (e) => {
                                            await updateStatus(selected.id, e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Previous reply */}
                            {selected.replyMessage && (
                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                    <p className="text-xs text-purple-600 font-medium mb-1">Balasan Admin</p>
                                    <p className="text-gray-800 text-sm">{selected.replyMessage}</p>
                                    {selected.repliedAt && (
                                        <p className="text-xs text-gray-400 mt-2">Dikirim: {formatDate(selected.repliedAt)}</p>
                                    )}
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Catatan Admin</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                    placeholder="Tambahkan catatan internal..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            {/* Reply via WhatsApp */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Balas via WhatsApp</label>
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Tulis balasan untuk dikirim ke WhatsApp masyarakat..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setSelected(null)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={sendReply}
                                    disabled={!replyText.trim() || sending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    {sending ? 'Mengirim...' : 'Kirim Balasan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
