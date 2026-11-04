'use client';

import { usePermissions } from '@/lib/permissions';

export function ReadOnlyBanner({ featureName }: { featureName?: string }) {
    const { isReadOnly, loading } = usePermissions();

    if (loading || !isReadOnly) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-2xs gap-3 print:hidden">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-bold text-sm">
                    🔒
                </div>
                <div className="text-xs">
                    <span className="font-bold">Mode Read-Only Aktif: </span>
                    <span className="text-amber-800">
                        {featureName ? `Menu ${featureName} ini bersifat lihat saja (read-only). ` : 'Menu ini bersifat lihat saja (read-only). '}
                        Hanya <strong>User Khusus (Nisa)</strong> yang memiliki akses penuh untuk menambah, mengubah, atau menghapus data.
                    </span>
                </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-200/70 text-amber-950 font-bold text-[11px] rounded-full shrink-0 uppercase tracking-wider">
                Lihat Saja
            </span>
        </div>
    );
}

