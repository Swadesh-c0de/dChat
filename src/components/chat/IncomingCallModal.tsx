"use client";

import { UseWebRTCReturn } from "@/hooks/useWebRTC";
import { Phone, PhoneOff } from "lucide-react";

interface IncomingCallModalProps {
    webrtc: UseWebRTCReturn;
    peerName: string;
}

export const IncomingCallModal = ({ webrtc, peerName }: IncomingCallModalProps) => {
    if (!webrtc.incomingCallId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900/95 border border-zinc-700 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
                {/* Pulsing ring animation */}
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="absolute inset-0 w-20 h-20 rounded-full bg-emerald-500/20 animate-ping" />
                        <div className="relative w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center shadow-xl">
                            <span className="text-2xl font-bold text-white">
                                {peerName.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">
                            Incoming {webrtc.isVideo ? "Video" : "Voice"} Call
                        </p>
                        <h3 className="text-white text-xl font-bold tracking-tight">
                            {peerName}
                        </h3>
                    </div>

                    <div className="flex items-center gap-6 mt-2">
                        {/* Decline */}
                        <button
                            onClick={() => webrtc.rejectCall(webrtc.incomingCallId!)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-200 shadow-lg shadow-red-600/30 group-active:scale-95">
                                <PhoneOff className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-zinc-400 font-medium">Decline</span>
                        </button>

                        {/* Accept */}
                        <button
                            onClick={() => webrtc.acceptCall(webrtc.incomingCallId!)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 shadow-lg shadow-emerald-600/30 group-active:scale-95 animate-bounce">
                                <Phone className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-zinc-400 font-medium">Accept</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
