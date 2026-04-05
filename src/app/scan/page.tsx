'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatedBackground, GlassCard } from '@/components/ui';
import { Html5Qrcode } from 'html5-qrcode';
import { useSession, signOut } from 'next-auth/react';

interface ScanResult {
    armadaQrCode: string | null;
    armadaInfo: { platNomor: string; namaLps: string; namaSupir: string } | null;
}

export default function ScanPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (sessionStatus === 'loading') return;

        if (session?.user?.role) {
            const blockedRoles = ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'];
            if (blockedRoles.includes(session.user.role.toUpperCase())) {
                router.replace('/dashboard');
            }
        }
    }, [session, sessionStatus, router]);

    const [scanResult, setScanResult] = useState<ScanResult>({
        armadaQrCode: null,
        armadaInfo: null,
    });
    const [scanning, setScanning] = useState(false);
    const [beratKg, setBeratKg] = useState('');
    const [status, setStatus] = useState<'MASUK' | 'KELUAR'>('MASUK');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const handleLogout = () => {
        signOut({ callbackUrl: '/' });
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop();
            }
        };
    }, []);

    // Start scanner when scanning state changes
    useEffect(() => {
        if (!scanning) return;

        const initScanner = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = document.getElementById('qr-reader');
            if (!element) {
                console.error('qr-reader element not found');
                setMessage({ type: 'error', text: 'Scanner element not found' });
                setScanning(false);
                return;
            }

            try {
                const scanner = new Html5Qrcode('qr-reader');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText) => {
                        await scanner.stop();
                        setScanning(false);

                        // Validate QR code
                        const res = await fetch(`/api/validate-qr?code=${encodeURIComponent(decodedText)}&type=armada`);
                        const data = await res.json();

                        if (data.valid) {
                            setScanResult({
                                armadaQrCode: decodedText,
                                armadaInfo: data.data,
                            });
                        } else {
                            setMessage({ type: 'error', text: data.message || 'QR Code tidak valid' });
                        }
                    },
                    () => { }
                );
            } catch (error) {
                console.error('Scanner error:', error);
                setMessage({ type: 'error', text: 'Gagal mengakses kamera' });
                setScanning(false);
            }
        };

        initScanner();
    }, [scanning]);

    const startScan = () => {
        setScanning(true);
        setMessage(null);
    };

    const stopScan = async () => {
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
        }
        setScanning(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanResult.armadaQrCode || !beratKg) {
            setMessage({ type: 'error', text: 'Mohon scan QR Armada dan isi berat sampah' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/waste-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    armadaQrCode: scanResult.armadaQrCode,
                    beratKg: parseFloat(beratKg),
                    status,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                // Reset form
                setScanResult({
                    armadaQrCode: null,
                    armadaInfo: null,
                });
                setBeratKg('');
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setSubmitting(false);
        }
    };

    const clearScanResult = () => {
        setScanResult({ armadaQrCode: null, armadaInfo: null });
    };

    return (
        <AnimatedBackground>
            <div className="min-h-screen p-4 md:p-8">
                <div className="max-w-lg mx-auto space-y-6">
                    {/* Header with User Info and Logout */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-center flex-1">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Scan & Input</h1>
                            <p className="text-gray-500">Input data sampah masuk/keluar TPA</p>
                        </div>
                        {session?.user && (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
                                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                        {session.user.role}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                    title="Logout"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                            <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    {/* Scanner Modal */}
                    {scanning && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                            <div className="w-full max-w-md">
                                <div id="qr-reader" className="rounded-xl overflow-hidden mb-4" />
                                <button onClick={stopScan} className="w-full py-3 bg-white text-gray-800 rounded-xl font-medium">
                                    Batal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Scan Armada */}
                    <GlassCard hover={false}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                                </svg>
                                Armada LPS
                                <span className="text-red-500">*</span>
                            </h2>
                            {scanResult.armadaInfo && (
                                <button onClick={clearScanResult} className="text-red-500 text-sm font-medium">
                                    Hapus
                                </button>
                            )}
                        </div>

                        {scanResult.armadaInfo ? (
                            <div className="p-4 bg-green-100 border border-green-300 rounded-xl">
                                <p className="text-green-700 font-semibold">{scanResult.armadaInfo.namaLps}</p>
                                <p className="text-gray-600 text-sm">{scanResult.armadaInfo.platNomor}</p>
                                <p className="text-gray-500 text-xs mt-1">Supir: {scanResult.armadaInfo.namaSupir}</p>
                            </div>
                        ) : (
                            <button
                                onClick={startScan}
                                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors"
                            >
                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                Scan QR Armada LPS
                            </button>
                        )}
                    </GlassCard>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Berat */}
                        <GlassCard hover={false}>
                            <label className="block text-gray-600 text-sm mb-2 font-medium">
                                Berat Sampah (kg) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={beratKg}
                                onChange={(e) => setBeratKg(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-2xl font-bold text-center text-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                        </GlassCard>

                        {/* Status */}
                        <GlassCard hover={false}>
                            <label className="block text-gray-600 text-sm mb-3 font-medium">Status</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStatus('MASUK')}
                                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${status === 'MASUK'
                                        ? 'bg-green-100 border-2 border-green-500'
                                        : 'bg-gray-50 border-2 border-gray-200'
                                        }`}
                                >
                                    <svg className={`w-8 h-8 ${status === 'MASUK' ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span className={status === 'MASUK' ? 'text-green-700 font-semibold' : 'text-gray-500'}>
                                        MASUK TPA
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('KELUAR')}
                                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${status === 'KELUAR'
                                        ? 'bg-orange-100 border-2 border-orange-500'
                                        : 'bg-gray-50 border-2 border-gray-200'
                                        }`}
                                >
                                    <svg className={`w-8 h-8 ${status === 'KELUAR' ? 'text-orange-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span className={status === 'KELUAR' ? 'text-orange-700 font-semibold' : 'text-gray-500'}>
                                        KELUAR TPA
                                    </span>
                                </button>
                            </div>
                        </GlassCard>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !scanResult.armadaQrCode || !beratKg}
                            className="w-full py-4 bg-linear-to-r from-purple-600 to-purple-700 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </form>

                    {/* Back Link */}
                    <Link href="/" className="block text-center text-gray-500 hover:text-purple-600 transition-colors">
                        ← Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </AnimatedBackground>
    );
}
