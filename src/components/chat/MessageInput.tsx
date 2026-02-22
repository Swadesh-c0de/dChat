import { useState, KeyboardEvent, useRef } from "react";
import { Send, Loader2, Paperclip, X, Smile } from "lucide-react";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageInputProps {
    onSendMessage: (content: string | File) => Promise<void>;
    isLoading: boolean;
}

export const MessageInput = ({ onSendMessage, isLoading }: MessageInputProps) => {
    const [content, setContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setContent((prev) => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const handleSend = async () => {
        if ((!content.trim() && !selectedFile) || isLoading) return;
        try {
            if (selectedFile) {
                await onSendMessage(selectedFile);
                setSelectedFile(null);
            } else {
                await onSendMessage(content);
                setContent("");
            }
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col border-t border-zinc-900 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
            {selectedFile && (
                <div className="px-4 py-2 flex items-center gap-2 bg-zinc-900/50 border-b border-zinc-900">
                    <span className="text-sm text-zinc-300 truncate max-w-[200px]">
                        {selectedFile.name}
                    </span>
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                </div>
            )}
            <div className="flex items-center gap-3 p-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            disabled={isLoading}
                            className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        side="top"
                        align="start"
                        sideOffset={16}
                        className="p-0 border-none bg-transparent shadow-none w-auto"
                    >
                        <EmojiPicker
                            theme={Theme.DARK}
                            onEmojiClick={onEmojiClick}
                            lazyLoadEmojis={true}
                            skinTonesDisabled
                            searchDisabled={false}
                        />
                    </PopoverContent>
                </Popover>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="flex-1 relative">
                    <input
                        type="text"
                        ref={inputRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full pl-5 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-zinc-700 transition-all shadow-inner"
                        disabled={isLoading}
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={(!content.trim() && !selectedFile) || isLoading}
                    className="p-3 bg-white text-black rounded-full hover:shadow-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
};
