'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function LoginButton() {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === 'authenticated');

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        className="group relative h-12 px-8 w-full rounded-full bg-white text-black font-bold text-sm transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        <Wallet className="h-4 w-4 transition-transform group-hover:-rotate-12" />
                                        Connect Wallet
                                    </button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <Button variant="destructive" onClick={openChainModal} className="rounded-full">
                                        Wrong network
                                    </Button>
                                );
                            }

                            return (
                                <div className="flex bg-secondary/50 backdrop-blur-md rounded-full border border-white/10 p-1 pl-2 pr-4 gap-3 items-center justify-between">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xs">
                                            {account.address.substring(2, 4).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground leading-none">{account.displayName}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">{account.displayBalance ? ` (${account.displayBalance})` : ''}</span>
                                    </div>
                                    <button onClick={openAccountModal} className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                                        Manage
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
}
