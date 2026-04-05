'use client';

import { useState } from 'react';

interface DeviceCardProps {
    title: string;
    icon: React.ReactNode;
    isOn?: boolean;
    color?: 'purple' | 'orange' | 'teal' | 'yellow';
    onToggle?: (isOn: boolean) => void;
}

export function DeviceCard({
    title,
    icon,
    isOn: initialIsOn = false,
    color = 'purple',
    onToggle
}: DeviceCardProps) {
    const [isOn, setIsOn] = useState(initialIsOn);

    const handleToggle = () => {
        const newState = !isOn;
        setIsOn(newState);
        onToggle?.(newState);
    };

    return (
        <div className={`device-card ${color}`}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-90">{isOn ? 'ON' : 'OFF'}</span>
                <button
                    className={`toggle-switch ${isOn ? 'on' : ''}`}
                    onClick={handleToggle}
                    aria-label={`Toggle ${title}`}
                />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {icon}
            </div>
            <span className="font-medium">{title}</span>
        </div>
    );
}

interface ControlCardProps {
    title: string;
    icon: React.ReactNode;
    isActive?: boolean;
    onToggle?: (isActive: boolean) => void;
}

export function ControlCard({
    title,
    icon,
    isActive: initialIsActive = false,
    onToggle
}: ControlCardProps) {
    const [isActive, setIsActive] = useState(initialIsActive);

    const handleToggle = () => {
        const newState = !isActive;
        setIsActive(newState);
        onToggle?.(newState);
    };

    return (
        <div className={`control-card ${isActive ? 'active' : ''}`}>
            <button
                className={`toggle-switch ${isActive ? 'on' : ''}`}
                onClick={handleToggle}
                style={{
                    background: isActive ? '#7C3AED' : '#E5E7EB',
                }}
            />
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                {icon}
            </div>
            <span className="text-gray-700 font-medium">{title}</span>
        </div>
    );
}
