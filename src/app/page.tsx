import Link from 'next/link';
import { AnimatedBackground, Logo } from '@/components/ui';
import ScanLinkCard from '@/components/ScanLinkCard';

export default function Home() {
  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
        {/* Logos - Top Left */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {/* Pemko Pekanbaru */}
          <div className="relative p-2 rounded-2xl backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:scale-105 transition-transform duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/30 to-transparent opacity-60 rounded-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pekanbaru-logo.png"
              alt="Kota Pekanbaru"
              className="relative z-10 h-14 w-auto object-contain drop-shadow-md"
            />
          </div>
          {/* DLHK */}
          <div className="relative p-2 rounded-2xl backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:scale-105 transition-transform duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/30 to-transparent opacity-60 rounded-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logodlhk.jpeg"
              alt="Dinas Lingkungan Hidup dan Kebersihan"
              className="relative z-10 h-14 w-auto object-contain drop-shadow-md"
            />
          </div>
          {/* Aman */}
          <div className="relative p-2 rounded-2xl backdrop-blur-md bg-white/20 border border-white/30 shadow-lg hover:scale-105 transition-transform duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/30 to-transparent opacity-60 rounded-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/aman.png"
              alt="Aman"
              className="relative z-10 h-12 w-auto object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Login Button - Top Right */}
        <div className="absolute top-6 right-6">
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all text-gray-700 hover:text-purple-600 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Login</span>
          </Link>
        </div>

        {/* Logo with Glassmorphism */}
        <div className="mb-8 relative">
          <Logo size="xl" />
        </div>

        {/* Title */}
        <div className="marquee-container mb-3 max-w-2xl bg-white/50 backdrop-blur-sm rounded-xl py-2 px-4 shadow-sm border border-purple-100">
          <div className="animate-marquee">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 inline-block mr-12">
              My <span className="bg-linear-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">LPS</span>
            </h1>
            <p className="text-lg text-gray-500 inline-block">
              Sistem Manajemen Armada & Pendataan Sampah <span className="text-gray-400">Kota Pekanbaru</span>
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* Admin Dashboard Card */}
          <Link href="/dashboard" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Dashboard Admin</h2>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Kelola data armada, wilayah, generate QR Code, dan lihat laporan real-time.
              </p>
              <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors font-medium text-sm">
                <span>Masuk Dashboard</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Mobile Survey Card */}
          <ScanLinkCard />
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>© 2026 Dinas Lingkungan Hidup dan Kebersihan</p>
          <p>Kota Pekanbaru</p>
        </footer>
      </div>
    </AnimatedBackground>
  );
}

