'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function AdminAuthPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        // Simulate API call for Admin Auth
        setTimeout(() => {
            setLoading(false)
            if (formData.email === 'admin@lps.com' && formData.password === 'admin123') {
                document.cookie = "admin_token=admin_simulated_token; path=/; max-age=86400"
                window.location.href = '/admin'
            } else {
                setError('Email atau password admin salah')
            }
        }, 1000)
    }

    const inputWrapperClasses = "relative group flex items-center";
    const iconWrapperClasses = "absolute left-4 text-white/30 group-focus-within:text-emerald-400 transition-colors pointer-events-none";
    const inputClasses = "w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-white placeholder-white/30 font-medium tracking-wide";
    const labelClasses = "block text-[10px] font-bold text-white/50 mb-2 tracking-widest uppercase";

    return (
        <div className="min-h-screen bg-[#0a0f14] text-white selection:bg-emerald-500/30 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen" />
            </div>

            <Link 
                href="/"
                className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:-translate-x-1 group z-20 hidden md:flex"
            >
                <ChevronLeft className="w-6 h-6 text-white/70 group-hover:text-emerald-400 transition-colors" />
            </Link>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    >
                        <ShieldCheck className="w-8 h-8 text-black" />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-600"
                    >
                        Admin Portal
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/50 text-sm font-medium tracking-wide"
                    >
                        Masuk untuk mengelola laporan LPS
                    </motion.p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden"
                >
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className={labelClasses}>Email Admin</label>
                                <div className={inputWrapperClasses}>
                                    <div className={iconWrapperClasses}><Mail className="w-5 h-5" /></div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="admin@lps.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={labelClasses}>Password</label>
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
                                        <span className="relative z-10">Masuk sebagai Admin</span>
                                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
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
