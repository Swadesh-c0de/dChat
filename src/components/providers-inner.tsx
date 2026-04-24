'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultConfig,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import {
    base,
    baseSepolia,
    polygon,
    polygonAmoy,
    mainnet,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http, createStorage, cookieStorage } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
if (!projectId) {
    console.error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID environment variable.');
} else {
    console.log('WalletConnect Project ID loaded:', projectId.substring(0, 4) + '...');
}

const config = getDefaultConfig({
    appName: 'dChat App',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    chains: [
        mainnet,
        polygon,
        base,
        ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [polygonAmoy, baseSepolia] : []),
    ],
    transports: {
        [mainnet.id]: http("https://cloudflare-eth.com"),
        [polygon.id]: http("https://polygon-rpc.com"),
        [base.id]: http("https://mainnet.base.org"),
        [polygonAmoy.id]: http(),
        [baseSepolia.id]: http(),
    },
    // ssr: true, // Try disabling SSR again if hydration issues persist
    ssr: true, // Re-enabling for now as per previous fix
    storage: createStorage({
        storage: cookieStorage,
    }),
});

const queryClient = new QueryClient();

export function ProvidersInner({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
