'use client';

import { LpsSidebar } from '@/components/lps/LpsSidebar';
import { useEffect, useState } from 'react';

export default function LpsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [kelurahanName, setKelurahanName] = useState<string | undefined>();

    useEffect(() => {
        // Fetch kelurahan name from API
        fetch('/api/lps/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.kelurahan) {
                    setKelurahanName(data.kelurahan.nama);
                }
            })
            .catch(console.error);
    }, []);

    return <LpsSidebar kelurahanName={kelurahanName}>{children}</LpsSidebar>;
}
