import { useState, useEffect, useRef, useCallback } from "react";
import { Client, ConsentState } from "@xmtp/browser-sdk";
import { ChatConversation } from "@/types/chat";
import { listConversations } from "@/lib/xmtp/conversations";
import { Plus, MessageSquare, RefreshCw } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ChatSidebarProps {
    client: Client;
    onSelectConversation: (conversation: ChatConversation) => void;
    selectedConversation?: ChatConversation;
    onNewChat: () => void;
    refreshTrigger?: number;
    onFatalError?: (error: any) => void;
}

import { ProfileModal } from "./ProfileModal";
import { sendProfileUpdateMessage } from "@/lib/xmtp/messages";
import { Settings } from "lucide-react";

export const ChatSidebar = ({
    client,
    onSelectConversation,
    selectedConversation,
    onNewChat,
    refreshTrigger = 0,
    onFatalError,
}: ChatSidebarProps) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState<string>("Initializing...");
    const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Load local profile
    const getLocalProfile = useCallback(() => {
        try {
            const raw = localStorage.getItem(`profile-${client.inboxId}`);
            if (raw) return JSON.parse(raw);
        } catch { }
        return { displayName: "", avatarUrl: "" };
    }, [client.inboxId]);

    const [localProfile, setLocalProfile] = useState<{ displayName: string, avatarUrl: string }>(getLocalProfile());

    useEffect(() => {
        setLocalProfile(getLocalProfile());

        const onProfileUpdate = () => {
            setLocalProfile(getLocalProfile());
        };

        window.addEventListener('profile-updated', onProfileUpdate);
        return () => window.removeEventListener('profile-updated', onProfileUpdate);
    }, [getLocalProfile]);

    const { displayName, avatarUrl } = localProfile;

    const handleSaveProfile = async (newName: string, newAvatar: string) => {
        const profile = { displayName: newName, avatarUrl: newAvatar };
        // Save locally
        localStorage.setItem(`profile-${client.inboxId}`, JSON.stringify(profile));

        // Broadcast to native conversations
        const activeConvs = conversations;

        let broadcastCount = 0;
        await Promise.all(activeConvs.map(async (conv) => {
            try {
                await sendProfileUpdateMessage(conv, newName, newAvatar);
                broadcastCount++;
            } catch (e) {
                console.warn(`Failed to broadcast profile to ${conv.id}`, e);
            }
        }));

        console.log(`Broadcasted profile update to ${broadcastCount} conversations`);
    };

    const isMounted = useRef(true);

    // Get the permanent blocklist of deleted conversation IDs
    const getDeletedBlocklist = useCallback((): string[] => {
        try {
            const raw = localStorage.getItem(`deleted-conversations-${client.inboxId}`);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }, [client.inboxId]);

    // ─── listAndSetConversations ───────────────────────────────────────────────
    // Reads conversations from the LOCAL DB and updates state.
    // Truly local-only — reads client.conversations.list() directly without
    // triggering a network sync. Use this inside stream callbacks and after
    // an explicit sync has already been done.
    const listAndSetConversations = useCallback(async () => {
        try {
            const convs = await client.conversations.list({
                consentStates: [ConsentState.Allowed, ConsentState.Unknown],
            });
            const blocklist = getDeletedBlocklist();
            const filtered = convs.filter((c: ChatConversation) => !blocklist.includes(c.id));
            if (isMounted.current) setConversations(filtered);
        } catch (e) {
            console.error("Failed to list conversations", e);
        }
    }, [client, getDeletedBlocklist]);

    // ─── refreshConversations ──────────────────────────────────────────────────
    // Syncs from XMTP network first (discovers new welcome messages), THEN lists.
    // Use this for polling where we need to pull from the network.
    const refreshConversations = useCallback(async () => {
        try {
            await client.conversations.sync();
            await listAndSetConversations();
        } catch (e) {
            console.error("Failed to refresh conversations", e);
        }
    }, [client, listAndSetConversations]);

    // ─── INITIAL LOAD ──────────────────────────────────────────────────────────
    const doInitialLoad = useCallback(async () => {
        try {
            if (isMounted.current) {
                setLoading(true);
                setSyncStatus("Checking Network...");
            }

            // Use the more thorough syncAll() for the very first load
            // to ensure we catch everything (new welcomes + sync server history)
            // In v7, syncAll() is the primary way to recover account history
            if (isMounted.current) setSyncStatus("Recovering History...");
            await client.conversations.syncAll();

            // Explicitly sync conversations manager to materialize any newly discovered groups 
            // after syncAll() has finished pulling metadata and welcomes.
            if (isMounted.current) setSyncStatus("Discovering Chats...");
            await client.conversations.sync();

            if (isMounted.current) setSyncStatus("Finalizing...");
            await listAndSetConversations();
        } catch (e: any) {
            console.error("Failed initial load", e);

            // Check for fatal cryptographic errors that require session repair
            if (e.message?.includes("SecretReuseError") || e.message?.includes("GenerationOutOfBound")) {
                if (onFatalError) onFatalError(e);
                return;
            }

            if (isMounted.current) setSyncStatus("Sync failed, retrying...");
            // Fallback to refreshConversations if syncAll fails
            await refreshConversations();
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setSyncStatus("");
            }
        }
    }, [client, listAndSetConversations, refreshConversations, onFatalError]);

    useEffect(() => {
        isMounted.current = true;
        let convStreamCleanup: (() => void) | undefined;
        let msgStreamCleanup: (() => void) | undefined;
        let pollInterval: ReturnType<typeof setInterval> | undefined;

        // ─── CONVERSATION STREAM ───────────────────────────────────────────────────
        // Fires immediately when User1 creates a DM and the welcome push arrives.
        const doConvStream = async () => {
            try {
                const convStream = await client.conversations.stream();
                let isStreaming = true;

                (async () => {
                    try {
                        for await (const conversation of convStream) {
                            if (!isStreaming || !isMounted.current) break;
                            const blocklist = getDeletedBlocklist();
                            if (blocklist.includes(conversation.id)) continue;

                            // Pre-sync so messages are ready when User2 clicks the chat
                            try { await conversation.sync(); } catch { /* ignore */ }

                            // Add to list (deduplicated)
                            setConversations((prev: ChatConversation[]) => {
                                if (prev.some((c: ChatConversation) => c.id === conversation.id)) return prev;
                                return [conversation, ...prev];
                            });
                        }
                    } catch (e) {
                        if (isStreaming) console.error("Conv stream error", e);
                    }
                })();

                convStreamCleanup = () => {
                    isStreaming = false;
                    if (convStream && typeof convStream.return === "function") {
                        try {
                            const res = convStream.return();
                            if (res instanceof Promise) res.catch(() => {});
                        } catch (e) { /* ignore */ }
                    }
                };
            } catch (e) {
                console.error("Failed to start conv stream", e);
            }
        };

        // ALL-MESSAGES STREAM
        const doMsgStream = async () => {
            try {
                const msgStream = await client.conversations.streamAllMessages({
                    consentStates: [ConsentState.Allowed, ConsentState.Unknown],
                });
                let isStreaming = true;

                (async () => {
                    try {
                        for await (const message of msgStream) {
                            if (!isStreaming || !isMounted.current) break;

                            // Process global Profile Updates secretly
                            if (message.contentType?.typeId === "profile" && message.contentType?.authorityId === "xmtp.org") {
                                const profileContent = message.content as any;
                                const validProfile = {
                                    displayName: profileContent?.displayName || "",
                                    avatarUrl: profileContent?.avatarUrl || ""
                                };
                                try {
                                    localStorage.setItem(`profile-${message.senderInboxId}`, JSON.stringify(validProfile));
                                    window.dispatchEvent(new CustomEvent('profile-updated', { detail: { inboxId: message.senderInboxId } }));
                                } catch (e) {
                                    console.error("Failed to save peer profile globally", e);
                                }
                            }

                            // Refresh sidebar immediately 
                            await listAndSetConversations();
                        }
                    } catch (e) {
                        if (isStreaming) console.error("All-messages stream error", e);
                    }
                })();

                msgStreamCleanup = () => {
                    isStreaming = false;
                    if (msgStream && typeof msgStream.return === "function") {
                        try {
                            const res = msgStream.return();
                            if (res instanceof Promise) res.catch(() => {});
                        } catch (e) { /* ignore */ }
                    }
                };
            } catch (e) {
                console.error("Failed to start all-messages stream", e);
            }
        };

        // PERIODIC BACKGROUND SYNC
        const syncInterval = setInterval(async () => {
            if (!isMounted.current) return;
            try {
                if (isMounted.current) setIsBackgroundSyncing(true);
                // Background sync metadata every 30s to catch changes from other devices
                await client.conversations.sync();
                await listAndSetConversations();
            } catch (e) {
                // Silently handle background sync failures
            } finally {
                if (isMounted.current) setIsBackgroundSyncing(false);
            }
        }, 30000);

        // Run the initial load on mount
        const init = async () => {
            try {
                // doInitialLoad returns its own errors via console/syncStatus
                // but we want to make sure we don't start streams if the client is effectively dead
                await doInitialLoad();

                if (!isMounted.current) return;

                // ─── CONVERSATION STREAM ───────────────────────────────────────────────────
                await doConvStream();

                // ─── ALL-MESSAGES STREAM ──────────────────────────────────────────────────
                await doMsgStream();

            } catch (e) {
                console.error("Critical error in sidebar initialization", e);
            }
        };

        init();

        // Polling removed — the 30s syncInterval above already handles background sync.
        // The streamAllMessages + convStream cover all real-time updates.
        // Adding a second polling loop here was redundant and doubled API traffic.

        return () => {
            isMounted.current = false;
            if (convStreamCleanup) convStreamCleanup();
            if (msgStreamCleanup) msgStreamCleanup();
            if (pollInterval) clearInterval(pollInterval);
            if (syncInterval) clearInterval(syncInterval);
        };
    }, [client, refreshTrigger, getDeletedBlocklist, refreshConversations, listAndSetConversations, doInitialLoad]); // Added doInitialLoad to deps

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
                    <div className="flex items-center gap-1.5 min-w-[20px]">
                        <button
                            onClick={refreshConversations}
                            className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900 transition-colors"
                            title="Sync from network"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${(loading || isBackgroundSyncing) ? 'animate-spin text-emerald-500' : ''}`} />
                        </button>
                        {isBackgroundSyncing && (
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter animate-pulse">Syncing</span>
                        )}
                    </div>
                </div>
                <ConnectButton accountStatus="avatar" showBalance={false} chainStatus="none" />
            </div>

            <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-8 p-8 animate-in fade-in duration-500">
                        <div className="relative w-24 h-24">
                            {/* Outer tech ring */}
                            <div className="absolute inset-0 rounded-full border-[1.5px] border-zinc-800 border-t-emerald-500/50 animate-[spin_3s_linear_infinite]" />
                            {/* Inner tech ring */}
                            <div className="absolute inset-2 rounded-full border-[1.5px] border-zinc-800 border-b-emerald-500/50 animate-[spin_2s_linear_infinite_reverse]" />
                            {/* Pulse core */}
                            <div className="absolute inset-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                <RefreshCw className="w-4 h-4 text-emerald-500 animate-[spin_4s_linear_infinite]" />
                            </div>

                            {/* Rotating dots */}
                            <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                                {syncStatus || "History Recovery"}
                            </h3>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">
                                    Synchronizing with network
                                </p>
                                <div className="w-24 h-1 bg-zinc-900 rounded-full overflow-hidden mt-2 border border-zinc-800/50">
                                    <div className="h-full bg-emerald-500/50 animate-[shimmer_1.5s_infinite] shadow-[0_0_8px_#10b98144]" style={{ width: '40%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                            <MessageSquare className="w-5 h-5 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium text-sm">No messages found</p>
                        <div className="flex flex-col gap-2 mt-4">
                            <button
                                onClick={onNewChat}
                                className="text-xs font-semibold text-white hover:underline"
                            >
                                Start a fresh conversation
                            </button>
                            <button
                                onClick={doInitialLoad}
                                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-tighter"
                            >
                                Try Full History Recovery
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-2 py-2 space-y-0.5">
                        {conversations.map((conv) => (
                            <ConversationListItem
                                key={conv.id}
                                conversation={conv}
                                isSelected={selectedConversation?.id === conv.id}
                                onSelect={onSelectConversation}
                            />
                        ))}
                    </div>
                )}
                <button
                    onClick={onNewChat}
                    className="absolute bottom-6 right-6 p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-all duration-200 shadow-lg z-10"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 border-t border-zinc-900 bg-black/50 backdrop-blur-xl flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold px-1">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full border border-zinc-700 object-cover" />
                    ) : (
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                    )}
                    <span className="font-mono">
                        {displayName || (client.inboxId ? (client.inboxId.slice(0, 8).toUpperCase() + "..." + client.inboxId.slice(-4).toUpperCase()) : "Unknown")}
                    </span>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="ml-2 p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                        title="Edit Profile"
                    >
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                </div>
                <button
                    onClick={async () => {
                        const { wipeLocalXmtpData, disconnectXmtpClient } = await import("@/lib/xmtp/client");
                        disconnectXmtpClient();
                        await wipeLocalXmtpData();
                        window.location.reload();
                    }}
                    className="mr-4 px-3 py-1 bg-red-600/20 text-red-500 rounded text-xs font-bold border border-red-500/50 hover:bg-red-600/40"
                >
                    WIPE DATABASE
                </button>
            </div>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentDisplayName={displayName}
                currentAvatarUrl={avatarUrl}
                onSaveProfile={handleSaveProfile}
            />
        </div>
    );
};
