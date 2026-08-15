'use client';

import { useState, useRef } from 'react';
import { GlassCard } from '@/components/ui';

export default function TransformPembelianPage() {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        stats?: { totalRawRows: number; processed: number; skippedNoise: number; skippedHeaders: number; skippedEmpty: number; skippedTotals: number; formatDetected?: string; dateSource?: string };
        detectedColumns?: Record<string, string | null>;
        error?: string;
        availableColumns?: string[];
    } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };



    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.match(/\.(xlsx|xls)$/i)) {
                setFile(droppedFile);
                setResult(null);
            } else {
                setResult({
                    success: false,
                    message: 'Format file tidak didukung. Gunakan file .xlsx atau .xls',
                });
            }
        }
    };

    const handleTransform = async () => {
        if (!file) return;

        setProcessing(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/transform-pembelian', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                // Successful - download the file
                const blob = await res.blob();
                const statsHeader = res.headers.get('X-Stats');
                const columnsHeader = res.headers.get('X-Detected-Columns');
                const stats = statsHeader ? JSON.parse(statsHeader) : null;
                const detectedColumns = columnsHeader ? JSON.parse(columnsHeader) : null;

                // Trigger download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const disposition = res.headers.get('Content-Disposition');
                const filename = disposition?.match(/filename="(.+)"/)?.[1] || 'Rekapitulasi_Pembelian.xlsx';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                setResult({
                    success: true,
                    message: 'Transformasi berhasil! File sudah didownload.',
                    stats,
                    detectedColumns,
                });
            } else {
                const errorData = await res.json();
                setResult({
                    success: false,
                    message: errorData.error || 'Gagal memproses file',
                    availableColumns: errorData.availableColumns,
                    detectedColumns: errorData.detectedColumns,
                });
            }
        } catch (error) {
            console.error('Transform error:', error);
            setResult({
                success: false,
                message: 'Terjadi kesalahan saat memproses file',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Transform Laporan Pembelian</h1>
                <p className="text-gray-500 text-sm">Konversi data laporan transaksi pembelian ke format rekapitulasi Excel (.xlsx)</p>
            </div>

            {/* Info Card */}
            <GlassCard hover={false}>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">Aturan Pemetaan Kolom</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">No. Transaksi</span>
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="font-medium text-gray-800">NO TIKET</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Plat No</span>
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="font-medium text-gray-800">NO POLISI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Nama Supir</span>
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="font-medium text-gray-800">NAMA SUPIR</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Nama Kebun</span>
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="font-medium text-gray-800">PENGIRIM</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Timbang 1</span>
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="font-medium text-gray-800">GROSS (KG)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Timbang 2</span>
                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="font-medium text-gray-800">TARE (KG)</span>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded-lg">NETTO 1 = GROSS − TARE</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-lg">RAFAKSI = 0</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-lg">NETTO 2 = NETTO 1</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-lg">NO = Auto-increment</span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Upload Area */}
            <GlassCard hover={false}>
                <div className="space-y-6">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload File Sumber
                    </h3>

                    <div className="max-w-xl">
                        {/* Source File Area */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">File Excel (.xls/.xlsx)</h4>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <div
                                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                                    dragActive
                                        ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                                        : file
                                            ? 'border-emerald-300 bg-emerald-50/50'
                                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-700 text-sm">Drag file Data ke sini</p>
                                            <p className="text-xs text-gray-400 mt-0.5">atau klik untuk memilih</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleTransform}
                            disabled={!file || processing}
                            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Transform & Download
                                </>
                            )}
                        </button>
                        {file && (
                            <button
                                onClick={handleReset}
                                disabled={processing}
                                className="px-6 py-3.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Result Card */}
            {result && (
                <GlassCard hover={false}>
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                            {result.success ? (
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold">{result.success ? 'Berhasil!' : 'Gagal'}</h3>
                                <p className="text-sm opacity-80">{result.message}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        {result.stats && (
                            <div className="space-y-3">
                            {/* Format & Date Info */}
                            <div className="flex flex-wrap gap-2">
                                {result.stats.formatDetected && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Format: {result.stats.formatDetected}
                                    </span>
                                )}
                                {result.stats.dateSource && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Tanggal: dari {result.stats.dateSource}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <p className="text-sm text-blue-600 font-medium">Total Baris File</p>
                                    <p className="text-2xl font-bold text-blue-800">{result.stats.totalRawRows}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <p className="text-sm text-emerald-600 font-medium">Data Diproses</p>
                                    <p className="text-2xl font-bold text-emerald-800">{result.stats.processed}</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                    <p className="text-sm text-amber-600 font-medium">Noise / Header</p>
                                    <p className="text-2xl font-bold text-amber-800">{result.stats.skippedNoise + result.stats.skippedHeaders}</p>
                                </div>
                                {result.stats.skippedTotals > 0 && (
                                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                        <p className="text-sm text-red-600 font-medium">Total Ditolak</p>
                                        <p className="text-2xl font-bold text-red-800">{result.stats.skippedTotals}</p>
                                    </div>
                                )}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <p className="text-sm text-gray-600 font-medium">Baris Kosong</p>
                                    <p className="text-2xl font-bold text-gray-800">{result.stats.skippedEmpty}</p>
                                </div>
                            </div>
                            </div>
                        )}

                        {/* Detected Columns */}
                        {result.detectedColumns && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Kolom Terdeteksi:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(result.detectedColumns).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2 text-sm">
                                            {value ? (
                                                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            <span className="text-gray-600">{key}:</span>
                                            <span className={`font-medium ${value ? 'text-gray-800' : 'text-red-500'}`}>
                                                {value || 'Tidak ditemukan'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Available Columns (on error) */}
                        {result.availableColumns && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Kolom yang tersedia di file:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.availableColumns.map((col, idx) => (
                                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-mono">
                                            {col}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* Help Section */}
            <GlassCard hover={false}>
                <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Panduan Format File Sumber
                        </h3>
                        <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                        <p>File sumber harus berupa Excel (.xlsx / .xls) dengan kolom-kolom berikut:</p>
                        <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                            <table className="text-xs w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Kolom Sumber</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Kolom Hasil</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <tr><td className="py-2 px-3 font-mono">No. Transaksi</td><td className="py-2 px-3">NO TIKET</td><td className="py-2 px-3 text-gray-400">Nomor tiket transaksi</td></tr>
                                    <tr><td className="py-2 px-3 font-mono">Plat No</td><td className="py-2 px-3">NO POLISI</td><td className="py-2 px-3 text-gray-400">Plat nomor kendaraan</td></tr>
                                    <tr><td className="py-2 px-3 font-mono">Nama Supir</td><td className="py-2 px-3">NAMA SUPIR</td><td className="py-2 px-3 text-gray-400">Nama pengemudi</td></tr>
                                    <tr><td className="py-2 px-3 font-mono">Nama Kebun</td><td className="py-2 px-3">PENGIRIM</td><td className="py-2 px-3 text-gray-400">Simbol khusus dibersihkan otomatis</td></tr>
                                    <tr><td className="py-2 px-3 font-mono">Transaksi Timbang 1</td><td className="py-2 px-3">GROSS (KG)</td><td className="py-2 px-3 text-gray-400">Berat kotor</td></tr>
                                    <tr><td className="py-2 px-3 font-mono">Transaksi Timbang 2</td><td className="py-2 px-3">TARE (KG)</td><td className="py-2 px-3 text-gray-400">Berat kendaraan</td></tr>
                                    <tr><td className="py-2 px-3 font-mono text-gray-400 italic">Otomatis</td><td className="py-2 px-3">NETTO 1 (KG)</td><td className="py-2 px-3 text-gray-400">GROSS − TARE</td></tr>
                                    <tr><td className="py-2 px-3 font-mono text-gray-400 italic">Konstan</td><td className="py-2 px-3">RAFAKSI</td><td className="py-2 px-3 text-gray-400">Selalu 0</td></tr>
                                    <tr><td className="py-2 px-3 font-mono text-gray-400 italic">Otomatis</td><td className="py-2 px-3">NETTO 2 (Kg)</td><td className="py-2 px-3 text-gray-400">Sama dengan NETTO 1</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </details>
            </GlassCard>
        </div>
    );
}
