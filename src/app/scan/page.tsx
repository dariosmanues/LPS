'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatedBackground, GlassCard } from '@/components/ui';
import { Html5Qrcode } from 'html5-qrcode';
import { useSession, signOut } from 'next-auth/react';

interface ScanResult {
    armadaQrCode: string | null;
    armadaInfo: { platNomor: string; namaLps: string; namaSupir: string } | null;
}

interface SerialPortInfo {
    path: string;
    manufacturer: string;
    serialNumber: string;
    pnpId: string;
}

interface SerialConfig {
    path: string;
    baudRate: number;
    dataBits: number;
    parity: string;
    stopBits: number;
    delimiter: string;
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

    // --- RS232 Serial Port State ---
    const [serialConnected, setSerialConnected] = useState(false);
    const [serialConnecting, setSerialConnecting] = useState(false);
    const [serialError, setSerialError] = useState<string | null>(null);
    const [serialData, setSerialData] = useState<string | null>(null);
    const [serialDataLog, setSerialDataLog] = useState<string[]>([]);
    const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
    const [showSerialConfig, setShowSerialConfig] = useState(false);
    const [autoFillWeight, setAutoFillWeight] = useState(true);
    const [serialConfig, setSerialConfig] = useState<SerialConfig>({
        path: 'COM3',
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        delimiter: '\r\n',
    });
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleLogout = () => {
        signOut({ callbackUrl: '/' });
    };

    // --- Scanner cleanup ---
    useEffect(() => {
        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop();
            }
        };
    }, []);

    // --- Serial Port: List available ports ---
    const fetchPorts = useCallback(async () => {
        try {
            const res = await fetch('/api/serial?action=ports');
            const data = await res.json();
            if (data.success) {
                setAvailablePorts(data.ports);
            }
        } catch {
            console.error('Failed to fetch ports');
        }
    }, []);

    // --- Serial Port: Poll for data ---
    const startPolling = useCallback(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch('/api/serial?action=consume');
                const result = await res.json();

                if (!result.isConnected) {
                    setSerialConnected(false);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    return;
                }

                if (result.data) {
                    setSerialData(result.data);
                    setSerialDataLog((prev) => [...prev.slice(-19), result.data]);

                    // Auto-fill weight if enabled — try to parse number from data
                    if (autoFillWeight) {
                        const match = result.data.match(/[\d.]+/);
                        if (match) {
                            setBeratKg(match[0]);
                        }
                    }
                }
            } catch {
                // Ignore polling errors silently
            }
        }, 500);
    }, [autoFillWeight]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    // --- Serial Port: Check initial status ---
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/serial?action=status');
                const data = await res.json();
                if (data.isConnected) {
                    setSerialConnected(true);
                    startPolling();
                }
            } catch {
                // Ignore
            }
        };
        checkStatus();
    }, [startPolling]);

    // --- Serial Port: Connect ---
    const connectSerial = async () => {
        setSerialConnecting(true);
        setSerialError(null);

        try {
            const res = await fetch('/api/serial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'connect',
                    config: serialConfig,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSerialConnected(true);
                setSerialError(null);
                startPolling();
                setMessage({ type: 'success', text: `✅ Terhubung ke ${serialConfig.path}` });
            } else {
                setSerialError(data.message);
                setMessage({ type: 'error', text: `❌ ${data.message}` });
            }
        } catch {
            setSerialError('Gagal menghubungi server');
            setMessage({ type: 'error', text: '❌ Gagal menghubungi server' });
        } finally {
            setSerialConnecting(false);
        }
    };

    // --- Serial Port: Disconnect ---
    const disconnectSerial = async () => {
        try {
            const res = await fetch('/api/serial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect' }),
            });

            const data = await res.json();
            if (data.success) {
                setSerialConnected(false);
                stopPolling();
                setSerialData(null);
                setMessage({ type: 'success', text: '🔌 Koneksi serial diputus' });
            }
        } catch {
            setMessage({ type: 'error', text: '❌ Gagal memutus koneksi' });
        }
    };

    // --- Serial Port: Send data ---
    const sendSerialData = async (data: string) => {
        try {
            const res = await fetch('/api/serial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', data }),
            });

            const result = await res.json();
            if (!result.success) {
                setMessage({ type: 'error', text: `❌ ${result.message}` });
            }
        } catch {
            setMessage({ type: 'error', text: '❌ Gagal mengirim data' });
        }
    };

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

                    {/* RS232 Serial Connection Panel */}
                    <GlassCard hover={false}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Koneksi RS232
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${serialConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                            </h2>
                            <button
                                onClick={() => {
                                    setShowSerialConfig(!showSerialConfig);
                                    if (!showSerialConfig) fetchPorts();
                                }}
                                className="text-sm text-blue-500 hover:text-blue-700 transition-colors font-medium"
                            >
                                {showSerialConfig ? 'Tutup ▲' : 'Konfigurasi ▼'}
                            </button>
                        </div>

                        {/* Connection status */}
                        <div className="flex items-center gap-3 mb-3">
                            {serialConnected ? (
                                <button
                                    onClick={disconnectSerial}
                                    className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors text-sm border border-red-200"
                                >
                                    🔌 Putuskan Koneksi
                                </button>
                            ) : (
                                <button
                                    onClick={connectSerial}
                                    disabled={serialConnecting}
                                    className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors text-sm disabled:opacity-50 border border-blue-200"
                                >
                                    {serialConnecting ? '⏳ Menghubungkan...' : `🔗 Hubungkan ke ${serialConfig.path}`}
                                </button>
                            )}
                        </div>

                        {/* Serial data display */}
                        {serialConnected && serialData && (
                            <div className="p-3 bg-gray-900 rounded-xl text-green-400 font-mono text-lg text-center mb-3">
                                📩 {serialData}
                            </div>
                        )}

                        {/* Auto-fill toggle */}
                        {serialConnected && (
                            <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoFillWeight}
                                    onChange={(e) => setAutoFillWeight(e.target.checked)}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                Auto-isi berat dari data serial
                            </label>
                        )}

                        {/* Serial error */}
                        {serialError && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs mb-3">
                                ⚠️ {serialError}
                            </div>
                        )}

                        {/* Config Panel */}
                        {showSerialConfig && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                                {/* Available ports */}
                                {availablePorts.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Port Tersedia</label>
                                        <div className="space-y-1">
                                            {availablePorts.map((p) => (
                                                <button
                                                    key={p.path}
                                                    onClick={() => setSerialConfig({ ...serialConfig, path: p.path })}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                        serialConfig.path === p.path
                                                            ? 'bg-blue-100 border border-blue-300 text-blue-700'
                                                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <span className="font-mono font-semibold">{p.path}</span>
                                                    <span className="text-xs text-gray-400 ml-2">({p.manufacturer})</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Port</label>
                                        <input
                                            type="text"
                                            value={serialConfig.path}
                                            onChange={(e) => setSerialConfig({ ...serialConfig, path: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                            placeholder="COM3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Baud Rate</label>
                                        <select
                                            value={serialConfig.baudRate}
                                            onChange={(e) => setSerialConfig({ ...serialConfig, baudRate: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                        >
                                            <option value={4800}>4800</option>
                                            <option value={9600}>9600</option>
                                            <option value={19200}>19200</option>
                                            <option value={38400}>38400</option>
                                            <option value={57600}>57600</option>
                                            <option value={115200}>115200</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Data Bits</label>
                                        <select
                                            value={serialConfig.dataBits}
                                            onChange={(e) => setSerialConfig({ ...serialConfig, dataBits: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                        >
                                            <option value={7}>7</option>
                                            <option value={8}>8</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Parity</label>
                                        <select
                                            value={serialConfig.parity}
                                            onChange={(e) => setSerialConfig({ ...serialConfig, parity: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                        >
                                            <option value="none">None</option>
                                            <option value="even">Even</option>
                                            <option value="odd">Odd</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Stop Bits</label>
                                        <select
                                            value={serialConfig.stopBits}
                                            onChange={(e) => setSerialConfig({ ...serialConfig, stopBits: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Delimiter</label>
                                        <input
                                            type="text"
                                            value={serialConfig.delimiter}
                                            onChange={(e) => setSerialConfig({ ...serialConfig, delimiter: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                            placeholder="\r\n"
                                        />
                                    </div>
                                </div>

                                {/* Data log */}
                                {serialDataLog.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-medium text-gray-500">Log Data Serial</label>
                                            <button
                                                onClick={() => setSerialDataLog([])}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Hapus Log
                                            </button>
                                        </div>
                                        <div className="max-h-32 overflow-y-auto p-2 bg-gray-900 rounded-lg text-xs font-mono text-green-400 space-y-0.5">
                                            {serialDataLog.map((line, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <span className="text-gray-600 select-none">{String(i + 1).padStart(2, '0')}</span>
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>

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
                            <div className="relative">
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
                                {serialConnected && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        RS232
                                    </span>
                                )}
                            </div>
                            {serialConnected && autoFillWeight && (
                                <p className="text-xs text-blue-500 mt-1 text-center">
                                    ⚡ Auto-isi dari timbangan via RS232
                                </p>
                            )}
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
