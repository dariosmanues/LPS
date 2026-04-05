'use client';

import Image from 'next/image';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    className?: string;
}

const sizeMap = {
    sm: { container: 'w-10 h-10', image: 32 },
    md: { container: 'w-16 h-16', image: 48 },
    lg: { container: 'w-20 h-20', image: 64 },
    xl: { container: 'w-32 h-32', image: 96 },
};

export function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
    const { container, image } = sizeMap[size];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* My LPS Logo with Glassmorphism */}
            <div className={`
                ${container}
                rounded-2xl
                backdrop-blur-xl
                bg-white/10
                border border-white/20
                shadow-2xl
                flex items-center justify-center
                p-2
                relative
                overflow-hidden
                group
                hover:scale-105
                transition-transform
                duration-300
            `}>
                {/* Glassmorphism shine effect */}
                <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-50" />

                {/* Logo image */}
                <div className="relative z-10">
                    <Image
                        src="/logo.jpg"
                        alt="My LPS Logo"
                        width={image}
                        height={image}
                        className="w-full h-full object-contain drop-shadow-lg rounded-xl"
                        priority
                    />
                </div>
            </div>

            {/* Text */}
            {showText && (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-lg">My LPS</span>
                    <span className="text-xs text-gray-600">Pekanbaru</span>
                </div>
            )}
        </div>
    );
}
