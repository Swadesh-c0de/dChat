"use client";

import { useEffect, useState, useRef } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { ChatClient, createXmtpClient, getXmtpClient, disconnectXmtpClient } from "@/lib/xmtp/client";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Loader2, Wallet } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";

export default function ChatPage() {
    const { data: walletClient } = useWalletClient();
    const { address, isConnected } = useAccount();
    const [client, setClient] = useState<ChatClient | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [revocationRequired, setRevocationRequired] = useState(false);
    const [revocationInboxId, setRevocationInboxId] = useState<string | null>(null);
    const [isRevoking, setIsRevoking] = useState(false);
    const [isRepairing, setIsRepairing] = useState(false);

    const initRef = useRef(false);

    const handleFatalError = (e: any) => {
        console.error("Fatal XMTP Error caught in ChatPage", e);
        setError(`Secure connection corrupted (MLS Error). This device's local chat history needs to be repaired. No messages will be lost on the network.`);
    };

    const handleRepair = async () => {
        setIsRepairing(true);
        try {
            const { wipeLocalXmtpData, disconnectXmtpClient } = await import("@/lib/xmtp/client");
            if (disconnectXmtpClient) disconnectXmtpClient();
            await wipeLocalXmtpData();
            // Force reload to start fresh
            window.location.reload();
        } catch (e: any) {
            console.error("Repair failed", e);
            setError("Failed to repair session: " + e.message);
            setIsRepairing(false);
        }
    };

    useEffect(() => {
        // Reset if wallet disconnects
        if (!isConnected || !walletClient) {
            setClient(null);
            setRevocationRequired(false);
            setRevocationInboxId(null);
            disconnectXmtpClient();
            initRef.current = false;
            return;
        }

        const init = async () => {
            // Prevent multiple in-flight requests
            if (initRef.current) return;
            initRef.current = true;

            // If we already have a client with same address, reuse
            const existing = getXmtpClient();
            if (existing && existing.address === address) {
                setClient(existing);
                initRef.current = false;
                return;
            }

            setIsInitializing(true);
            setError(null);
            setRevocationRequired(false);
            setRevocationInboxId(null);

            try {
                const xmtp = await createXmtpClient({
                    walletClient,
                    env: (process.env.NEXT_PUBLIC_XMTP_ENV as any) || "production",
                });
                setClient(xmtp);
            } catch (e: any) {
                console.error("XMTP Init Error", e);
                const errorMessage = e.message || "Failed to initialize secure messaging.";

                // If the error is regarding pending request, we can ignore it or tell user to check wallet
                if (errorMessage.includes("already pending")) {
                    setError("Please check your wallet for a pending signature request.");
                } else {
                    setError(errorMessage);
                }

                // Check for 10/10 installations error and extract Inbox ID
                if (errorMessage.includes("already registered") && errorMessage.includes("installations")) {
                    const match = errorMessage.match(/InboxID\s+([a-f0-9]+)\s+has/);
                    if (match && match[1]) {
                        setRevocationInboxId(match[1]);
                        setRevocationRequired(true);
                    }
                }

                // Also check for cryptographic errors during init
                if (errorMessage.includes("SecretReuseError") || errorMessage.includes("GenerationOutOfBound")) {
                    handleFatalError(e);
                }
            } finally {
                setIsInitializing(false);
                initRef.current = false;
            }
        };

        if (!revocationRequired && !client && !isInitializing) {
            init();
        }
    }, [walletClient, address, isConnected, revocationRequired, client, isInitializing]);

    const handleRevoke = async () => {
        if (!walletClient || !revocationInboxId) return;
        setIsRevoking(true);
        try {
            const { revokeOtherInstallations } = await import("@/lib/xmtp/client");
            const xmtpEnv = (process.env.NEXT_PUBLIC_XMTP_ENV as any) || "production";
            await revokeOtherInstallations(walletClient, revocationInboxId, xmtpEnv);
            // After revocation, reset state to trigger re-init
            // Do NOT reset state here, as it triggers init() which conflicts with the DB lock
            // setError(null);
            // setRevocationRequired(false);
            // setRevocationInboxId(null);
            setRevocationInboxId(null);

            // Wait a moment for the network/local storage to catch up
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e: any) {
            console.error("Revocation failed", e);
            setError("Failed to revoke sessions: " + e.message);
        } finally {
            setIsRevoking(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
                <div className="text-center space-y-6 max-w-md animate-in fade-in duration-500 relative z-10">
                    <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
                        <div className="w-auto h-auto mx-auto mb-6 flex items-center justify-center">
                            <img src="/dChat-dark.svg" alt="dChat" className="h-32 w-auto bg-transparent opacity-90 hover:opacity-100 transition-opacity scale-125" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Connect to dChat</h1>
                        <p className="text-zinc-400 mb-8 leading-relaxed">Secure, wallet-to-wallet messaging. <br />Connect your wallet to get started.</p>
                        <div className="flex justify-center scale-110">
                            <LoginButton />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-medium text-white">Initializing Secure Layer</h2>
                        <p className="text-zinc-500 text-sm mt-1">Please sign the request in your wallet</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        const isMlsError = error.includes("MLS Error") || error.includes("SecretReuseError") || error.includes("corrupted");

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
                <div className="p-8 bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 text-center max-w-md">
                    <h2 className="text-red-500 font-bold text-lg mb-2">Connection Error</h2>
                    <p className="text-zinc-400 mb-6">{error}</p>

                    {revocationRequired ? (
                        <div className="space-y-4">
                            <div className="bg-amber-900/20 border border-amber-500/20 p-4 rounded-lg text-left">
                                <p className="text-amber-200 text-sm mb-2 font-medium">Too Many Devices</p>
                                <p className="text-amber-200/70 text-xs leading-relaxed">
                                    You have reached the maximum number of active sessions (10).
                                    To log in on this device, you need to revoke existing sessions.
                                </p>
                            </div>
                            <button
                                onClick={handleRevoke}
                                disabled={isRevoking}
                                className="w-full px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                            >
                                {isRevoking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Revoking...
                                    </>
                                ) : (
                                    "Revoke Other Sessions"
                                )}
                            </button>
                        </div>
                    ) : isMlsError ? (
                        <button
                            onClick={handleRepair}
                            disabled={isRepairing}
                            className="w-full px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
                        >
                            {isRepairing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Repairing Account...
                                </>
                            ) : (
                                "Repair Secure Connection"
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium text-sm"
                        >
                            Retry Connection
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!client) {
        return null;
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            <ChatLayout client={client} onFatalError={handleFatalError} />
        </div>
    );
}

