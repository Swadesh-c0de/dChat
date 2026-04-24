import { useState } from "react";
import { ChatClient } from "@/lib/xmtp/client";
import { ChatConversation } from "@/types/chat";
import { checkCanMessage, createConversation } from "@/lib/xmtp/conversations";
import { Loader2, Plus, X } from "lucide-react";
import { isAddress } from "viem";

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: ChatClient;
    onConversationCreated: (conversation: ChatConversation) => void;
}

export const NewChatModal = ({
    isOpen,
    onClose,
    client,
    onConversationCreated,
}: NewChatModalProps) => {
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (!isAddress(address)) {
                throw new Error("Invalid Ethereum address");
            }

            const canMessage = await checkCanMessage(client, address);
            if (!canMessage) {
                // throw new Error("This address has not activated XMTP yet");
                // V3 might support messaging uninitialized users via MLS? 
                // But for now let's keep the check or warn.
            }

            const conversation = await createConversation(client, address);

            // Remove from permanent delete blocklist if it was previously deleted
            // (XMTP reuses the same conversation ID for the same peer)
            try {
                const raw = localStorage.getItem(`deleted-conversations-${client.inboxId}`);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.includes(conversation.id)) {
                        const updated = parsed.filter((id: string) => id !== conversation.id);
                        localStorage.setItem(`deleted-conversations-${client.inboxId}`, JSON.stringify(updated));
                    }
                }
            } catch { /* ignore localStorage errors */ }

            onConversationCreated(conversation);
            onClose();
            setAddress("");
        } catch (err: any) {
            setError(err.message || "Failed to create conversation");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-black/50 overflow-hidden relative">

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white tracking-tight">New Chat</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">
                            Wallet Address or ENS
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/10 focus:border-zinc-600 outline-none transition-all text-white placeholder-zinc-600 font-mono text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!address || isLoading}
                            className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                "Start Chat"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

