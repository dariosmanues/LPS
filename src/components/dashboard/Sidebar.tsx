'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';

const menuItems = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    {
        name: 'Armada',
        href: '/dashboard/armada',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        )
    },
    {
        name: 'Wilayah',
        href: '/dashboard/wilayah',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
    },
    {
        name: 'QR Codes',
        href: '/dashboard/qr-codes',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        )
    },
    {
        name: 'Laporan WA',
        href: '/dashboard/reports',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 16l4-5 3 3 5-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19" cy="5" r="4.5" fill="#25D366"/>
                <path d="M20.2 6.5c-.1 0-.7-.3-.8-.4-.1 0-.2-.1-.3.1-.1.1-.3.4-.4.5-.1.1-.1.1-.3 0-.1-.1-.5-.2-1-.6-.4-.3-.6-.7-.7-.9-.1-.1 0-.2.1-.2l.2-.2c.1-.1.1-.1.1-.2 0-.1 0-.2 0-.2l-.4-.9c-.1-.2-.2-.2-.3-.2h-.2c-.1 0-.2 0-.3.2-.1.1-.4.4-.4 1 0 .6.4 1.2.5 1.2.1.1.9 1.3 2.1 1.8.3.1.5.2.7.3.3.1.6.1.8 0 .2 0 .7-.3.8-.6.1-.3.1-.5.1-.6 0 0-.1-.1-.2-.1" fill="white"/>
            </svg>
        )
    },
    {
        name: 'Riwayat',
        href: '/dashboard/logs',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    {
        name: 'Users',
        href: '/dashboard/users',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    },
    {
        name: 'Laporan LPS',
        href: '/dashboard/laporan-lps',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    },
    {
        name: 'Catatan Rapat',
        href: '/notes',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        )
    },
    {
        name: 'Transform',
        href: '/dashboard/transform-pembelian',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        )
    },
    {
        name: 'Aduan Warga',
        href: '/dashboard/laporan-masyarakat',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        )
    },
    {
        name: 'Panduan',
        href: '/dashboard/guide',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        )
    },
];

interface SidebarProps {
    children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data: session } = useSession();

    const filteredMenuItems = menuItems.filter(item => {
        if (item.name === 'Armada') {
            const blockedRoles = ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'];
            const userRole = session?.user?.role?.toUpperCase();
            if (userRole && blockedRoles.includes(userRole)) {
                return false;
            }
        }
        return true;
    });

    const handleLogout = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA]">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-3">
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
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold">
                                {session.user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{session.user.name}</p>
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                    {session.user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="p-4 space-y-1">
                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white'
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
                <Link href="/" className="mb-6">
                    <Logo size="md" />
                </Link>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-2">
                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`sidebar-icon ${isActive ? 'active' : ''}`}
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
                            className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                            title={`${session.user.name} (${session.user.role})`}
                        >
                            {session.user.name?.charAt(0) || 'U'}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="sidebar-icon text-red-500 hover:bg-red-50 hover:text-red-600"
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
        </div>
    );
}

