import { Suspense } from 'react';
import { Tps3rModule } from '@/components/dashboard/Tps3rModule';

export default function Tps3rInputPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat Input TPS3R...</div>}>
            <Tps3rModule initialTab="input" />
        </Suspense>
    );
}
