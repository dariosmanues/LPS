'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';

const lpsMenuItems = [
    {
        name: 'Dashboard',
        href: '/lps',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    {
        name: 'QR Code Generator',
        href: '/lps/qr-generator',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        )
    },
    {
        name: 'Laporan',
        href: '/lps/laporan',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    },
    {
        name: 'Buat Laporan',
        href: '/lps/laporan/baru',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        )
    },
];

interface LpsSidebarProps {
    children: ReactNode;
    kelurahanName?: string;
}

export function LpsSidebar({ children, kelurahanName }: LpsSidebarProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data: session } = useSession();

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

    return (
        <div className="min-h-screen bg-[#F5F6FA]">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-4">
                <Link href="/lps" className="flex items-center gap-3">
                    <Logo size="sm" showText />
                </Link>
                <div className="flex items-center gap-2">
                    {session?.user && (
                        <span className="text-sm text-gray-600 hidden sm:block">
                            {session.user.name}
                        </span>
                    )}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Mobile Drawer */}
            <aside className={`
                lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-white z-50 transform transition-transform duration-300
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* User Info */}
                {session?.user && (
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-semibold">
                                {session.user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{session.user.name}</p>
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                    {getRoleName(session.user.role)}
                                </span>
                            </div>
                        </div>
                        {kelurahanName && (
                            <p className="mt-2 text-sm text-gray-500">
                                Kelurahan: <span className="font-medium text-gray-700">{kelurahanName}</span>
                            </p>
                        )}
                    </div>
                )}

                <nav className="p-4 space-y-1">
                    {lpsMenuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/lps' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-linear-to-r from-green-600 to-green-700 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* Logout Button Mobile */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 w-full"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Keluar</span>
                    </button>
                </nav>
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-20 bg-white rounded-3xl shadow-lg flex-col items-center py-6 gap-2 z-40">
                {/* Logo */}
                <Link href="/lps" className="mb-6">
                    <Logo size="md" />
                </Link>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-2">
                    {lpsMenuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/lps' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive
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
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                    {/* User Avatar */}
                    {session?.user && (
                        <div
                            className="w-10 h-10 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                            title={`${session.user.name} (${getRoleName(session.user.role)})`}
                        >
                            {session.user.name?.charAt(0) || 'U'}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Keluar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-28 pt-20 lg:pt-4 px-4 lg:px-6 pb-6 min-h-screen">
                {children}
            </main>

            {/* Footer */}
            <footer className="lg:ml-28 py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
                DINAS LINGKUNGAN HIDUP DAN KEBERSIHAN
            </footer>
        </div>
    );
}
