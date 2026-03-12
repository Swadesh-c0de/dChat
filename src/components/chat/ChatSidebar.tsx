import { useState, useEffect, useRef, useCallback } from "react";
import { Client, ConsentState } from "@xmtp/browser-sdk";
import { ChatConversation } from "@/types/chat";
import { listConversations } from "@/lib/xmtp/conversations";
import { Plus, MessageSquare } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ChatSidebarProps {
    client: Client;
    onSelectConversation: (conversation: ChatConversation) => void;
    selectedConversation?: ChatConversation;
    onNewChat: () => void;
    refreshTrigger?: number;
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
}: ChatSidebarProps) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [loading, setLoading] = useState(true);
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
    // Does NOT call sync() — use this when the XMTP stream has already
    // materialized the conversation (e.g. inside streamAllMessages callback).
    const listAndSetConversations = useCallback(async () => {
        try {
            const convs = await listConversations(client);
            const blocklist = getDeletedBlocklist();
            const filtered = convs.filter(c => !blocklist.includes(c.id));
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

    useEffect(() => {
        isMounted.current = true;
        let convStreamCleanup: (() => void) | undefined;
        let msgStreamCleanup: (() => void) | undefined;
        let pollInterval: ReturnType<typeof setInterval> | undefined;

        // ─── INITIAL LOAD ──────────────────────────────────────────────────────────
        const doInitialLoad = async () => {
            try {
                // Use the more thorough syncAll() for the very first load
                // to ensure we catch everything (new welcomes + sync server history)
                await client.conversations.syncAll();
                await listAndSetConversations();
            } catch (e) {
                console.error("Failed initial load", e);
                // Fallback to refreshConversations if syncAll fails
                await refreshConversations();
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        // ─── POLLING (every 3 seconds) ─────────────────────────────────────────────
        // Calls sync() + list() as a fallback to catch anything the stream misses.
        // Runs independently — no lock, so it never blocks the stream callback.
        pollInterval = setInterval(async () => {
            if (!isMounted.current) return;
            try {
                await refreshConversations();
            } catch { /* ignore */ }
        }, 3000);

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
                    if (convStream && typeof convStream.return === "function") convStream.return();
                };
            } catch (e) {
                console.error("Failed to start conv stream", e);
            }
        };

        // ALL-MESSAGES STREAM
        // ConsentState.Unknown includes brand-new inbound DMs
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
                    if (msgStream && typeof msgStream.return === "function") msgStream.return();
                };
            } catch (e) {
                console.error("Failed to start all-messages stream", e);
            }
        };

        // Run all three in parallel — none block each other
        Promise.all([doInitialLoad(), doConvStream(), doMsgStream()]).catch(() => { });

        return () => {
            isMounted.current = false;
            if (convStreamCleanup) convStreamCleanup();
            if (msgStreamCleanup) msgStreamCleanup();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [client, refreshTrigger, getDeletedBlocklist, refreshConversations, listAndSetConversations]);

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
                <ConnectButton accountStatus="avatar" showBalance={false} chainStatus="none" />
            </div>

            <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
                        <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
                        <p className="text-xs font-medium">Loading chats...</p>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                            <MessageSquare className="w-5 h-5 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium text-sm">No messages found</p>
                        <button
                            onClick={onNewChat}
                            className="mt-4 text-xs font-semibold text-white hover:underline"
                        >
                            Start a conversation
                        </button>
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
                <img src="/dChat-dark.svg" alt="dChat" className="h-8 mr-4 w-auto opacity-80 hover:opacity-100 transition-opacity scale-[2.5]" />
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
