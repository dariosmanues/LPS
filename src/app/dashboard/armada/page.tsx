'use client';

import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui';
import { QRCodeSVG } from 'qrcode.react';

interface Kelurahan {
    id: string;
    nama: string;
    kecamatan: { nama: string };
}

interface Armada {
    id: string;
    namaLps: string;
    kelurahanId: string | null;
    kelurahan: { id: string; nama: string; kecamatan: { nama: string } } | null;
    platNomor: string;
    noIzinOperasi: string | null;
    namaSupir: string | null;
    namaKetuaLps: string | null;
    noTlpKetuaLps: string | null;
    alamatLps: string | null;
    wilayahKerja: string | null;
    nomorSkLps: string | null;
    tanggalSkLps: string | null; // using string for simple display/input
    tanggalTerbitIzin: string | null;
    lokasiTransdepo: string | null; // AIRHITAM or HARAPANJAYA
    jenisArmada: string | null; // DUMPTRUCK, PICKUP, or BENTOR
    qrCode: string;
    isActive: boolean;
}

export default function ArmadaPage() {
    const [armadaList, setArmadaList] = useState<Armada[]>([]);
    const [kelurahanList, setKelurahanList] = useState<Kelurahan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState<Armada | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'kelurahan' | 'namaLps' | 'platNomor' | 'createdAt'>('createdAt');
    const [formData, setFormData] = useState({
        namaLps: '',
        kelurahanId: '',
        platNomor: '',
        noIzinOperasi: '',
        namaSupir: '',
        namaKetuaLps: '',
        noTlpKetuaLps: '',
        alamatLps: '',
        wilayahKerja: '',
        nomorSkLps: '',
        tanggalSkLps: '',
        tanggalTerbitIzin: '',
        lokasiTransdepo: '',
        jenisArmada: '',
    });

    useEffect(() => {
        fetchArmada();
        fetchKelurahan();
    }, []);

    useEffect(() => {
        fetchArmada();
    }, [sortBy]);

    const fetchArmada = async () => {
        try {
            setError(null);
            const res = await fetch(`/api/armada?sortBy=${sortBy}`);
            if (!res.ok) throw new Error('Failed to fetch armada');
            const data = await res.json();
            setArmadaList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching armada:', error);
            setError('Gagal memuat data. Mohon pastikan database sudah berjalan.');
        } finally {
            setLoading(false);
        }
    };

    const fetchKelurahan = async () => {
        try {
            const res = await fetch('/api/kelurahan');
            if (res.ok) {
                const data = await res.json();
                setKelurahanList(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching kelurahan:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            namaLps: '',
            kelurahanId: '',
            platNomor: '',
            noIzinOperasi: '',
            namaSupir: '',
            namaKetuaLps: '',
            noTlpKetuaLps: '',
            alamatLps: '',
            wilayahKerja: '',
            nomorSkLps: '',
            tanggalSkLps: '',
            tanggalTerbitIzin: '',
            lokasiTransdepo: '',
            jenisArmada: '',
        });
        setIsEditing(false);
        setEditId(null);
        setShowModal(false);
    };

    const handleEdit = (armada: Armada) => {
        setFormData({
            namaLps: armada.namaLps,
            kelurahanId: armada.kelurahanId || '',
            platNomor: armada.platNomor,
            noIzinOperasi: armada.noIzinOperasi || '',
            namaSupir: armada.namaSupir || '',
            namaKetuaLps: armada.namaKetuaLps || '',
            noTlpKetuaLps: armada.noTlpKetuaLps || '',
            alamatLps: armada.alamatLps || '',
            wilayahKerja: armada.wilayahKerja || '',
            nomorSkLps: armada.nomorSkLps || '',
            tanggalSkLps: armada.tanggalSkLps ? new Date(armada.tanggalSkLps).toISOString().split('T')[0] : '',
            tanggalTerbitIzin: armada.tanggalTerbitIzin ? new Date(armada.tanggalTerbitIzin).toISOString().split('T')[0] : '',
            lokasiTransdepo: armada.lokasiTransdepo || '',
            jenisArmada: armada.jenisArmada || '',
        });
        setIsEditing(true);
        setEditId(armada.id);
        setShowModal(true);
    };

    const handleDelete = async (id: string, force = false) => {
        if (!force && !confirm('Apakah Anda yakin ingin menghapus data armada ini?')) return;

        try {
            const res = await fetch(`/api/armada/${id}${force ? '?force=true' : ''}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchArmada();
                if (force) alert('Data armada dan riwayatnya berhasil dihapus.');
            } else {
                const data = await res.json();

                if (res.status === 409 && data.requiresConfirmation) {
                    if (confirm('Armada ini memiliki riwayat data sampah (Log). \n\nApakah Anda yakin ingin menghapus armada BESERTA SELURUH RIWAYATNYA?\n\nTindakan ini akan menghapus data armada dan semua log sampah terkait secara permanen dan tidak dapat dibatalkan.')) {
                        handleDelete(id, true);
                        return;
                    }
                } else {
                    alert(data.error || 'Gagal menghapus data armada');
                }
            }
        } catch (error) {
            console.error('Error deleting armada:', error);
            alert('Terjadi kesalahan saat menghapus data');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing ? `/api/armada/${editId}` : '/api/armada';
            const method = isEditing ? 'PATCH' : 'POST';

            // Convert date strings to Date objects or null
            const payload = {
                ...formData,
                kelurahanId: formData.kelurahanId || null,
                tanggalSkLps: formData.tanggalSkLps ? new Date(formData.tanggalSkLps) : null,
                tanggalTerbitIzin: formData.tanggalTerbitIzin ? new Date(formData.tanggalTerbitIzin) : null,
            };

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                resetForm();
                fetchArmada();
            } else {
                const errorData = await res.json();
                alert(`Gagal menyimpan: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error saving armada:', error);
            alert('Terjadi kesalahan saat menyimpan data');
        }
    };

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            await fetch(`/api/armada/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            });
            fetchArmada();
        } catch (error) {
            console.error('Error updating armada:', error);
        }
    };

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const topScrollRef = useRef<HTMLDivElement>(null);
    const [tableWidth, setTableWidth] = useState(0);

    // Sync scroll positions
    const handleScroll = (source: 'top' | 'table') => {
        const top = topScrollRef.current;
        const table = tableContainerRef.current;
        if (!top || !table) return;

        if (source === 'top') {
            table.scrollLeft = top.scrollLeft;
        } else {
            top.scrollLeft = table.scrollLeft;
        }
    };

    // Update width for top scrollbar
    useEffect(() => {
        if (tableContainerRef.current) {
            setTableWidth(tableContainerRef.current.scrollWidth);
        }
    }, [armadaList, loading]);

    const [showAnomalyModal, setShowAnomalyModal] = useState(false);
    const [anomalyData, setAnomalyData] = useState<any>(null);
    const [checkingAnomalies, setCheckingAnomalies] = useState(false);

    const checkAnomalies = async () => {
        setCheckingAnomalies(true);
        try {
            const res = await fetch('/api/armada/anomalies');
            if (res.ok) {
                const data = await res.json();
                setAnomalyData(data);
                setShowAnomalyModal(true);
            } else {
                alert('Gagal mengecek anomali data');
            }
        } catch (error) {
            console.error('Error checking anomalies:', error);
            alert('Terjadi kesalahan saat mengecek data');
        } finally {
            setCheckingAnomalies(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setImporting(true);
        try {
            const res = await fetch('/api/armada/import', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Import berhasil!\nTotal: ${data.stats.total}\nBaru: ${data.stats.created}\nUpdate: ${data.stats.updated}\nGagal: ${data.stats.errors}`);
                fetchArmada();
            } else {
                const errorData = await res.json();
                alert(`Gagal import: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error importing file:', error);
            alert('Terjadi kesalahan saat mengupload file');
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Master Data Armada LPS</h1>
                    <p className="text-gray-500 text-sm">Kelola data armada LPS Kota Pekanbaru</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImport}
                    />
                    <button
                        onClick={triggerImport}
                        disabled={importing}
                        className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 hover:bg-green-100 transition-all font-medium disabled:opacity-50"
                    >
                        {importing ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        )}
                        Import Excel
                    </button>
                    <button
                        onClick={checkAnomalies}
                        disabled={checkingAnomalies}
                        className="px-5 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl flex items-center gap-2 hover:bg-yellow-100 transition-all font-medium disabled:opacity-50"
                    >
                        {checkingAnomalies ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        Cek Anomali Data
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-xl flex items-center gap-2 hover:shadow-lg transition-all font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Armada
                    </button>
                </div>
            </div>

            {/* Sort Filter */}
            <GlassCard hover={false} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="text-gray-600 font-medium">Urutkan:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white font-medium text-gray-700"
                    >
                        <option value="kelurahan">Kelurahan</option>
                        <option value="namaLps">Nama LPS</option>
                        <option value="platNomor">No. Plat</option>
                        <option value="createdAt">Terbaru</option>
                    </select>
                </div>
                <div className="text-sm text-gray-500">
                    Total: <span className="font-semibold text-gray-700">{armadaList.length}</span> armada
                </div>
            </GlassCard>

            {/* Table */}
            <GlassCard padding="p-0" className="overflow-hidden" hover={false}>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-purple-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memuat data...
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="font-medium text-gray-800 mb-1">Terjadi Kesalahan</p>
                        <p className="text-sm text-gray-500 mb-4">{error}</p>
                        <button
                            onClick={() => { setLoading(true); fetchArmada(); }}
                            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : armadaList.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <p className="font-medium text-gray-800 mb-1">Belum Ada Data Armada</p>
                        <p className="text-sm text-gray-500">Klik tombol "Tambah Armada" untuk menambahkan data baru</p>
                    </div>
                ) : (
                    <div>
                        {/* Top Scrollbar */}
                        <div
                            ref={topScrollRef}
                            className="overflow-x-auto border-b border-gray-100"
                            onScroll={() => handleScroll('top')}
                        >
                            <div style={{ width: tableWidth }} className="h-1"></div>
                        </div>
                        <div
                            ref={tableContainerRef}
                            className="overflow-x-auto"
                            onScroll={() => handleScroll('table')}
                        >
                            <table className="w-full whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">No. Izin</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">No. SK & Tgl</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Nama LPS</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Ketua LPS & Alamat</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Wilayah</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Nama Supir</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">No. Plat</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Jenis Armada</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Lokasi & Wilayah Kerja</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Tgl Terbit Izin</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">QR</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {armadaList.map((armada) => (
                                        <tr key={armada.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">{armada.noIzinOperasi || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div>
                                                    <p>{armada.nomorSkLps || '-'}</p>
                                                    <p className="text-xs text-gray-400">{armada.tanggalSkLps ? new Date(armada.tanggalSkLps).toLocaleDateString('id-ID') : '-'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{armada.namaLps}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div>
                                                    <p>{armada.namaKetuaLps || '-'}</p>
                                                    <p className="text-xs text-gray-400">{armada.noTlpKetuaLps}</p>
                                                    <p className="text-xs text-gray-500 max-w-[200px] truncate" title={armada.alamatLps || ''}>{armada.alamatLps || '-'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {armada.kelurahan ? (
                                                    <div>
                                                        <p>{armada.kelurahan.nama}</p>
                                                        <p className="text-xs text-gray-400">Kec. {armada.kelurahan.kecamatan.nama}</p>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{armada.namaSupir || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600 font-mono">{armada.platNomor}</td>
                                            <td className="px-6 py-4 text-gray-600">{armada.jenisArmada || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div>
                                                    <p>{armada.lokasiTransdepo || '-'}</p>
                                                    <p className="text-xs text-gray-400 max-w-[200px] truncate" title={armada.wilayahKerja || ''}>{armada.wilayahKerja || '-'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {armada.tanggalTerbitIzin ? new Date(armada.tanggalTerbitIzin).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge ${armada.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                    {armada.isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setShowQRModal(armada)}
                                                    className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                                                >
                                                    Lihat QR
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(armada)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(armada.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => toggleActive(armada.id, armada.isActive)}
                                                        className={`p-2 rounded-lg transition-colors ${armada.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        title={armada.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                    >
                                                        {armada.isActive ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">{isEditing ? 'Edit Data Armada' : 'Tambah Armada LPS Baru'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">Nama LPS <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.namaLps}
                                    onChange={(e) => setFormData({ ...formData, namaLps: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    placeholder="Contoh: LPS Sukamaju"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">Kelurahan</label>
                                <select
                                    value={formData.kelurahanId}
                                    onChange={(e) => setFormData({ ...formData, kelurahanId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
                                >
                                    <option value="">Pilih Kelurahan</option>
                                    {kelurahanList.map((kel) => (
                                        <option key={kel.id} value={kel.id}>
                                            {kel.nama} - Kec. {kel.kecamatan.nama}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">No. Plat Kendaraan <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.platNomor}
                                    onChange={(e) => setFormData({ ...formData, platNomor: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    placeholder="Contoh: BM 8001 XX"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">No. Izin Operasional</label>
                                <input
                                    type="text"
                                    value={formData.noIzinOperasi}
                                    onChange={(e) => setFormData({ ...formData, noIzinOperasi: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    placeholder="Masukkan nomor izin"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">Nama Supir <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.namaSupir}
                                    onChange={(e) => setFormData({ ...formData, namaSupir: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    placeholder="Nama lengkap supir"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">Nama Ketua LPS</label>
                                <input
                                    type="text"
                                    value={formData.namaKetuaLps}
                                    onChange={(e) => setFormData({ ...formData, namaKetuaLps: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    placeholder="Nama ketua LPS"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">No. Tlp Ketua LPS</label>
                                <input
                                    type="text"
                                    value={formData.noTlpKetuaLps}
                                    onChange={(e) => setFormData({ ...formData, noTlpKetuaLps: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    placeholder="Contoh: 08123456789"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">Lokasi Transdepo</label>
                                <select
                                    value={formData.lokasiTransdepo}
                                    onChange={(e) => setFormData({ ...formData, lokasiTransdepo: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
                                >
                                    <option value="">Pilih Lokasi</option>
                                    <option value="AIRHITAM">Air Hitam</option>
                                    <option value="HARAPANJAYA">Harapan Jaya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm mb-2 font-medium">Jenis Armada</label>
                                <select
                                    value={formData.jenisArmada}
                                    onChange={(e) => setFormData({ ...formData, jenisArmada: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
                                >
                                    <option value="">Pilih Jenis Armada</option>
                                    <option value="DUMPTRUCK">Dump Truck</option>
                                    <option value="PICKUP">Pick Up</option>
                                    <option value="BENTOR">Bentor</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">{showQRModal.namaLps}</h2>
                        <p className="text-gray-500 mb-1">{showQRModal.platNomor}</p>
                        <p className="text-gray-400 text-sm mb-6">{showQRModal.namaSupir}</p>
                        <div className="bg-gray-50 p-4 rounded-xl inline-block mb-6">
                            <QRCodeSVG value={showQRModal.qrCode} size={200} />
                        </div>
                        <p className="text-gray-400 text-sm mb-6 font-mono">{showQRModal.qrCode}</p>
                        <button onClick={() => setShowQRModal(null)} className="w-full py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Anomaly Modal */}
            {showAnomalyModal && anomalyData && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Laporan Anomali Data</h2>
                            <button onClick={() => setShowAnomalyModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-600 font-medium">Total Armada</p>
                                    <p className="text-2xl font-bold text-blue-800">{anomalyData.summary.totalArmada}</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${anomalyData.summary.duplicatePlat > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                    <p className={`text-sm font-medium ${anomalyData.summary.duplicatePlat > 0 ? 'text-red-600' : 'text-green-600'}`}>Duplikat No. Plat</p>
                                    <p className={`text-2xl font-bold ${anomalyData.summary.duplicatePlat > 0 ? 'text-red-800' : 'text-green-700'}`}>
                                        {anomalyData.summary.duplicatePlat}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-xl border ${anomalyData.summary.crossKelurahanPlates > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                    <p className={`text-sm font-medium ${anomalyData.summary.crossKelurahanPlates > 0 ? 'text-red-600' : 'text-green-600'}`}>Cross-Kelurahan</p>
                                    <p className={`text-2xl font-bold ${anomalyData.summary.crossKelurahanPlates > 0 ? 'text-red-800' : 'text-green-700'}`}>
                                        {anomalyData.summary.crossKelurahanPlates}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-xl border ${anomalyData.summary.missingKelurahan > 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-sm font-medium ${anomalyData.summary.missingKelurahan > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>Tanpa Kelurahan</p>
                                    <p className={`text-2xl font-bold ${anomalyData.summary.missingKelurahan > 0 ? 'text-yellow-800' : 'text-gray-700'}`}>{anomalyData.summary.missingKelurahan}</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${anomalyData.summary.missingDriver > 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-sm font-medium ${anomalyData.summary.missingDriver > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>Tanpa Nama Supir</p>
                                    <p className={`text-2xl font-bold ${anomalyData.summary.missingDriver > 0 ? 'text-yellow-800' : 'text-gray-700'}`}>{anomalyData.summary.missingDriver}</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${anomalyData.summary.missingLicense > 0 ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-sm font-medium ${anomalyData.summary.missingLicense > 0 ? 'text-gray-700' : 'text-gray-500'}`}>Tanpa No. Izin</p>
                                    <p className={`text-2xl font-bold ${anomalyData.summary.missingLicense > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{anomalyData.summary.missingLicense}</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${anomalyData.summary.excelDuplicates > 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-sm font-medium ${anomalyData.summary.excelDuplicates > 0 ? 'text-orange-600' : 'text-gray-500'}`}>Duplikat Excel (Merged)</p>
                                    <p className={`text-2xl font-bold ${anomalyData.summary.excelDuplicates > 0 ? 'text-orange-800' : 'text-gray-700'}`}>{anomalyData.summary.excelDuplicates || 0}</p>
                                </div>
                            </div>

                            {/* Detailed Lists */}
                            {anomalyData.details.duplicatePlat && anomalyData.details.duplicatePlat.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        Indikasi Duplikat Nomor Plat
                                    </h3>
                                    <div className="bg-red-50 rounded-xl p-4 max-h-40 overflow-y-auto border border-red-100">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-gray-500 border-b border-red-200">
                                                    <th className="pb-2">Nomor Plat</th>
                                                    <th className="pb-2">Nama LPS</th>
                                                    <th className="pb-2">Supir</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {anomalyData.details.duplicatePlat.map((item: any) => (
                                                    <tr key={item.id} className="border-b border-red-100 last:border-0">
                                                        <td className="py-2 text-gray-900 font-bold font-mono">{item.platNomor}</td>
                                                        <td className="py-2 text-gray-700">{item.namaLps}</td>
                                                        <td className="py-2 text-gray-600">{item.namaSupir || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-red-500 mt-2">*Duplikat terdeteksi karena kesamaan karakter (mengabaikan spasi).</p>
                                </div>
                            )}

                            {anomalyData.details.crossKelurahanPlates && anomalyData.details.crossKelurahanPlates.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                        Plat Terdaftar di Kelurahan Berbeda
                                    </h3>
                                    <div className="bg-red-50 rounded-xl p-4 max-h-60 overflow-y-auto border border-red-100">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-gray-500 border-b border-red-200">
                                                    <th className="pb-2">Nomor Plat</th>
                                                    <th className="pb-2">Nama LPS</th>
                                                    <th className="pb-2">Kelurahan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {anomalyData.details.crossKelurahanPlates.map((item: any) => (
                                                    <tr key={item.id} className="border-b border-red-100 last:border-0">
                                                        <td className="py-2 text-gray-900 font-bold font-mono">{item.platNomor}</td>
                                                        <td className="py-2 text-gray-700">{item.namaLps}</td>
                                                        <td className="py-2 text-gray-600">
                                                            {item.kelurahan ? `${item.kelurahan.nama} (${item.kelurahan.kecamatan.nama})` : 'Tidak ada'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-red-600 mt-2 font-semibold">⚠️ PERINGATAN: Plat yang sama tidak boleh terdaftar di kelurahan berbeda!</p>
                                </div>
                            )}

                            {anomalyData.details.excelDuplicates && anomalyData.details.excelDuplicates.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                        Duplikat dari File Excel (Sudah Di-merge)
                                    </h3>
                                    <div className="bg-orange-50 rounded-xl p-4 max-h-60 overflow-y-auto border border-orange-100">
                                        {anomalyData.details.excelDuplicates.map((dup: any, idx: number) => (
                                            <div key={idx} className="mb-4 last:mb-0 pb-3 border-b border-orange-200 last:border-0">
                                                <p className="font-bold text-orange-900 mb-2">
                                                    {dup.plate} <span className="text-sm font-normal text-orange-700">(Muncul {dup.count}x di Excel)</span>
                                                </p>
                                                <ul className="space-y-1 text-sm">
                                                    {dup.occurrences.map((occ: any, i: number) => (
                                                        <li key={i} className="text-gray-700 pl-4">
                                                            • Baris {occ.rowNum}: "{occ.platOriginal}" - {occ.lpsName}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-orange-600 mt-2">ℹ️ Data ini sudah di-merge saat import. Database hanya menyimpan 1 record untuk setiap plat.</p>
                                </div>
                            )}

                            {anomalyData.details.missingKelurahan.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                        Data Tanpa Kelurahan
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                                        <ul className="space-y-1 text-sm">
                                            {anomalyData.details.missingKelurahan.map((item: any) => (
                                                <li key={item.id} className="flex justify-between">
                                                    <span className="font-medium text-gray-700">{item.namaLps}</span>
                                                    <span className="text-gray-500 font-mono">{item.platNomor}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowAnomalyModal(false)}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
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
