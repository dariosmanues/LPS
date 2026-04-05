'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface Armada {
    id: string;
    namaLps: string;
    platNomor: string;
    namaSupir: string | null;
    jenisArmada: string | null;
    qrCode: string;
    kelurahan: {
        nama: string;
        kecamatan: {
            nama: string;
        };
    } | null;
}

export default function QRGeneratorPage() {
    const [armadaList, setArmadaList] = useState<Armada[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generatedQRs, setGeneratedQRs] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchArmada();
    }, []);

    const fetchArmada = async () => {
        try {
            const response = await fetch('/api/lps/armada');
            const data = await response.json();

            if (data.success) {
                setArmadaList(data.data);
            } else {
                setError(data.error || 'Gagal memuat data armada');
            }
        } catch (error) {
            console.error('Error fetching armada:', error);
            setError('Gagal memuat data armada');
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = (armadaId: string) => {
        setGeneratedQRs(prev => new Set(prev).add(armadaId));
    };

    const regenerateQRCode = async (armadaId: string) => {
        try {
            // Call API to regenerate QR code in database
            const response = await fetch(`/api/lps/armada/${armadaId}/regenerate`, {
                method: 'PUT',
            });

            const data = await response.json();

            if (data.success) {
                // Update local armada list with new QR code
                setArmadaList(prevList =>
                    prevList.map(armada =>
                        armada.id === armadaId
                            ? { ...armada, qrCode: data.data.qrCode }
                            : armada
                    )
                );

                // Trigger re-render by removing and re-adding to generatedQRs
                setGeneratedQRs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(armadaId);
                    return newSet;
                });

                // Add back after a short delay to show regeneration animation
                setTimeout(() => {
                    setGeneratedQRs(prev => new Set(prev).add(armadaId));
                }, 100);

                // Show success message (optional)
                console.log('QR Code berhasil di-regenerate:', data.message);
            } else {
                console.error('Error regenerating QR code:', data.error);
                alert('Gagal me-regenerate QR code: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error calling regenerate API:', error);
            alert('Gagal me-regenerate QR code. Silakan coba lagi.');
        }
    };

    const downloadQRCode = (platNomor: string) => {
        const canvas = document.getElementById(`qr-${platNomor}`) as HTMLCanvasElement;
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `QR-${platNomor}.png`;
            link.href = url;
            link.click();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data armada...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        QR Code Generator Armada
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Generate dan download QR code untuk armada LPS Anda
                    </p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                    <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-blue-800 font-medium mb-1">Cara Menggunakan</p>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Pilih armada yang ingin di-generate QR code-nya</li>
                            <li>• Klik tombol "Download QR Code" untuk menyimpan</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Armada List */}
            {armadaList.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="text-gray-500 mb-2">Belum ada armada terdaftar</p>
                    <p className="text-sm text-gray-400">Silakan tambahkan armada terlebih dahulu</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {armadaList.map((armada) => (
                        <div
                            key={armada.id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            {/* Armada Info */}
                            <div className="mb-4">
                                <h3 className="font-semibold text-gray-800 text-lg mb-1">
                                    {armada.platNomor}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                    {armada.namaLps}
                                </p>
                                {armada.namaSupir && (
                                    <p className="text-xs text-gray-500">
                                        Supir: {armada.namaSupir}
                                    </p>
                                )}
                                {armada.jenisArmada && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        {armada.jenisArmada}
                                    </span>
                                )}
                            </div>

                            {/* QR Code Area */}
                            {!generatedQRs.has(armada.id) ? (
                                <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 min-h-[248px]">
                                    <div className="text-center">
                                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        <p className="text-sm text-gray-500">QR Code belum di-generate</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 flex items-center justify-center mb-4">
                                    <QRCodeCanvas
                                        id={`qr-${armada.platNomor}`}
                                        value={armada.qrCode}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!generatedQRs.has(armada.id) ? (
                                <button
                                    onClick={() => generateQRCode(armada.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Generate QR Code
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => downloadQRCode(armada.platNomor)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download QR Code
                                    </button>
                                    <button
                                        onClick={() => regenerateQRCode(armada.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Generate Ulang
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
