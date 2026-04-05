'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    padding?: string;
    onClick?: () => void;
}

export function GlassCard({
    children,
    className = '',
    hover = true,
    padding = 'p-6',
    onClick
}: GlassCardProps) {
    return (
        <div
            className={`
                card
                ${hover ? 'hover:-translate-y-1 hover:shadow-xl' : ''}
                transition-all duration-300 ease-out
                ${padding}
                ${className}
                ${onClick ? 'cursor-pointer' : ''}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: { value: number; isPositive: boolean };
    color?: 'blue' | 'purple' | 'green' | 'orange';
}

export function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        purple: 'bg-purple-50 border-purple-200',
        green: 'bg-green-50 border-green-200',
        orange: 'bg-orange-50 border-orange-200',
    };

    const iconColorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className={`
            ${colorClasses[color]}
            border rounded-2xl p-6
            hover:-translate-y-1 hover:shadow-lg
            transition-all duration-300 ease-out
        `}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <p className="stat-number">{value}</p>
                    {trend && (
                        <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% dari kemarin
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${iconColorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
