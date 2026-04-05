'use client';

import { ReactNode } from 'react';

interface AnimatedBackgroundProps {
    children: ReactNode;
}

export function AnimatedBackground({ children }: AnimatedBackgroundProps) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#F5F6FA]">
            {/* Subtle gradient overlay */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl" />
            </div>

            {children}
        </div>
    );
}
