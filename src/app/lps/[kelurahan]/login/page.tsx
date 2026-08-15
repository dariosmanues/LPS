
'use client';

import { useState, use } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatedBackground, GlassCard } from '@/components/ui';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function LpsLoginPage({ params }: { params: Promise<{ kelurahan: string }> }) {
    const { kelurahan } = use(params);
    const [email, setEmail] = useState(`ketua.${kelurahan}@lps.pekanbaru.go.id`);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Format kelurahan slug to Title Case for display
    // e.g., "simpangbaru" -> "Simpangbaru" (Simple formatting)
    // For better formatting we might need to fetch from DB, but this suffices for now.
    const displayNama = kelurahan.charAt(0).toUpperCase() + kelurahan.slice(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error || !result?.ok) {
                setError('Email atau password salah');
                setLoading(false);
            } else {
                // Full page navigation so middleware reads updated auth cookie
                window.location.href = '/lps';
            }
        } catch {
            setError('Terjadi kesalahan, silakan coba lagi');
            setLoading(false);
        }
    };

    return (
        <AnimatedBackground>
            <div className="min-h-screen flex items-center justify-center p-6">
                <GlassCard className="w-full max-w-md p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Logo size="lg" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Login LPS {displayNama}</h1>
                        <p className="text-gray-500 text-sm">Sistem Pengelolaan Sampah Pekanbaru</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                placeholder={`ketua.${kelurahan}@lps.pekanbaru.go.id`}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                            ← Login Staff/Admin
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </AnimatedBackground>
    );
}
