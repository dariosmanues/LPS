'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ScanLinkCard() {
    const { data: session } = useSession();

    // Check if user has a role that should NOT see this card
    const isBlocked = session?.user?.role &&
        ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(session.user.role.toUpperCase());

    if (isBlocked) {
        return null;
    }

    return (
        <Link href="/scan" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Scan & Input</h2>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                    Untuk petugas operator - scan QR armada dan kelurahan, input berat sampah.
                </p>
                <div className="flex items-center text-orange-600 group-hover:text-orange-700 transition-colors font-medium text-sm">
                    <span>Mulai Scan</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
