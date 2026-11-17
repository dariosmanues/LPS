'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const AVATAR_UPDATED_EVENT = 'superadmin-avatar-updated';
const AVATAR_OPEN_MODAL_EVENT = 'superadmin-avatar-open-modal';

export function triggerSuperAdminAvatarModal() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AVATAR_OPEN_MODAL_EVENT));
    }
}

export function notifySuperAdminAvatarUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT));
    }
}

/**
 * URL foto profil PER USER.
 * - Tanpa userId  : foto milik akun yang sedang login.
 * - Dengan userId : foto milik user tersebut (mis. di daftar Users).
 */
export function useSuperAdminAvatarUrl(userId?: string | null) {
    const version = useAvatarVersion();
    return getUserAvatarUrl(userId, version);
}

export function getUserAvatarUrl(userId?: string | null, version: number = 1) {
    const params = new URLSearchParams({ v: String(version) });
    if (userId) params.set('userId', userId);
    return `/api/superadmin-avatar?${params.toString()}`;
}

/** Versi foto (berubah setiap ada update) untuk dipakai bersama getUserAvatarUrl */
export function useAvatarVersion() {
    const [version, setVersion] = useState<number>(1);
    useEffect(() => {
        const handleUpdate = () => setVersion(Date.now());
        window.addEventListener(AVATAR_UPDATED_EVENT, handleUpdate);
        return () => window.removeEventListener(AVATAR_UPDATED_EVENT, handleUpdate);
    }, []);
    return version;
}

interface SuperAdminAvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
    userEmail?: string;
}

export function SuperAdminAvatarModal({
    isOpen,
    onClose,
    userName = 'Nisa',
    userEmail = 'superadmin@lps.pekanbaru.go.id',
}: SuperAdminAvatarModalProps) {
    const avatarUrl = useSuperAdminAvatarUrl();
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fetchMeta = useCallback(async () => {
        try {
            const res = await fetch('/api/superadmin-avatar?meta=1', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setHasCustomAvatar(Boolean(data.hasCustomAvatar));
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setPreviewDataUrl(null);
            setFeedback(null);
            fetchMeta();
        }
    }, [isOpen, fetchMeta]);

    if (!isOpen) return null;

    // Resize & compress image on client so even large phone photos upload quickly and smoothly
    const processImageFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const MAX_SIZE = 720;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height = Math.round((height * MAX_SIZE) / width);
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width = Math.round((width * MAX_SIZE) / height);
                            height = MAX_SIZE;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(e.target?.result as string);
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                    resolve(compressedDataUrl);
                };
                img.onerror = () => reject(new Error('Gagal membaca file gambar.'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Gagal membaca file.'));
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFeedback(null);

        if (!file.type.startsWith('image/')) {
            setFeedback({ type: 'error', message: 'Pilih file berupa gambar (JPG, PNG, atau WEBP).' });
            return;
        }

        try {
            const dataUrl = await processImageFile(file);
            setPreviewDataUrl(dataUrl);
        } catch {
            setFeedback({ type: 'error', message: 'Gagal memproses gambar. Coba pilih foto lain.' });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSave = async () => {
        if (!previewDataUrl) return;
        setSaving(true);
        setFeedback(null);

        try {
            const res = await fetch('/api/superadmin-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataUrl: previewDataUrl }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setPreviewDataUrl(null);
                setHasCustomAvatar(true);
                notifySuperAdminAvatarUpdated();
                setFeedback({ type: 'success', message: 'Foto profil berhasil diperbarui!' });
            } else {
                setFeedback({ type: 'error', message: data.error || 'Gagal menyimpan foto profil.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat menyimpan foto.' });
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefault = async () => {
        setResetting(true);
        setFeedback(null);

        try {
            const res = await fetch('/api/superadmin-avatar', {
                method: 'DELETE',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setPreviewDataUrl(null);
                setHasCustomAvatar(false);
                notifySuperAdminAvatarUpdated();
                setFeedback({ type: 'success', message: 'Foto profil dikembalikan ke foto awal.' });
            } else {
                setFeedback({ type: 'error', message: data.error || 'Gagal mengembalikan foto awal.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'Terjadi kesalahan saat mereset foto.' });
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden z-10">
                {/* Top Header */}
                <div className="px-6 py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-base leading-tight">Foto Profil Super Admin</h3>
                            <p className="text-[11px] text-purple-100">Khusus Akun {userName}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Tutup"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center text-center space-y-5">
                    {/* Avatar Circle Preview */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-purple-200 shadow-xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <img
                                src={previewDataUrl || avatarUrl}
                                alt={userName}
                                className="w-full h-full object-cover object-center"
                                onError={(e) => {
                                    const img = e.currentTarget as HTMLImageElement;
                                    img.onerror = null;
                                    img.style.visibility = 'hidden';
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg border-2 border-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                            title="Pilih Foto Baru"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* User Info */}
                    <div>
                        <div className="flex items-center justify-center gap-2">
                            <h4 className="font-bold text-gray-800 text-lg">{userName}</h4>
                            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                Super Admin
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>
                        {previewDataUrl && (
                            <span className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                                ✨ Pratinjau Foto Baru (Belum Disimpan)
                            </span>
                        )}
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Feedback Banner */}
                    {feedback && (
                        <div
                            className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 ${feedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                        >
                            <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
                            <span>{feedback.message}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="w-full space-y-2.5 pt-1">
                        {previewDataUrl ? (
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setPreviewDataUrl(null)}
                                    disabled={saving}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Foto Profil'}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>Pilih / Upload Foto Baru</span>
                            </button>
                        )}

                        {hasCustomAvatar && !previewDataUrl && (
                            <button
                                type="button"
                                onClick={handleResetToDefault}
                                disabled={resetting}
                                className="w-full py-2 px-4 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors cursor-pointer"
                            >
                                {resetting ? 'Mengembalikan...' : 'Kembalikan ke Foto Awal'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
