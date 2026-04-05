'use client';

interface WelcomeBannerProps {
    userName?: string;
    message?: string;
    stats?: {
        temperature?: string;
        weather?: string;
    };
}

export function WelcomeBanner({
    userName = "Admin",
    message = "Selamat datang! Semua armada dalam kondisi baik dan siap beroperasi.",
    stats
}: WelcomeBannerProps) {
    return (
        <div className="welcome-banner relative">
            <div className="flex justify-between items-start">
                <div className="max-w-md z-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Halo, {userName}!
                    </h2>
                    <p className="text-gray-700 text-sm mb-4">
                        {message}
                    </p>
                    {stats && (
                        <div className="flex gap-6">
                            {stats.temperature && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" />
                                    </svg>
                                    <span className="font-semibold text-gray-800">{stats.temperature}</span>
                                    <span className="text-gray-600 text-sm">Suhu luar</span>
                                </div>
                            )}
                            {stats.weather && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                    </svg>
                                    <span className="text-gray-600 text-sm">{stats.weather}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Illustration */}
                <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 relative">
                        <svg viewBox="0 0 120 120" className="w-full h-full">
                            {/* Person with dog illustration */}
                            <circle cx="60" cy="35" r="15" fill="#F97316" opacity="0.3" />
                            <ellipse cx="85" cy="90" rx="8" ry="6" fill="#D97706" opacity="0.5" />
                            <path d="M50 50 L55 80 L45 100" stroke="#7C3AED" strokeWidth="3" fill="none" />
                            <path d="M55 80 L65 100" stroke="#7C3AED" strokeWidth="3" fill="none" />
                            <circle cx="52" cy="42" r="8" fill="#FBBF24" />
                            <path d="M70 85 Q80 75 90 85" stroke="#D97706" strokeWidth="2" fill="none" />
                            <circle cx="92" cy="82" r="5" fill="#D97706" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
