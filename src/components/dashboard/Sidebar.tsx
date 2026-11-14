'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';
import { isSuperAdminUser } from '@/lib/permissions';
import { useViewMode, ViewModeToggle } from '@/components/ViewModeProvider';

const menuItems = [
    {
        name: 'Dashboard',
        shortName: 'Beranda',
        href: '/dashboard',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    {
        name: 'Armada',
        shortName: 'Armada',
        href: '/dashboard/armada',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        )
    },
    {
        name: 'Wilayah',
        shortName: 'Wilayah',
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
        shortName: 'QR Code',
        href: '/dashboard/qr-codes',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        )
    },
    {
        name: 'Rekap Kendala QR',
        shortName: 'Kendala QR',
        href: '/dashboard/rekap-gagal-qr',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm0 12h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm7-8h2m-2 4h.01M12 20h4m-4-16v4m4 8h4m0 4h.01M4 12h4" />
                <circle cx="19" cy="5" r="4.5" fill="#EF4444" />
                <path d="M19 3.1v2.3" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
                <circle cx="19" cy="7.3" r="0.9" fill="white" />
            </svg>
        )
    },
    {
        name: 'Laporan WA',
        shortName: 'Laporan WA',
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
        shortName: 'Riwayat',
        href: '/dashboard/logs',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    {
        name: 'Users',
        shortName: 'Users',
        href: '/dashboard/users',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    },
    {
        name: 'Timbangan Air Hitam',
        shortName: 'Air Hitam',
        href: '/dashboard/laporan-timbangan/air-hitam',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
        )
    },
    {
        name: 'Timbangan Harapan Jaya',
        shortName: 'Hrp. Jaya',
        href: '/dashboard/laporan-timbangan/harapan-jaya',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )
    },
    {
        name: 'Catatan Rapat',
        shortName: 'Catatan',
        href: '/notes',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        )
    },
    {
        name: 'Transform',
        shortName: 'Transform',
        href: '/dashboard/transform-pembelian',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        )
    },
    {
        name: 'Aduan Warga',
        shortName: 'Aduan',
        href: '/dashboard/laporan-masyarakat',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        )
    },
    {
        name: 'Panduan',
        shortName: 'Panduan',
        href: '/dashboard/guide',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        )
    },
];

// Bottom navigation items for Mobile Mode (4 main tabs + More Menu)
const mobileBottomNavItems = menuItems.filter((item) =>
    [
        '/dashboard',
        '/dashboard/armada',
        '/dashboard/laporan-timbangan/air-hitam',
        '/dashboard/laporan-timbangan/harapan-jaya',
    ].includes(item.href)
);

interface SidebarProps {
    children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data: session } = useSession();
    const { isMobileMode } = useViewMode();

    const isSuperAdmin = isSuperAdminUser(session?.user);
    const filteredMenuItems = menuItems;

    const handleLogout = () => {
        signOut({ callbackUrl: '/' });
    };

    // =========================================================================
    // MODEL 2: MOBILE MODE (Aplikasi HP / Mobile View)
    // =========================================================================
    if (isMobileMode) {
        return (
            <div className="min-h-screen bg-slate-900/95 flex flex-col items-center justify-start">
                {/* Mobile Frame Wrapper (Full width on phone, Smartphone frame on PC) */}
                <div className="w-full max-w-[480px] min-h-screen bg-[#F5F6FA] relative shadow-2xl flex flex-col border-x border-slate-200/20">
                    {/* Sticky Top Mobile App Bar */}
                    <header className="sticky top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-3.5 shadow-2xs">
                        <Link href="/" className="flex items-center gap-2 shrink-0">
                            <Logo size="sm" showText />
                        </Link>
                        <div className="flex items-center gap-2">
                            <ViewModeToggle variant="compact" theme="purple" />
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
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
                        {/* Drawer Header + User Info */}
                        <div className="p-4 border-b border-gray-100 shrink-0 bg-linear-to-br from-purple-50/80 to-white">
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
                                <div className="flex items-center gap-3 pt-2 border-t border-purple-100/60">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden ring-2 ring-purple-200">
                                        {isSuperAdmin ? (
                                            <img
                                                src="/avatar-superadmin.png"
                                                alt={session.user.name || 'Nisa'}
                                                className="w-full h-full object-cover object-center"
                                            />
                                        ) : (
                                            session.user.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{session.user.name}</p>
                                        {isSuperAdmin ? (
                                            <span className="inline-block text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">
                                                Super Admin (Full Akses)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold">
                                                <span>👁️</span> Read-Only
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All Menu Items */}
                        <nav className="p-3 space-y-1 flex-1 overflow-y-auto min-h-0">
                            {filteredMenuItems.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                                            isActive
                                                ? 'bg-linear-to-r from-purple-600 to-purple-700 text-white shadow-sm font-semibold'
                                                : 'text-gray-600 hover:bg-gray-100 font-medium'
                                        }`}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Drawer Footer: Mode Switcher + Logout */}
                        <div className="p-3 border-t border-gray-100 shrink-0 bg-gray-50/60 space-y-2">
                            <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-xs font-semibold text-gray-500">Mode Tampilan</span>
                                <ViewModeToggle variant="compact" theme="purple" />
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all text-red-600 bg-red-50 hover:bg-red-100 w-full font-semibold text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Keluar (Logout)</span>
                            </button>
                        </div>
                    </aside>

                    {/* Mobile Main Content Area */}
                    <main className="mobile-content-area flex-1 px-3.5 pt-3 pb-24 overflow-x-hidden">
                        {children}
                    </main>

                    {/* Fixed Bottom Navigation Bar (Mobile App Style) */}
                    <nav className="sticky bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 grid grid-cols-5 items-center px-1 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                        {mobileBottomNavItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                                        isActive
                                            ? 'text-purple-600 font-bold'
                                            : 'text-gray-400 hover:text-gray-700 font-medium'
                                    }`}
                                >
                                    <div className={`p-1 rounded-lg ${isActive ? 'bg-purple-50' : ''}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] leading-tight mt-0.5 truncate max-w-[64px]">
                                        {item.shortName}
                                    </span>
                                </Link>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                                mobileMenuOpen
                                    ? 'text-purple-600 font-bold'
                                    : 'text-gray-400 hover:text-gray-700 font-medium'
                            }`}
                        >
                            <div className="p-1 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </div>
                            <span className="text-[10px] leading-tight mt-0.5">Menu Lain</span>
                        </button>
                    </nav>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MODEL 1: DESKTOP MODE (Layar Lebar Penuh / Full Widescreen View)
    // =========================================================================
    return (
        <div className="min-h-screen bg-[#F5F6FA] overflow-x-auto">
            <div className="min-w-[1120px] min-h-screen relative">
                {/* Desktop Floating Left Sidebar */}
                <aside className="fixed left-4 top-4 bottom-4 w-20 bg-white rounded-3xl shadow-lg flex flex-col items-center py-5 z-40">
                    {/* Logo */}
                    <Link href="/" className="mb-3 shrink-0" title="Beranda">
                        <Logo size="md" />
                    </Link>

                    {/* Navigation */}
                    <nav className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1.5 px-2 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {filteredMenuItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`sidebar-icon shrink-0 ${isActive ? 'active' : ''}`}
                                    title={item.name}
                                >
                                    {item.icon}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="shrink-0 mt-auto flex flex-col items-center gap-2 pt-3 border-t border-gray-100 w-full px-2">
                        {/* Quick Switch to Mobile Mode */}
                        <ViewModeToggle variant="sidebar" theme="purple" />

                        {/* User Avatar */}
                        {session?.user && (
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer shadow-xs overflow-hidden ${
                                    isSuperAdmin
                                        ? 'bg-linear-to-br from-purple-600 to-indigo-700 ring-2 ring-purple-300'
                                        : 'bg-linear-to-br from-amber-500 to-amber-600 ring-2 ring-amber-200'
                                }`}
                                title={`${session.user.name} - ${
                                    isSuperAdmin ? 'Super Admin (Akses Penuh)' : 'Mode Read-Only (Hanya Lihat)'
                                }`}
                            >
                                {isSuperAdmin ? (
                                    <img
                                        src="/avatar-superadmin.png"
                                        alt={session.user.name || 'Nisa'}
                                        className="w-full h-full object-cover object-center"
                                    />
                                ) : (
                                    session.user.name?.charAt(0) || 'U'
                                )}
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="sidebar-icon shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Tampilan Layar Lebar (Desktop Mode)
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ViewModeToggle variant="pill" theme="purple" />
                    </div>
                </div>

                {/* Desktop Main Content */}
                <main className="ml-28 pt-3 px-6 pb-6 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
