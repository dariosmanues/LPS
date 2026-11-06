'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { usePermissions } from '@/lib/permissions';

interface Kelurahan {
    id: string;
    nama: string;
    kodeKemendagri: string;
    qrCode: string;
}

interface Kecamatan {
    id: string;
    nama: string;
    kodeKemendagri: string;
    kelurahan: Kelurahan[];
}

export default function WilayahPage() {
    const { isSuperAdmin } = usePermissions();
    const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedKec, setExpandedKec] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        nama: '',
        kecamatanId: '',
        kodeKemendagri: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchWilayah();
    }, []);

    const fetchWilayah = async () => {
        try {
            const res = await fetch('/api/wilayah');
            const data = await res.json();
            if (Array.isArray(data)) {
                setKecamatanList(data);
            }
        } catch (error) {
            console.error('Error fetching wilayah:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalKelurahan = kecamatanList.reduce((acc, kec) => acc + kec.kelurahan.length, 0);

    const openCreateModal = () => {
        setFormData({
            nama: '',
            kecamatanId: kecamatanList[0]?.id || '',
            kodeKemendagri: '',
        });
        setMessage(null);
        setShowModal(true);
    };

    const handleKecamatanChange = (kecId: string) => {
        const kec = kecamatanList.find((k) => k.id === kecId);
        if (kec) {
            const nextNum = kec.kelurahan.length + 1;
            const suggestedKode = `${kec.kodeKemendagri}.${String(nextNum).padStart(3, '0')}`;
            setFormData({
                ...formData,
                kecamatanId: kecId,
                kodeKemendagri: suggestedKode,
            });
        } else {
            setFormData({ ...formData, kecamatanId: kecId });
        }
    };

    const handleCreateKelurahan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/wilayah/kelurahan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Gagal menambahkan kelurahan' });
            } else {
                setMessage({ type: 'success', text: `Kelurahan ${data.kelurahan.nama} berhasil ditambahkan!` });
                await fetchWilayah();
                setTimeout(() => {
                    setShowModal(false);
                    setMessage(null);
                }, 1000);
            }
        } catch (error) {
            console.error('Error creating kelurahan:', error);
            setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <ReadOnlyBanner featureName="Wilayah" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Master Data Wilayah</h1>
                    <p className="text-gray-500 text-sm">Data Kecamatan dan Kelurahan se-Kota Pekanbaru</p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 font-semibold shadow-md cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Tambah Kelurahan Baru</span>
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
                <GlassCard className="text-center" hover={false}>
                    <p className="text-gray-500 mb-2">Total Kecamatan</p>
                    <p className="text-3xl font-bold text-gray-800">{kecamatanList.length}</p>
                </GlassCard>
                <GlassCard className="text-center" hover={false}>
                    <p className="text-gray-500 mb-2">Total Kelurahan</p>
                    <p className="text-3xl font-bold text-purple-700">{totalKelurahan}</p>
                </GlassCard>
            </div>

            {/* Accordion List */}
            {loading ? (
                <GlassCard hover={false}>
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Memuat data wilayah...</span>
                    </div>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {kecamatanList.map((kec) => (
                        <GlassCard key={kec.id} padding="p-0" hover={false}>
                            <button
                                onClick={() => setExpandedKec(expandedKec === kec.id ? null : kec.id)}
                                className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-semibold text-lg">{kec.nama}</h3>
                                        <p className="text-gray-500 text-sm">
                                            Kode: <span className="font-mono">{kec.kodeKemendagri}</span> • {kec.kelurahan.length} Kelurahan
                                        </p>
                                    </div>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedKec === kec.id ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {expandedKec === kec.id && (
                                <div className="border-t border-gray-100 p-5 bg-gray-50/40">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {kec.kelurahan.map((kel) => (
                                            <div
                                                key={kel.id}
                                                className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-2xs hover:border-purple-200 transition-all"
                                            >
                                                <div>
                                                    <p className="text-gray-800 font-semibold text-sm">Kel. {kel.nama}</p>
                                                    <p className="text-gray-400 text-xs font-mono">{kel.kodeKemendagri}</p>
                                                </div>
                                                <span className="text-[11px] bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md font-mono border border-purple-100">
                                                    {kel.qrCode}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Modal Tambah Kelurahan Baru */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-purple-50 to-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Tambah Kelurahan Baru</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Daftarkan kelurahan baru hasil pemekaran wilayah</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateKelurahan} className="p-6 space-y-4">
                            {message && (
                                <div className={`p-3.5 rounded-xl text-sm font-medium ${
                                    message.type === 'success'
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Kecamatan Induk <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.kecamatanId}
                                    onChange={(e) => handleKecamatanChange(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-medium cursor-pointer"
                                    required
                                >
                                    <option value="">-- Pilih Kecamatan --</option>
                                    {kecamatanList.map((kec) => (
                                        <option key={kec.id} value={kec.id}>
                                            Kecamatan {kec.nama} ({kec.kodeKemendagri})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Nama Kelurahan Baru <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Sidomulyo Baru"
                                    value={formData.nama}
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Kode Kemendagri
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: 14.71.13.006"
                                    value={formData.kodeKemendagri}
                                    onChange={(e) => setFormData({ ...formData, kodeKemendagri: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-mono"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Bisa dikosongkan (otomatis diisi berdasarkan urutan kelurahan di kecamatan terpilih).
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Kelurahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
