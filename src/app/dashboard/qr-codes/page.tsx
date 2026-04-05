'use client';

import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui';
import { QRCodeSVG } from 'qrcode.react';

type TabType = 'armada' | 'kelurahan';

interface Armada {
    id: string;
    platNomor: string;
    namaSupir: string;
    qrCode: string;
}

interface Kelurahan {
    id: string;
    nama: string;
    qrCode: string;
    kecamatan?: { nama: string } | null;
}

function isArmada(item: Armada | Kelurahan): item is Armada {
    return (item as Armada).platNomor !== undefined;
}

function isKelurahan(item: Armada | Kelurahan): item is Kelurahan {
    return (item as Kelurahan).kecamatan !== undefined || (item as Kelurahan).nama !== undefined;
}

export default function QRCodesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('armada');
    const [armadaList, setArmadaList] = useState<Armada[]>([]);
    const [kelurahanList, setKelurahanList] = useState<Kelurahan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            setError(null);
            if (activeTab === 'armada') {
                const res = await fetch('/api/armada');
                if (!res.ok) throw new Error('Failed to fetch armada');
                const data = await res.json();
                setArmadaList(Array.isArray(data) ? data : []);
            } else {
                const res = await fetch('/api/kelurahan');
                if (!res.ok) throw new Error('Failed to fetch kelurahan');
                const data = await res.json();
                setKelurahanList(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Gagal memuat data. Mohon cek koneksi database.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        const allIds = activeTab === 'armada'
            ? armadaList.map(a => a.id)
            : kelurahanList.map(k => k.id);
        setSelectedItems(selectedItems.length === allIds.length ? [] : allIds);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Codes</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
            .qr-item { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; page-break-inside: avoid; }
            .qr-item h3 { margin: 10px 0 5px; font-size: 14px; }
            .qr-item p { margin: 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const items = activeTab === 'armada' ? armadaList : kelurahanList;

    // Filter armada by plate number search
    const filteredArmadaList = armadaList.filter(armada =>
        armada.platNomor.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter kelurahan by name search
    const filteredKelurahanList = kelurahanList.filter(kel =>
        kel.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Use filtered lists for display
    const displayItems = activeTab === 'armada' ? filteredArmadaList : filteredKelurahanList;

    // Safety check: ensure we only filter if items exist
    const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];

    const selectedData: (Armada | Kelurahan)[] = activeTab === 'armada'
        ? armadaList.filter(a => safeSelectedItems.includes(a.id))
        : kelurahanList.filter(k => safeSelectedItems.includes(k.id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">QR Code Generator</h1>
                    <p className="text-gray-500 text-sm">Generate dan cetak QR Code untuk Armada dan Kelurahan</p>
                </div>
                {selectedItems.length > 0 && (
                    <button onClick={handlePrint} className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-xl flex items-center gap-2 hover:shadow-lg transition-all font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Cetak ({selectedItems.length})
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4">
                <button
                    onClick={() => { setActiveTab('armada'); setSelectedItems([]); }}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'armada'
                        ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    QR Armada
                </button>
                <button
                    onClick={() => { setActiveTab('kelurahan'); setSelectedItems([]); }}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'kelurahan'
                        ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    QR Kelurahan
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeTab === 'armada' ? "Cari berdasarkan nomor plat..." : "Cari berdasarkan nama kelurahan..."}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="mt-2 text-sm text-gray-500">
                        Ditemukan {displayItems.length} dari {items.length} {activeTab === 'armada' ? 'armada' : 'kelurahan'}
                    </p>
                )}
            </div>

            {/* Select All */}
            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedItems.length === displayItems.length && displayItems.length > 0}
                        onChange={selectAll}
                        className="w-5 h-5 rounded border-gray-300"
                    />
                    <span className="text-gray-600">Pilih Semua ({displayItems.length})</span>
                </label>
            </div>

            {/* QR Grid */}
            {loading ? (
                <GlassCard hover={false}>
                    <p className="text-gray-500 text-center">Memuat data...</p>
                </GlassCard>
            ) : error ? (
                <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl">
                    <p className="font-medium text-red-700 mb-1">Terjadi Kesalahan</p>
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : displayItems.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-2xl">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-gray-700 mb-1">Tidak ada hasil</p>
                    <p className="text-sm text-gray-500">
                        {searchQuery ? `Tidak ditemukan ${activeTab === 'armada' ? 'armada' : 'kelurahan'} dengan kata kunci "${searchQuery}"` : `Belum ada data ${activeTab === 'armada' ? 'armada' : 'kelurahan'}`}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-3 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Hapus Pencarian
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {activeTab === 'armada' ? (
                        filteredArmadaList.map((armada) => (
                            <GlassCard
                                key={armada.id}
                                className={`cursor-pointer text-center ${selectedItems.includes(armada.id) ? 'ring-2 ring-purple-500' : ''}`}
                                onClick={() => toggleSelect(armada.id)}
                            >
                                <div className="bg-gray-50 p-3 rounded-xl inline-block mb-3">
                                    <QRCodeSVG value={armada.qrCode} size={120} />
                                </div>
                                <h3 className="text-gray-800 font-semibold">{armada.platNomor}</h3>
                                <p className="text-gray-500 text-sm">{armada.namaSupir || '-'}</p>
                                <p className="text-purple-600 text-xs mt-2 font-mono">{armada.qrCode}</p>
                            </GlassCard>
                        ))
                    ) : (
                        filteredKelurahanList.map((kel) => (
                            <GlassCard
                                key={kel.id}
                                className={`cursor-pointer text-center ${selectedItems.includes(kel.id) ? 'ring-2 ring-purple-500' : ''}`}
                                onClick={() => toggleSelect(kel.id)}
                            >
                                <div className="bg-gray-50 p-3 rounded-xl inline-block mb-3">
                                    <QRCodeSVG value={kel.qrCode} size={120} />
                                </div>
                                <h3 className="text-gray-800 font-semibold">{kel.nama}</h3>
                                <p className="text-gray-500 text-sm">{kel.kecamatan?.nama || '-'}</p>
                                <p className="text-purple-600 text-xs mt-2 font-mono">{kel.qrCode}</p>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}

            {/* Hidden Print Content */}
            <div ref={printRef} className="hidden">
                {selectedData.map((item) => {
                    if (isArmada(item)) {
                        return (
                            <div key={item.id} className="qr-item">
                                <QRCodeSVG value={item.qrCode} size={150} />
                                <h3>{item.platNomor}</h3>
                                <p>{item.namaSupir || '-'}</p>
                                <p>{item.qrCode}</p>
                            </div>
                        );
                    } else {
                        return (
                            <div key={item.id} className="qr-item">
                                <QRCodeSVG value={item.qrCode} size={150} />
                                <h3>{item.nama}</h3>
                                <p>{item.kecamatan?.nama || '-'}</p>
                                <p>{item.qrCode}</p>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
}
