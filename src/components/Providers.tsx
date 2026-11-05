'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ViewModeProvider } from './ViewModeProvider';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <ViewModeProvider>{children}</ViewModeProvider>
        </SessionProvider>
    );
}
