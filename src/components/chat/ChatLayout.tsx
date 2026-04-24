import { useState } from "react";
import { ChatConversation } from "@/types/chat";
import { ChatClient } from "@/lib/xmtp/client";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { NewChatModal } from "./NewChatModal";
import { Menu, ArrowLeft } from "lucide-react";

interface ChatLayoutProps {
    client: ChatClient;
    onFatalError?: (error: any) => void;
}

export const ChatLayout = ({ client, onFatalError }: ChatLayoutProps) => {
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | undefined>();
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Mobile view logic:
    // If selectedConversation is null, show Sidebar.
    // If selectedConversation is set, show ChatWindow (and hide Sidebar on mobile).

    const handleSelectConversation = (conversation: ChatConversation) => {
        setSelectedConversation(conversation);
    };

    const handleBackToSidebar = () => {
        setSelectedConversation(undefined);
    };

    const handleConversationDeleted = () => {
        setRefreshTrigger(prev => prev + 1);
        setSelectedConversation(undefined);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-black text-zinc-100 border-t border-zinc-900">
            {/* Sidebar */}
            <div
                className={`${selectedConversation ? "hidden md:flex" : "flex"
                    } w-full md:w-80 lg:w-96 flex-col border-r border-zinc-900 h-full bg-zinc-950`}
            >
                <ChatSidebar
                    client={client}
                    onSelectConversation={handleSelectConversation}
                    selectedConversation={selectedConversation}
                    onNewChat={() => setIsNewChatModalOpen(true)}
                    refreshTrigger={refreshTrigger}
                    onFatalError={onFatalError}
                />
            </div>

            {/* Chat Window */}
            <div
                className={`${!selectedConversation ? "hidden md:flex" : "flex"
                    } w-full md:flex-1 flex-col h-full bg-black relative`}
            >
                {selectedConversation ? (
                    <ChatWindow
                        conversation={selectedConversation!}
                        clientInboxId={client.inboxId}
                        onDeleteConversation={handleConversationDeleted}
                        onBack={handleBackToSidebar}
                    />

                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-black">
                        <div className="p-8 bg-zinc-900/50 rounded-3xl mb-6 border border-zinc-800/50 rotate-12 transition-transform hover:rotate-[15deg] duration-500">
                            <svg className="w-16 h-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-zinc-300">Start Messaging</p>
                        <p className="text-sm text-zinc-500 mt-2">Select a conversation from the sidebar</p>
                    </div>
                )}
            </div>

            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                client={client}
                onConversationCreated={(conversation) => {
                    setSelectedConversation(conversation);
                    setRefreshTrigger(prev => prev + 1);
                    setIsNewChatModalOpen(false);
                }}
            />
        </div >
    );
};

