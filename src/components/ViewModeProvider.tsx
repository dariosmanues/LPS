'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ViewMode = 'desktop' | 'mobile';

interface ViewModeContextType {
    viewMode: ViewMode;
    isAutoDetected: boolean;
    setViewMode: (mode: ViewMode) => void;
    toggleViewMode: () => void;
    isMobileMode: boolean;
    isDesktopMode: boolean;
}

const ViewModeContext = createContext<ViewModeContextType>({
    viewMode: 'desktop',
    isAutoDetected: true,
    setViewMode: () => {},
    toggleViewMode: () => {},
    isMobileMode: false,
    isDesktopMode: true,
});

const STORAGE_KEY = 'lps_view_mode_preference';

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [viewMode, setViewModeState] = useState<ViewMode>('desktop');
    const [isAutoDetected, setIsAutoDetected] = useState<boolean>(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
            if (saved === 'desktop' || saved === 'mobile') {
                setViewModeState(saved);
                setIsAutoDetected(false);
                document.documentElement.setAttribute('data-view-mode', saved);
            } else {
                const detected: ViewMode = window.innerWidth < 1024 ? 'mobile' : 'desktop';
                setViewModeState(detected);
                setIsAutoDetected(true);
                document.documentElement.setAttribute('data-view-mode', detected);
            }
        } catch {
            const detected: ViewMode = typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop';
            setViewModeState(detected);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        document.documentElement.setAttribute('data-view-mode', viewMode);
    }, [viewMode, mounted]);

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        setIsAutoDetected(false);
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // ignore storage errors
        }
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-view-mode', mode);
        }
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop');
    };

    return (
        <ViewModeContext.Provider
            value={{
                viewMode,
                isAutoDetected,
                setViewMode,
                toggleViewMode,
                isMobileMode: viewMode === 'mobile',
                isDesktopMode: viewMode === 'desktop',
            }}
        >
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    return useContext(ViewModeContext);
}

interface ViewModeToggleProps {
    variant?: 'pill' | 'compact' | 'sidebar' | 'floating';
    theme?: 'purple' | 'green';
    className?: string;
}

export function ViewModeToggle({
    variant = 'pill',
    theme = 'purple',
    className = '',
}: ViewModeToggleProps) {
    const { viewMode, setViewMode, toggleViewMode } = useViewMode();

    const activeBg =
        theme === 'green'
            ? 'bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-sm'
            : 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-sm';

    if (variant === 'sidebar') {
        return (
            <button
                type="button"
                onClick={toggleViewMode}
                title={
                    viewMode === 'desktop'
                        ? 'Sedang di Desktop Mode — Klik untuk beralih ke Mobile Mode'
                        : 'Sedang di Mobile Mode — Klik untuk beralih ke Desktop Mode'
                }
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all shrink-0 border ${
                    viewMode === 'mobile'
                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                } ${className}`}
            >
                {viewMode === 'desktop' ? (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[9px] font-bold leading-none">Mobile</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[9px] font-bold leading-none">Desktop</span>
                    </>
                )}
            </button>
        );
    }

    if (variant === 'compact') {
        return (
            <div
                className={`inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80 ${className}`}
                role="group"
                aria-label="Pilih Mode Tampilan"
            >
                <button
                    type="button"
                    onClick={() => setViewMode('desktop')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'desktop'
                            ? activeBg
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Tampilan Layar Lebar (Desktop Mode)"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Desktop</span>
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('mobile')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'mobile'
                            ? activeBg
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Tampilan Aplikasi HP (Mobile Mode)"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Mobile</span>
                </button>
            </div>
        );
    }

    // Default 'pill' or 'floating'
    return (
        <div
            className={`inline-flex items-center bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-gray-200/80 ${className}`}
            role="group"
            aria-label="Pilih Mode Tampilan"
        >
            <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    viewMode === 'desktop'
                        ? activeBg
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Desktop Mode</span>
            </button>
            <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    viewMode === 'mobile'
                        ? activeBg
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Mobile Mode</span>
            </button>
        </div>
    );
}

