import { useRef, useEffect, useState } from "react";
import { ChatConversation, ChatMessage } from "@/types/chat";
import { useConversationDisplay } from "@/hooks/useConversationDisplay";
import { fetchMessages, sendMessage, streamMessages, sendDeleteMessage } from "@/lib/xmtp/messages";
import { ContentTypeDelete } from "@/lib/xmtp/codecs/DeleteCodec";
import { deleteConversation } from "@/lib/xmtp/conversations";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Loader2, Trash2, ArrowLeft } from "lucide-react";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatWindowProps {
    conversation: ChatConversation;
    clientInboxId: string;
    onDeleteConversation?: () => void;
    onBack?: () => void;
}

export const ChatWindow = ({ conversation, clientInboxId, onDeleteConversation, onBack }: ChatWindowProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load hidden messages from local storage
    const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const stored = localStorage.getItem(`hidden-messages-${clientInboxId}`);
        if (stored) {
            setHiddenMessageIds(new Set(JSON.parse(stored)));
        }
    }, [clientInboxId]);

    const handleDeleteMessage = async (messageId: string, isRemote = false) => {
        if (isRemote) {
            // Send delete command to network
            try {
                await sendDeleteMessage(conversation, messageId);
            } catch (e) {
                alert("Failed to delete for everyone");
                return;
            }
        }

        setHiddenMessageIds(prev => {
            const next = new Set(prev);
            next.add(messageId);
            localStorage.setItem(`hidden-messages-${clientInboxId}`, JSON.stringify(Array.from(next)));
            return next;
        });

        setMessageToDelete(null);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            // 1. Set consent to Denied so it won't appear in conversation list
            await deleteConversation(conversation);

            // 2. Add to permanent blocklist so it can never be restored
            const blocklist = JSON.parse(localStorage.getItem(`deleted-conversations-${clientInboxId}`) || '[]');
            if (!blocklist.includes(conversation.id)) {
                blocklist.push(conversation.id);
                localStorage.setItem(`deleted-conversations-${clientInboxId}`, JSON.stringify(blocklist));
            }

            // 3. Clean up related local storage data for this conversation
            localStorage.removeItem(`hidden-messages-${clientInboxId}`);

            setShowDeleteChatDialog(false);

            if (onDeleteConversation) {
                onDeleteConversation();
            }
        } catch (e) {
            console.error("Failed to delete chat", e);
            alert("Failed to delete chat. Please try again.");
            setIsDeleting(false);
        }
    };

    // Resolve display info
    const { title, isLoading: isTitleLoading, avatarSeed } = useConversationDisplay(conversation);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Auto-scroll on new messages
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (messages.length > 0) {
            if (isFirstLoad.current) {
                scrollToBottom("auto");
                isFirstLoad.current = false;
            } else {
                scrollToBottom("smooth");
            }
        }
    }, [messages]);

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
                            const content = m.content as any;
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
                            const profileContent = m.content as any;
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
                        !(m.contentType.typeId === "profile" && m.contentType.authorityId === "xmtp.org")
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

                // Polling fallback to catch messages synced from other devices
                pollInterval = setInterval(async () => {
                    if (document.visibilityState === 'visible') {
                        try {
                            const polledMessages = await fetchMessages(conversation);
                            processAndSetMessages(polledMessages);
                        } catch (e) {
                            // silently ignore poll errors
                        }
                    }
                }, 5000);

                // Window focus sync
                const handleFocus = () => {
                    fetchMessages(conversation).then(processAndSetMessages).catch(() => {});
                };
                window.addEventListener('focus', handleFocus);
                cleanupFocus = () => window.removeEventListener('focus', handleFocus);

                cleanup = await streamMessages(conversation, (message) => {
                    // Check for Delete Content Type
                    if (message.contentType.typeId === "delete" && message.contentType.authorityId === "xmtp.org") {
                        const deleteContent = message.content as any;
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
                        const profileContent = message.content as any;
                        const validProfile = {
                            displayName: profileContent.displayName || "",
                            avatarUrl: profileContent.avatarUrl || ""
                        };
                        try {
                            localStorage.setItem(`profile-${message.senderInboxId}`, JSON.stringify(validProfile));
                            // Optional: dispatch a custom event if we want components to instantly rerender when someone's profile changes mid-chat
                            window.dispatchEvent(new CustomEvent('profile-updated', { detail: { inboxId: message.senderInboxId } }));
                        } catch (e) {
                            console.error("Failed to save peer profile", e);
                        }
                        return; // Don't add internal profile update messages to the visual chat list
                    }

                    // Only append if not already in list
                    setMessages((prev) => {
                        if (prev.find(m => m.id === message.id)) return prev;
                        return [...prev, message];
                    });

                    // Remove from optimistic list if present
                    setOptimisticMessages(prev => prev.filter(m => {
                        // In v3, we can't easily correlate until the ID is known,
                        // but once the stream message arrives, we can check if it matches an optimistic one's content/sender.
                        // For string content:
                        if (typeof m.content === 'string' && typeof message.content === 'string') {
                            return m.content !== message.content;
                        }
                        // For files, it's trickier, so we can use a more clever approach later.
                        return true; 
                    }));
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
    }, [conversation.id, clientInboxId]); // Re-run when conversation ID changes

    const handleSendMessage = async (content: string | File) => {
        setIsSending(true);
        const tempId = "temp-" + Date.now();
        
        // Add optimistic message
        const optimisticMsg: any = {
            id: tempId,
            senderInboxId: clientInboxId,
            sentAt: new Date(),
            content: content instanceof File ? { filename: content.name, mimeType: content.type, data: new Uint8Array() } : content,
            contentType: { 
                authorityId: "xmtp.org", 
                typeId: content instanceof File ? "remote-attachment" : "text", 
                versionMajor: 1, 
                versionMinor: 0,
                parameters: {}
            },
            isOptimistic: true // Custom flag for UI
        };

        setOptimisticMessages(prev => [...prev, optimisticMsg]);

        try {
            await sendMessage(conversation, content);
            // The stream will deliver the real message, 
            // and we'll filter it out in the stream callback or by checking IDs
        } catch (e) {
            console.error("Failed to send", e);
            // Remove optimistic message on failure
            setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
            alert("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    // Header render:
    return (
        <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0">
                        {avatarSeed?.startsWith("http") ? (
                            <img src={avatarSeed} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            isTitleLoading ? "?" : title.slice(0, 2).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white tracking-tight">
                            {title.toUpperCase()}
                        </h3>
                        <span className="text-xs text-emerald-500 flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></span>
                            Online
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowDeleteChatDialog(true)}
                    disabled={isDeleting}
                    className="p-2.5 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 rounded-full transition-all duration-200"
                    title="Delete Chat"
                >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative z-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-zinc-500 mt-20 flex flex-col items-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 rotate-3 border border-zinc-800">
                            <span className="text-3xl opacity-50">👋</span>
                        </div>
                        <p className="font-medium text-zinc-300">No messages yet</p>
                        <p className="text-sm mt-1 text-zinc-500">Say hello to start the conversation!</p>
                    </div>
                ) : (
                    [
                        ...messages.filter(msg => !hiddenMessageIds.has(msg.id)),
                        ...optimisticMessages
                    ]
                        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
                        .map((msg, index, array) => {
                            const isNewDay = index === 0 || !isSameDay(new Date(msg.sentAt), new Date(array[index - 1].sentAt));

                            let dateLabel = "";
                            if (isNewDay) {
                                const date = new Date(msg.sentAt);
                                if (isToday(date)) dateLabel = "Today";
                                else if (isYesterday(date)) dateLabel = "Yesterday";
                                else dateLabel = format(date, "MMMM d, yyyy");
                            }

                            return (
                                <div key={msg.id} className="flex flex-col">
                                    {isNewDay && (
                                        <div className="flex items-center justify-center my-6">
                                            <span className="text-xs font-medium text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/50">
                                                {dateLabel}
                                            </span>
                                        </div>
                                    )}
                                    <MessageBubble
                                        message={msg}
                                        isMe={msg.senderInboxId === clientInboxId}
                                        onImageLoad={() => scrollToBottom("smooth")}
                                        onDelete={() => setMessageToDelete(msg.id)}
                                    />
                                </div>
                            );
                        })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Delete Dialog */}
            <Dialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
                <DialogContent className="bg-zinc-950/95 border-zinc-800 backdrop-blur-xl rounded-2xl shadow-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-bold tracking-tight mb-1">Delete Message</DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm">
                            Are you sure you want to delete this message? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
                        {messages.find(m => m.id === messageToDelete)?.senderInboxId === clientInboxId && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => messageToDelete && handleDeleteMessage(messageToDelete, true)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 font-semibold transition-all"
                            >
                                Delete for Everyone
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => messageToDelete && handleDeleteMessage(messageToDelete, false)}
                            className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-xl py-6 font-semibold transition-all"
                        >
                            Delete for Me
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setMessageToDelete(null)}
                            className="w-full text-zinc-500 hover:text-white hover:bg-transparent transition-colors py-2"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Chat Confirmation Dialog */}
            <Dialog open={showDeleteChatDialog} onOpenChange={(open) => !open && setShowDeleteChatDialog(false)}>
                <DialogContent className="w-min bg-zinc-950/95 border-zinc-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 max-w-md min-w-sm">
                    <DialogHeader className="items-center text-center">
                        <div className="w-16 h-16 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                            <Trash2 className="w-8 h-8 text-zinc-500" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">
                            Permanently Delete Chat
                        </DialogTitle>
                        <DialogDescription className="space-y-4 pt-1 text-left">
                            <span className="block text-zinc-400 text-base leading-relaxed">
                                Are you sure you want to <span className="text-zinc-100 font-semibold px-1">permanently delete</span> your conversation with <span className="text-white font-bold">{title.toUpperCase()}</span>?
                            </span>
                            {/* <span className="block p-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl"> */}
                            <span className="text-zinc-400 text-sm font-medium flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse"></span>
                                This action is irreversible
                            </span>
                            {/* </span> */}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col items-center gap-3 sm:flex-col pt-4">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-min bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl py-6 text-lg font-bold transition-all shadow-lg shadow-zinc-900/20 gap-3"
                        >
                            {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                            Delete Permanently
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowDeleteChatDialog(false)}
                            disabled={isDeleting}
                            className="w-min text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-2xl py-6 font-semibold transition-all"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Input */}
            <MessageInput onSendMessage={handleSendMessage} isLoading={isSending} />
        </div>
    );
};

