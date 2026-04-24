'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const ProvidersInner = dynamic(
    () => import('@/components/providers-inner').then((mod) => mod.ProvidersInner),
    {
        ssr: false,
    }
);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ProvidersInner>{children}</ProvidersInner>
    );
}
