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

    return (
        <div
            className={`flex flex-col ${isMe ? "items-end" : "items-start"} mb-2 group animate-in slide-in-from-bottom-2 duration-300 relative`}
        >
            <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-2 shadow-md relative ${isMe
                        ? "bg-white text-black rounded-br-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-sm border border-zinc-700"
                        }`}
                >
                    {displayAttachment ? (
                        imageUrl ? (
                            <div className="relative group/image overflow-hidden rounded-xl min-w-50">
                                <img
                                    src={imageUrl}
                                    alt={displayAttachment.filename}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23cccccc' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 0h10v10H0zm10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
                                        backgroundSize: '20px 20px',
                                        backgroundColor: 'white'
                                    }}
                                    className="block w-full max-w-100 max-h-75 object-contain mx-auto"
                                    onLoad={onImageLoad}
                                />
                                <button
                                    onClick={handleDownload}
                                    className="absolute bottom-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70"
                                    title="Download image"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className={`flex items-center gap-3 p-2 rounded-xl border ${isMe ? 'border-zinc-200 bg-black/5' : 'border-zinc-700 bg-white/5'}`}>
                                <div className={`p-2 rounded-lg ${isMe ? 'bg-white shadow-sm' : 'bg-zinc-800 shadow-sm'}`}>
                                    <FileIcon className={`w-5 h-5 ${isMe ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`text-sm font-medium truncate max-w-37.5 ${isMe ? 'text-zinc-900' : 'text-zinc-100'}`}>{displayAttachment.filename}</span>
                                    <span className={`text-xs ${isMe ? 'text-zinc-500' : 'text-zinc-400'}`}>{(displayAttachment.data.byteLength / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className={`p-1.5 rounded-full transition-colors ml-2 ${isMe ? 'text-zinc-500 hover:text-black hover:bg-zinc-200' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                                    title="Download file"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    ) : isRemoteAttachment && isLoading ? (
                        <div className="flex items-center gap-2 p-3">
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                            <span className="text-xs text-zinc-400">Loading attachment...</span>
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
            <span className={`text-[10px] mt-1 px-1 text-zinc-500`}>
                {format(message.sentAt, "h:mm a")}
            </span>
        </div>
    );
};

