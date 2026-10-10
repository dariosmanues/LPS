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
    isQrUsed?: boolean;
    qrUsedAt?: string | null;
    lastTicketNumber?: string | null;
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

    const [copiedApi, setCopiedApi] = useState(false);
    const [showApiModal, setShowApiModal] = useState(false);

    useEffect(() => {
        fetchArmada();
    }, []);

    const fetchArmada = async () => {
        try {
            const response = await fetch('/api/lps/armada');
            const data = await response.json();

            if (data.success) {
                setArmadaList(data.data);
                // Automatically display QR codes that are already registered
                if (data.data.length > 0) {
                    setGeneratedQRs(new Set(data.data.map((a: Armada) => a.id)));
                }
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

    const toggleAllQRs = (show: boolean) => {
        if (show) {
            setGeneratedQRs(new Set(armadaList.map(a => a.id)));
        } else {
            setGeneratedQRs(new Set());
        }
    };

    const copyApiUrl = () => {
        const url = `${window.location.origin}/api/integrations/timbangqr/qr-generator`;
        navigator.clipboard.writeText(url);
        setCopiedApi(true);
        setTimeout(() => setCopiedApi(false), 2500);
    };

    const generateQRCode = (armadaId: string) => {
        setGeneratedQRs(prev => new Set(prev).add(armadaId));
    };

    const regenerateQRCode = async (armadaId: string) => {
        if (!window.confirm('Generate QR baru? QR lama armada ini langsung tidak berlaku dan harus diganti pada kendaraan.')) return;
        try {
            // Call API to regenerate QR code in database
            const response = await fetch(`/api/lps/armada/${armadaId}/regenerate`, {
                method: 'PUT',
            });

            const data = await response.json();

            if (data.success) {
                // Update local armada list with new QR code and reset used status
                setArmadaList(prevList =>
                    prevList.map(armada =>
                        armada.id === armadaId
                            ? {
                                ...armada,
                                qrCode: data.data.qrCode,
                                isQrUsed: false,
                                qrUsedAt: null,
                                lastTicketNumber: null,
                            }
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

    const [regeneratingAll, setRegeneratingAll] = useState(false);

    const regenerateAllQRCodes = async () => {
        if (!confirm('Apakah Anda yakin ingin me-regenerate semua QR Code armada? QR Code lama akan hangus.')) {
            return;
        }
        setRegeneratingAll(true);
        try {
            const response = await fetch('/api/lps/armada/regenerate-all', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                await fetchArmada();
                alert(data.message || 'Semua QR Code berhasil di-regenerate!');
            } else {
                alert('Gagal: ' + (data.error || 'Terjadi kesalahan'));
            }
        } catch (error) {
            console.error('Error regenerate all:', error);
            alert('Gagal me-regenerate semua QR code. Silakan coba lagi.');
        } finally {
            setRegeneratingAll(false);
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
                        Generate dan download QR code untuk armada LPS Anda serta integrasi ke aplikasi TimbangQR
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={regenerateAllQRCodes}
                        disabled={regeneratingAll}
                        className="px-3.5 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        title="Generate ulang QR Code untuk semua armada sekaligus"
                    >
                        <svg className={`w-4 h-4 ${regeneratingAll ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {regeneratingAll ? 'Memproses...' : 'Generate Ulang Semua'}
                    </button>
                    <button
                        onClick={() => toggleAllQRs(true)}
                        className="px-3.5 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        Tampilkan Semua QR
                    </button>
                    <button
                        onClick={() => toggleAllQRs(false)}
                        className="px-3.5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Sembunyikan Semua
                    </button>
                    <button
                        onClick={() => setShowApiModal(true)}
                        className="px-3.5 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        API TimbangQR
                    </button>
                </div>
            </div>

            {/* TimbangQR Integration Banner */}
            <div className="bg-linear-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                API TimbangQR Aktif
                            </span>
                            <span className="text-xs text-purple-700 font-medium">REST API Endpoint</span>
                        </div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Akses Data & Verifikasi QR dari Aplikasi TimbangQR
                        </h2>
                        <p className="text-xs text-gray-600">
                            Aplikasi TimbangQR dapat membaca daftar armada, lookup plat nomor/QR, atau merender QR langsung via API:
                        </p>
                        <code className="inline-block mt-1 px-2.5 py-1 bg-white/80 border border-purple-200 rounded-lg text-xs font-mono text-purple-900 select-all">
                            /api/integrations/timbangqr/qr-generator
                        </code>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyApiUrl}
                            className="px-3.5 py-2 bg-white text-gray-700 border border-purple-300 text-xs font-medium rounded-xl hover:bg-purple-50 transition-colors shadow-xs flex items-center gap-1.5"
                        >
                            {copiedApi ? (
                                <>
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-green-600 font-semibold">Tersalin!</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Salin Endpoint
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowApiModal(true)}
                            className="px-3.5 py-2 bg-purple-600 text-white text-xs font-medium rounded-xl hover:bg-purple-700 transition-colors shadow-xs"
                        >
                            Dokumentasi API
                        </button>
                    </div>
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
                            <li>• Klik <strong>"Tampilkan Semua QR"</strong> untuk melihat QR code seluruh armada sekaligus</li>
                            <li>• Klik tombol <strong>"Download QR Code"</strong> untuk menyimpan berkas gambar PNG</li>
                            <li>• Cetak QR Code dan tempelkan pada kendaraan armada untuk discan di aplikasi TimbangQR</li>
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
                            {/* Status Indicator */}
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${
                                    armada.isQrUsed
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${armada.isQrUsed ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                                    {armada.isQrUsed ? 'QR HANGUS' : 'QR AKTIF (SIAP SCAN)'}
                                </span>
                                {armada.lastTicketNumber && (
                                    <span className="text-[11px] text-gray-500 font-mono">
                                        Tiket: {armada.lastTicketNumber}
                                    </span>
                                )}
                            </div>

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

                            {/* Alert if QR is burned */}
                            {armada.isQrUsed && (
                                <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                                    <p className="text-xs font-semibold text-rose-800">
                                        QR Code ini sudah hangus
                                    </p>
                                    <p className="text-[11px] text-rose-600 mt-0.5">
                                        Sudah dipakai pada penimbangan. Klik tombol "Generate Ulang" di bawah untuk trip berikutnya.
                                    </p>
                                </div>
                            )}

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
                                <div className={`p-4 rounded-xl border-2 flex items-center justify-center mb-4 transition-colors ${
                                    armada.isQrUsed
                                        ? 'bg-rose-50/50 border-rose-300 opacity-60 relative'
                                        : 'bg-white border-gray-200'
                                }`}>
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
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                                            armada.isQrUsed
                                                ? 'bg-linear-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-md shadow-orange-100 ring-2 ring-orange-400/40'
                                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {armada.isQrUsed ? '⚡ Generate QR Ulang Sekarang' : 'Generate Ulang'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* API Documentation Modal */}
            {showApiModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                                    Dokumentasi API TimbangQR & QR Generator
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Gunakan endpoint ini di aplikasi timbangan atau mobile scanner Anda
                                </p>
                            </div>
                            <button
                                onClick={() => setShowApiModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-1">1. Ambil Semua Armada & Data QR</h4>
                                <div className="bg-gray-900 text-green-400 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                                    GET /api/integrations/timbangqr/qr-generator
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Mengembalikan daftar seluruh armada aktif beserta string QR Code unik, plat nomor, supir, dan nama LPS.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-1">2. Lookup / Validasi Hasil Scan QR Code</h4>
                                <div className="bg-gray-900 text-green-400 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                                    GET /api/integrations/timbangqr/qr-generator?code=&#123;scanned_code&#125;
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Contoh: <code className="bg-gray-100 px-1 py-0.5 rounded">?code=BM8081TT</code> atau string QR armada lainnya.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-1">3. Lookup Armada Berdasarkan Plat Nomor</h4>
                                <div className="bg-gray-900 text-green-400 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                                    GET /api/integrations/timbangqr/qr-generator?plate=BM8081TT
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Dukungan format plat fleksibel (dengan spasi maupun tanpa spasi).
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-1">4. Render Gambar QR Code Langsung (SVG Image)</h4>
                                <div className="bg-gray-900 text-green-400 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                                    GET /api/qr-generator?plate=BM8081TT&amp;format=svg
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Bisa langsung dipasang di tag <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;img src="..." /&gt;</code> atau dicetak.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-1">5. Generate / Regenerate QR Code (POST)</h4>
                                <div className="bg-gray-900 text-blue-300 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                                    POST /api/integrations/timbangqr/qr-generator<br />
                                    Body: &#123; &quot;platNomor&quot;: &quot;BM 8081 TT&quot;, &quot;regenerate&quot;: true &#125;
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900">
                                <strong>💡 Autentikasi Integrasi:</strong> Kirim header{' '}
                                <code className="bg-white px-1.5 py-0.5 rounded border">
                                    Authorization: Bearer &lt;TIMBANGQR_INTEGRATION_SECRET&gt;
                                </code>{' '}
                                untuk akses server-ke-server terverifikasi, atau query <code className="bg-white px-1.5 py-0.5 rounded border">?secret=...</code>.
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setShowApiModal(false)}
                                className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
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
