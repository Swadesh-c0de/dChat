import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { format } from "date-fns";
import { FileIcon, Loader2, Trash2, Download } from "lucide-react";
import { AttachmentCodec, RemoteAttachmentCodec, Attachment, RemoteAttachment } from "@xmtp/content-type-remote-attachment";
// import { getXmtpClient } from "@/lib/xmtp/client";

interface MessageBubbleProps {
    message: ChatMessage;
    isMe: boolean;
    onImageLoad?: () => void;
    onDelete?: () => void;
}

export const MessageBubble = ({ message, isMe, onImageLoad, onDelete }: MessageBubbleProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadedAttachment, setLoadedAttachment] = useState<Attachment | null>(null);
    const [error, setError] = useState<string | null>(null);

    const content = message.content as any;

    // Check if content is a RemoteAttachment (has url, secret, etc)
    const isRemoteAttachment = content && content.url && content.secret && content.salt;

    // Check if content is already a loaded Attachment (has data, lowercase mimet-type usually)
    const isDirectAttachment = content && content.filename && content.mimeType && content.data;

    useEffect(() => {
        const loadRemoteAttachment = async () => {
            if (!isRemoteAttachment || loadedAttachment || isLoading) return;

            setIsLoading(true);
            try {
                // Shim the client for V3 compatibility (RemoteAttachmentCodec expects V2 client with codecFor)
                const clientShim = {
                    codecFor: (_: any) => new AttachmentCodec(),
                };

                const attachment: Attachment = await RemoteAttachmentCodec.load(content as RemoteAttachment, clientShim as any);
                setLoadedAttachment(attachment);
            } catch (e) {
                console.error("Failed to load remote attachment", e);
                setError("Failed to load attachment");
            } finally {
                setIsLoading(false);
            }
        };

        if (isRemoteAttachment) {
            loadRemoteAttachment();
        } else if (isDirectAttachment) {
            setLoadedAttachment(content as Attachment);
        }
    }, [message.id, isRemoteAttachment]);

    useEffect(() => {
        if (loadedAttachment && loadedAttachment.mimeType.startsWith("image/")) {
            const blob = new Blob([loadedAttachment.data as any], { type: loadedAttachment.mimeType });
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [loadedAttachment]);

    const displayAttachment = loadedAttachment || (isDirectAttachment ? content : null);

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!displayAttachment) return;

        const blob = new Blob([displayAttachment.data], { type: displayAttachment.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = displayAttachment.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const isOptimistic = (message as any).isOptimistic;

    return (
        <div
            className={`flex flex-col ${isMe ? "items-end" : "items-start"} mb-2 group animate-in slide-in-from-bottom-2 duration-300 relative ${isOptimistic ? "opacity-60" : "opacity-100"}`}
        >
            <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div
                    className={`max-w-[70%] sm:max-w-[260px] md:max-w-[300px] w-fit rounded-2xl shadow-md relative ${isMe
                        ? "bg-white text-black rounded-br-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-sm border border-zinc-700"
                        } ${imageUrl ? "p-0 overflow-hidden" : "p-2"}`}
                >
                    {displayAttachment ? (
                        imageUrl ? (
                            <div className="relative group/image overflow-hidden bg-zinc-900 min-w-[200px] min-h-[150px] flex items-center justify-center">
                                <img
                                    src={imageUrl}
                                    alt={displayAttachment.filename}
                                    className="block w-auto h-auto max-w-full max-h-[420px] object-cover mx-auto transition-all duration-700 ease-out group-hover/image:scale-[1.03] animate-in fade-in zoom-in-95"
                                    onLoad={() => {
                                        onImageLoad?.();
                                    }}
                                />
                                {isOptimistic && (
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none" />
                                <button
                                    onClick={handleDownload}
                                    className="absolute bottom-3 right-3 p-2.5 bg-black/60 text-white rounded-full translate-y-2 opacity-0 group-hover/image:opacity-100 group-hover/image:translate-y-0 transition-all hover:bg-black/80 hover:scale-110 shadow-xl backdrop-blur-md z-10"
                                    title="Download image"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMe ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/50'}`}>
                                <div className={`p-2.5 rounded-xl ${isMe ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900 text-zinc-400'} shadow-inner`}>
                                    <FileIcon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`text-sm font-semibold truncate max-w-[140px] ${isMe ? 'text-zinc-900' : 'text-zinc-100'}`}>{displayAttachment.filename}</span>
                                    <span className={`text-[10px] uppercase font-bold tracking-tighter ${isMe ? 'text-zinc-400' : 'text-zinc-500'}`}>{(displayAttachment.data.byteLength / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className={`p-2 rounded-full transition-all ml-auto ${isMe ? 'text-zinc-400 hover:text-black hover:bg-zinc-100' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
                                    title="Download file"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    ) : isRemoteAttachment && isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 p-8 min-w-[200px] bg-zinc-900/50 rounded-2xl border border-zinc-800/50 animate-pulse">
                            <div className="relative">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                <div className="absolute inset-0 blur-md bg-emerald-500/20 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Decrypting...</span>
                        </div>
                    ) : error ? (
                        <div className="p-2 text-xs text-red-400">
                            {error}
                        </div>
                    ) : typeof content === "string" ? (
                        <p className="px-3 py-1 leading-relaxed text-[15px] break-normal whitespace-pre-wrap max-w-full overflow-hidden">{content}</p>
                    ) : (
                        <p className="px-3 py-1 text-xs italic text-zinc-500">System Message (Unsupported type)</p>
                    )}


                </div>

                {/* Delete Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // For now, let's just default to asking the user or split button
                        // Simple approach: standard delete triggers new logic which asks
                        onDelete?.();
                    }}
                    className={`opacity-100 transition-opacity p-2 text-zinc-500 hover:text-zinc-50 hover:bg-zinc-900 rounded-full shrink-0`}
                    title="Delete message"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] text-zinc-500 font-medium`}>
                    {format(message.sentAt, "h:mm a")}
                </span>
                {isOptimistic && (
                    <span className="flex items-center gap-1 text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Sending
                    </span>
                )}
            </div>
        </div>
    );
};

