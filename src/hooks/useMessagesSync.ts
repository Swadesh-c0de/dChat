import { useState, useEffect, useRef } from "react";
import { ChatConversation, ChatMessage, XmtpProfileContent, XmtpDeleteContent } from "@/types/chat";
import { CallContent } from "@/lib/xmtp/codecs/CallCodec";
import { fetchMessages, streamMessages } from "@/lib/xmtp/messages";

interface UseMessagesSyncProps {
    conversation: ChatConversation;
    clientInboxId: string;
    handleCallSignal: (signal: CallContent, senderInboxId: string) => void;
}

export const useMessagesSync = ({ conversation, clientInboxId, handleCallSignal }: UseMessagesSyncProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());

    // Keep a ref to the latest handleCallSignal to avoid stale closures in the stream callback
    const handleCallSignalRef = useRef(handleCallSignal);
    useEffect(() => {
        handleCallSignalRef.current = handleCallSignal;
    }, [handleCallSignal]);

    useEffect(() => {
        const stored = localStorage.getItem(`hidden-messages-${clientInboxId}`);
        if (stored) {
            setHiddenMessageIds(new Set(JSON.parse(stored)));
        }
    }, [clientInboxId]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        let cleanupFocus: (() => void) | undefined;
        let pollInterval: ReturnType<typeof setInterval> | undefined;

        const loadMessages = async () => {
            setIsLoading(true);
            try {
                const processAndSetMessages = (newMessages: ChatMessage[]) => {
                    const historicalDeletes = newMessages.filter(m =>
                        m.contentType.typeId === "delete" && m.contentType.authorityId === "xmtp.org"
                    );

                    if (historicalDeletes.length > 0) {
                        const newHiddenIds = new Set<string>();
                        historicalDeletes.forEach(m => {
                            const content = m.content as XmtpDeleteContent;
                            if (content && content.messageId) {
                                newHiddenIds.add(content.messageId);
                            }
                        });

                        setHiddenMessageIds(prev => {
                            let changed = false;
                            const next = new Set(prev);
                            for (const id of newHiddenIds) {
                                if (!next.has(id)) {
                                    next.add(id);
                                    changed = true;
                                }
                            }
                            if (changed) {
                                localStorage.setItem(`hidden-messages-${clientInboxId}`, JSON.stringify(Array.from(next)));
                                return next;
                            }
                            return prev;
                        });
                    }

                    // Process historical profiles (latest wins)
                    const historicalProfiles = newMessages.filter(m =>
                        m.contentType.typeId === "profile" && m.contentType.authorityId === "xmtp.org"
                    );

                    if (historicalProfiles.length > 0) {
                        historicalProfiles.forEach(m => {
                            const profileContent = m.content as XmtpProfileContent;
                            const validProfile = {
                                displayName: profileContent.displayName || "",
                                avatarUrl: profileContent.avatarUrl || ""
                            };
                            try {
                                localStorage.setItem(`profile-${m.senderInboxId}`, JSON.stringify(validProfile));
                            } catch (e) {
                                console.error("Failed to save peer profile history", e);
                            }
                        });
                        window.dispatchEvent(new CustomEvent('profile-updated')); // refresh any listening hooks
                    }

                    const visibleMessages = newMessages.filter(m =>
                        !(m.contentType.typeId === "delete" && m.contentType.authorityId === "xmtp.org") &&
                        !(m.contentType.typeId === "profile" && m.contentType.authorityId === "xmtp.org") &&
                        !(m.contentType.typeId === "call" && m.contentType.authorityId === "xmtp.org")
                    );

                    setMessages((prev) => {
                        const merged = [...prev];
                        let changed = false;
                        visibleMessages.forEach(m => {
                            if (!merged.find(pm => pm.id === m.id)) {
                                merged.push(m);
                                changed = true;
                            }
                        });
                        
                        if (!changed) return prev;
                        
                        // Sort by timestamp just in case they arrived out of order
                        return merged.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
                    });
                };

                const initialMessages = await fetchMessages(conversation);
                processAndSetMessages(initialMessages);

                pollInterval = setInterval(async () => {
                    if (document.visibilityState === 'visible') {
                        try {
                            const polledMessages = await fetchMessages(conversation);
                            processAndSetMessages(polledMessages);
                        } catch (e) {
                            // silently ignore poll errors
                        }
                    }
                }, 30000);

                const handleFocus = () => {
                    fetchMessages(conversation).then(processAndSetMessages).catch(() => {});
                };
                window.addEventListener('focus', handleFocus);
                cleanupFocus = () => window.removeEventListener('focus', handleFocus);

                cleanup = await streamMessages(conversation, (message) => {
                    // Check for Delete Content Type
                    if (message.contentType.typeId === "delete" && message.contentType.authorityId === "xmtp.org") {
                        const deleteContent = message.content as XmtpDeleteContent;
                        setHiddenMessageIds(prev => {
                            const next = new Set(prev);
                            next.add(deleteContent.messageId);
                            localStorage.setItem(`hidden-messages-${clientInboxId}`, JSON.stringify(Array.from(next)));
                            return next;
                        });
                        return;
                    }

                    // Check for Profile Content Type
                    if (message.contentType.typeId === "profile" && message.contentType.authorityId === "xmtp.org") {
                        const profileContent = message.content as XmtpProfileContent;
                        const validProfile = {
                            displayName: profileContent.displayName || "",
                            avatarUrl: profileContent.avatarUrl || ""
                        };
                        try {
                            localStorage.setItem(`profile-${message.senderInboxId}`, JSON.stringify(validProfile));
                            window.dispatchEvent(new CustomEvent('profile-updated', { detail: { inboxId: message.senderInboxId } }));
                        } catch (e) {
                            console.error("Failed to save peer profile", e);
                        }
                        return; 
                    }

                    // Check for Call Content Type — route to WebRTC hook
                    if (message.contentType.typeId === "call" && message.contentType.authorityId === "xmtp.org") {
                        const signal = message.content as CallContent;
                        handleCallSignalRef.current(signal, message.senderInboxId);
                        return;
                    }

                    // Only append if not already in list
                    setMessages((prev) => {
                        if (prev.find(m => m.id === message.id)) return prev;
                        return [...prev, message];
                    });

                    setOptimisticMessages(prev => {
                        if (typeof message.content !== 'string') return prev;
                        const idx = prev.findIndex(m =>
                            typeof m.content === 'string' && m.content === message.content
                        );
                        if (idx === -1) return prev;
                        const next = [...prev];
                        next.splice(idx, 1);
                        return next;
                    });
                });
            } catch (e) {
                console.error("Error loading chat", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();

        return () => {
            if (cleanup) cleanup();
            if (cleanupFocus) cleanupFocus();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [conversation, clientInboxId]);

    return {
        messages,
        optimisticMessages,
        hiddenMessageIds,
        isLoading,
        setHiddenMessageIds,
        setOptimisticMessages
    };
};
