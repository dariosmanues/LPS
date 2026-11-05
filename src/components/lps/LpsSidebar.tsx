'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';
import { useViewMode, ViewModeToggle } from '@/components/ViewModeProvider';

const lpsMenuItems = [
    {
        name: 'Dashboard',
        shortName: 'Dashboard',
        href: '/lps',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    {
        name: 'QR Code Generator',
        shortName: 'QR Code',
        href: '/lps/qr-generator',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        )
    }
];

interface LpsSidebarProps {
    children: ReactNode;
    kelurahanName?: string;
}

export function LpsSidebar({ children, kelurahanName }: LpsSidebarProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { isMobileMode, setViewMode } = useViewMode();

    const handleLogout = () => {
        signOut({ callbackUrl: '/' });
    };

    const getRoleName = (role: string) => {
        switch (role) {
            case 'LPS_KETUA': return 'Ketua LPS';
            case 'LPS_SEKRETARIS': return 'Sekretaris LPS';
            case 'LPS_BENDAHARA': return 'Bendahara LPS';
            default: return role;
        }
    };

    // =========================================================================
    // MODEL 2: MOBILE MODE (Aplikasi HP / Mobile View untuk LPS Kelurahan)
    // =========================================================================
    if (isMobileMode) {
        return (
            <div className="min-h-screen bg-slate-900/95 flex flex-col items-center justify-start">
                <div className="w-full max-w-[480px] min-h-screen bg-[#F5F6FA] relative shadow-2xl flex flex-col border-x border-slate-200/20">
                    {/* Sticky Top Mobile App Bar */}
                    <header className="sticky top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-3.5 shadow-2xs">
                        <Link href="/lps" className="flex items-center gap-2 shrink-0">
                            <Logo size="sm" showText />
                        </Link>
                        <div className="flex items-center gap-2">
                            <ViewModeToggle variant="compact" theme="green" />
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors"
                                aria-label="Buka Menu"
                            >
                                {mobileMenuOpen ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Mobile Menu Overlay */}
                    {mobileMenuOpen && (
                        <div
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                    )}

                    {/* Slide-out Mobile Drawer */}
                    <aside
                        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 flex flex-col justify-between shadow-2xl ${
                            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                    >
                        <div className="p-4 border-b border-gray-100 shrink-0 bg-linear-to-br from-green-50/80 to-white">
                            <div className="flex items-center justify-between mb-3">
                                <Logo size="sm" showText />
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {session?.user && (
                                <div className="pt-2 border-t border-green-100/60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-semibold shrink-0">
                                            {session.user.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{session.user.name}</p>
                                            <span className="inline-block text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                                {getRoleName(session.user.role)}
                                            </span>
                                        </div>
                                    </div>
                                    {kelurahanName && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Kelurahan: <span className="font-semibold text-gray-700">{kelurahanName}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <nav className="p-3 space-y-1 flex-1 overflow-y-auto min-h-0">
                            {lpsMenuItems.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/lps' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all ${
                                            isActive
                                                ? 'bg-linear-to-r from-green-600 to-green-700 text-white shadow-sm font-semibold'
                                                : 'text-gray-600 hover:bg-gray-100 font-medium'
                                        }`}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-3 border-t border-gray-100 shrink-0 bg-gray-50/60 space-y-2">
                            <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-xs font-semibold text-gray-500">Mode Tampilan</span>
                                <ViewModeToggle variant="compact" theme="green" />
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all text-red-600 bg-red-50 hover:bg-red-100 w-full font-semibold text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Keluar</span>
                            </button>
                        </div>
                    </aside>

                    {/* Mobile Main Content */}
                    <main className="mobile-content-area flex-1 px-3.5 pt-3 pb-24 overflow-x-hidden">
                        {children}
                    </main>

                    {/* Fixed Bottom Navigation Bar */}
                    <nav className="sticky bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 grid grid-cols-4 items-center px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                        {lpsMenuItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== '/lps' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                                        isActive
                                            ? 'text-green-600 font-bold'
                                            : 'text-gray-400 hover:text-gray-700 font-medium'
                                    }`}
                                >
                                    <div className={`p-1 rounded-lg ${isActive ? 'bg-green-50' : ''}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] leading-tight mt-0.5 truncate">
                                        {item.shortName}
                                    </span>
                                </Link>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setViewMode('desktop')}
                            className="flex flex-col items-center justify-center py-1 rounded-xl text-gray-400 hover:text-green-600 font-medium transition-all"
                        >
                            <div className="p-1 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-[10px] leading-tight mt-0.5">Desktop Mode</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center py-1 rounded-xl text-red-500 hover:text-red-600 font-medium transition-all"
                        >
                            <div className="p-1 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <span className="text-[10px] leading-tight mt-0.5">Keluar</span>
                        </button>
                    </nav>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MODEL 1: DESKTOP MODE (Layar Lebar Penuh untuk LPS Kelurahan)
    // =========================================================================
    return (
        <div className="min-h-screen bg-[#F5F6FA] overflow-x-auto">
            <div className="min-w-[1120px] min-h-screen relative flex flex-col">
                {/* Desktop Sidebar */}
                <aside className="fixed left-4 top-4 bottom-4 w-20 bg-white rounded-3xl shadow-lg flex flex-col items-center py-5 z-40">
                    {/* Logo */}
                    <Link href="/lps" className="mb-4 shrink-0" title="Beranda LPS">
                        <Logo size="md" />
                    </Link>

                    {/* Navigation */}
                    <nav className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1.5 px-2 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {lpsMenuItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== '/lps' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                        isActive
                                            ? 'bg-linear-to-r from-green-600 to-green-700 text-white shadow-lg'
                                            : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                    title={item.name}
                                >
                                    {item.icon}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="shrink-0 mt-auto flex flex-col items-center gap-2 pt-3 border-t border-gray-100 w-full px-2">
                        <ViewModeToggle variant="sidebar" theme="green" />
                        {session?.user && (
                            <div
                                className="w-10 h-10 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-semibold text-sm cursor-pointer shadow-xs"
                                title={`${session.user.name} (${getRoleName(session.user.role)})`}
                            >
                                {session.user.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all shrink-0"
                            title="Keluar (Logout)"
                            aria-label="Logout"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </aside>

                {/* Desktop Top Mode Bar */}
                <div className="ml-28 pt-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 font-medium text-gray-700 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Tampilan Layar Lebar (Desktop Mode)
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ViewModeToggle variant="pill" theme="green" />
                    </div>
                </div>

                {/* Main Content */}
                <main className="ml-28 pt-3 px-6 pb-6 flex-1">
                    {children}
                </main>

                {/* Footer */}
                <footer className="ml-28 py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
                    DINAS LINGKUNGAN HIDUP DAN KEBERSIHAN
                </footer>
            </div>
        </div>
    );
}
