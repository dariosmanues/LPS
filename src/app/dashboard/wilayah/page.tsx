'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';

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
    const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedKec, setExpandedKec] = useState<string | null>(null);

    useEffect(() => {
        fetchWilayah();
    }, []);

    const fetchWilayah = async () => {
        try {
            const res = await fetch('/api/wilayah');
            const data = await res.json();
            setKecamatanList(data);
        } catch (error) {
            console.error('Error fetching wilayah:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalKelurahan = kecamatanList.reduce((acc, kec) => acc + kec.kelurahan.length, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Master Data Wilayah</h1>
                <p className="text-gray-500 text-sm">Data Kecamatan dan Kelurahan Kota Pekanbaru</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
                <GlassCard className="text-center" hover={false}>
                    <p className="text-gray-500 mb-2">Total Kecamatan</p>
                    <p className="text-3xl font-bold text-gray-800">{kecamatanList.length}</p>
                </GlassCard>
                <GlassCard className="text-center" hover={false}>
                    <p className="text-gray-500 mb-2">Total Kelurahan</p>
                    <p className="text-3xl font-bold text-gray-800">{totalKelurahan}</p>
                </GlassCard>
            </div>

            {/* Accordion List */}
            {loading ? (
                <GlassCard hover={false}>
                    <p className="text-gray-500 text-center">Memuat data...</p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {kecamatanList.map((kec) => (
                        <GlassCard key={kec.id} padding="p-0" hover={false}>
                            <button
                                onClick={() => setExpandedKec(expandedKec === kec.id ? null : kec.id)}
                                className="w-full p-5 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-semibold text-lg">{kec.nama}</h3>
                                        <p className="text-gray-500 text-sm">{kec.kodeKemendagri} • {kec.kelurahan.length} Kelurahan</p>
                                    </div>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedKec === kec.id ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {expandedKec === kec.id && (
                                <div className="border-t border-gray-100 p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {kec.kelurahan.map((kel) => (
                                            <div
                                                key={kel.id}
                                                className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="text-gray-800 font-medium">{kel.nama}</p>
                                                    <p className="text-gray-400 text-xs">{kel.kodeKemendagri}</p>
                                                </div>
                                                <span className="text-xs text-purple-600 font-mono">{kel.qrCode}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
