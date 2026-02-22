import { useState } from "react";
import { ChatConversation } from "@/types/chat";
import { useConversationDisplay } from "@/hooks/useConversationDisplay";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ConversationListItemProps {
    conversation: ChatConversation;
    isSelected: boolean;
    onSelect: (conversation: ChatConversation) => void;
}

export const ConversationListItem = ({ conversation, isSelected, onSelect }: ConversationListItemProps) => {
    const { title, description, avatarSeed, isLoading } = useConversationDisplay(conversation);
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => onSelect(conversation)}
                className={`w-full p-3 flex items-center gap-3 rounded-lg transition-all duration-200 text-left group
                    ${isSelected
                        ? "bg-zinc-900 shadow-md border border-zinc-800"
                        : "hover:bg-zinc-900/50 hover:border-zinc-800/50 border border-transparent"
                    }`}
            >
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500/50 transition-all
                    ${isSelected
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300"
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (avatarSeed?.startsWith("http")) {
                            setIsAvatarOpen(true);
                        }
                    }}
                >
                    {avatarSeed?.startsWith("http") ? (
                        <img src={avatarSeed} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        isLoading ? "?" : title.slice(0, 2).toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`font-medium truncate transition-colors text-sm ${isSelected ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                            {title.toUpperCase()}
                        </span>
                    </div>
                    <p className={`text-xs truncate transition-colors ${isSelected ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-500"}`}>
                        {description || "No messages yet"}
                    </p>
                </div>
            </button>

            <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
                <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-sm sm:max-w-md flex flex-col items-center justify-center" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">Avatar Preview</DialogTitle>
                    {avatarSeed?.startsWith("http") && (
                        <img
                            src={avatarSeed}
                            alt={`${title}'s Profile`}
                            className="w-full h-auto max-h-[80vh] rounded-3xl object-contain border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-none"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
