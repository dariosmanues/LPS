'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function AuthPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const endpoint = activeTab === 'register' ? '/api/auth/register' : '/api/auth/login'
            const body = activeTab === 'register'
                ? { name: formData.name, email: formData.email, password: formData.password }
                : { email: formData.email, password: formData.password }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await res.json()

            if (!data.success) {
                setError(data.error || 'Terjadi kesalahan.')
                return
            }

            // Redirect to dashboard on success
            router.push('/')
            router.refresh()
        } catch {
            setError('Gagal terhubung ke server.')
        } finally {
            setLoading(false)
        }
    }

    const inputWrapperClasses = "relative group flex items-center";
    const iconWrapperClasses = "absolute left-4 text-white/30 group-focus-within:text-emerald-400 transition-colors pointer-events-none";
    const inputClasses = "w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-white placeholder-white/30 font-medium tracking-wide";
    const labelClasses = "block text-[10px] font-bold text-white/50 mb-2 tracking-widest uppercase";

    return (
        <div className="min-h-screen bg-[#0a0f14] text-white selection:bg-emerald-500/30 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background ambient glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen" />
            </div>

            {/* Back Button */}
            <Link 
                href="/"
                className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:-translate-x-1 group z-20 hidden md:flex"
            >
                <ChevronLeft className="w-6 h-6 text-white/70 group-hover:text-emerald-400 transition-colors" />
            </Link>

            <div className="w-full max-w-md relative z-10">
                {/* Logo or Brand */}
                <div className="text-center mb-8">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    >
                        <ShieldCheck className="w-8 h-8 text-black" />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-600"
                    >
                        Portal LPS
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/50 text-sm font-medium tracking-wide"
                    >
                        Masuk atau daftar untuk mengelola laporan
                    </motion.p>
                </div>

                {/* Main Auth Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden"
                >
                    {/* Card Inner Glow */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                    {/* Tabs */}
                    <nav className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 mb-8 relative z-10">
                        {['login', 'register'].map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab as 'login' | 'register'); setError('') }}
                                    className={cn(
                                        "relative flex-1 py-3 text-sm font-bold rounded-xl transition-colors duration-300 z-10 capitalize tracking-wide",
                                        isActive ? "text-emerald-50" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="auth-tab"
                                            className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab}</span>
                                </button>
                            )
                        })}
                    </nav>

                    {/* Form Container */}
                    <div className="relative z-10 min-h-[300px]">
                        <AnimatePresence mode="wait">
                            <motion.form
                                key={activeTab}
                                initial={{ opacity: 0, x: activeTab === 'login' ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: activeTab === 'login' ? 20 : -20 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                {activeTab === 'register' && (
                                    <div className="space-y-2">
                                        <label className={labelClasses}>Nama Lengkap</label>
                                        <div className={inputWrapperClasses}>
                                            <div className={iconWrapperClasses}><User className="w-5 h-5" /></div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className={inputClasses}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className={labelClasses}>Alamat Email</label>
                                    <div className={inputWrapperClasses}>
                                        <div className={iconWrapperClasses}><Mail className="w-5 h-5" /></div>
                                        <input
                                            type="email"
                                            required
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className={labelClasses}>Password</label>
                                        {activeTab === 'login' && (
                                            <Link href="#" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold tracking-wide uppercase">Lupa Password?</Link>
                                        )}
                                    </div>
                                    <div className={inputWrapperClasses}>
                                        <div className={iconWrapperClasses}><Lock className="w-5 h-5" /></div>
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative flex items-center justify-center gap-2 w-full mt-8 px-6 py-4 bg-emerald-500 text-black rounded-2xl font-extrabold hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100 overflow-hidden"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/20 border-t-black"></div>
                                    ) : (
                                        <>
                                            <span className="relative z-10">{activeTab === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang'}</span>
                                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
            
            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    )
}
