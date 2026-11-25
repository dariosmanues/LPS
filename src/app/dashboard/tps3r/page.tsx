import { Suspense } from 'react';
import { Tps3rModule } from '@/components/dashboard/Tps3rModule';

export default function Tps3rDashboardPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat TPS3R...</div>}>
            <Tps3rModule initialTab="dashboard" />
        </Suspense>
    );
}
