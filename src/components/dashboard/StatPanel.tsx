'use client';

import { useEffect, useState } from 'react';

interface StatPanelProps {
    title?: string;
}

interface Armada {
    id: string;
    namaLps: string;
    platNomor: string;
    namaSupir: string;
    isActive: boolean;
    kelurahan?: {
        nama: string;
        kecamatan: { nama: string };
    } | null;
}

interface DeviceStatusProps {
    name: string;
    icon: React.ReactNode;
    isOn: boolean;
    color: 'purple' | 'orange' | 'teal' | 'yellow' | 'green' | 'pink';
}

const colorOptions: ('purple' | 'orange' | 'teal' | 'yellow' | 'green' | 'pink')[] = [
    'purple', 'orange', 'teal', 'yellow', 'green', 'pink'
];

export function DeviceStatusCard({ name, icon, isOn, color }: DeviceStatusProps) {
    const colorClasses = {
        purple: 'bg-gradient-to-br from-purple-600 to-purple-700',
        orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
        teal: 'bg-gradient-to-br from-teal-500 to-teal-600',
        yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
        green: 'bg-gradient-to-br from-green-500 to-green-600',
        pink: 'bg-gradient-to-br from-pink-500 to-pink-600',
    };

    return (
        <div className={`${colorClasses[color]} rounded-xl p-4 text-white`}>
            <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    {icon}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs opacity-80">{isOn ? 'AKTIF' : 'NON-AKTIF'}</span>
                    <div className={`w-8 h-4 rounded-full ${isOn ? 'bg-white/40' : 'bg-white/20'} relative`}>
                        <div className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all ${isOn ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                </div>
            </div>
            <p className="font-medium text-sm truncate">{name}</p>
        </div>
    );
}



export function PowerConsumptionChart() {
    const data = [
        { month: 'Jan', value: 30 },
        { month: 'Feb', value: 45 },
        { month: 'Mar', value: 35 },
        { month: 'Apr', value: 50 },
        { month: 'May', value: 40 },
        { month: 'Jun', value: 55 },
        { month: 'Jul', value: 65 },
        { month: 'Aug', value: 70 },
    ];
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="chart-container">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Data Pengumpulan</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Bulan</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-sm text-gray-600">Total Sampah</span>
                <span className="ml-auto text-sm font-semibold text-gray-700">73% Target</span>
            </div>

            {/* Chart */}
            <div className="flex items-end justify-between h-32 gap-2 pt-4">
                {data.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full relative">
                            <div
                                className="w-full rounded-t-lg transition-all duration-500"
                                style={{
                                    height: `${(item.value / maxValue) * 100}px`,
                                    background: i === data.length - 1
                                        ? 'linear-gradient(to top, #FDBA74, #FED7AA)'
                                        : 'linear-gradient(to top, #FED7AA, #FEF3C7)'
                                }}
                            />
                        </div>
                        <span className="text-xs text-gray-400">{item.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatPanel({ title = "Status Armada" }: StatPanelProps) {
    const [armadaList, setArmadaList] = useState<Armada[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch armada
                const armadaResponse = await fetch('/api/armada');
                if (!armadaResponse.ok) {
                    throw new Error('Failed to fetch armada');
                }
                const armadaData = await armadaResponse.json();
                setArmadaList(armadaData);


            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Gagal memuat data armada');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Generate device cards from real armada data
    const devices = armadaList.slice(0, 6).map((armada, index) => ({
        name: armada.platNomor,
        icon: <TruckIcon />,
        isOn: armada.isActive,
        color: colorOptions[index % colorOptions.length],
    }));

    const activeCount = armadaList.filter(a => a.isActive).length;



    return (
        <aside className="space-y-6">
            {/* Armada Status */}
            <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">
                            {loading ? 'LOADING...' : `${activeCount} AKTIF`}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-4">{error}</div>
                ) : devices.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">Belum ada data armada</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {devices.map((device, i) => (
                            <DeviceStatusCard key={i} {...device} />
                        ))}
                    </div>
                )}
            </div>



            {/* Power Consumption */}
            <PowerConsumptionChart />
        </aside>
    );
}

function TruckIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    );
}
