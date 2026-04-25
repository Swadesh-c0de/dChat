"use client";

import { UseWebRTCReturn } from "@/hooks/useWebRTC";
import { useState, useEffect } from "react";
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2
} from "lucide-react";

interface VideoCallModalProps {
    webrtc: UseWebRTCReturn;
    peerName: string;
}

export const VideoCallModal = ({ webrtc, peerName }: VideoCallModalProps) => {
    const [elapsed, setElapsed] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);

    // Call timer
    useEffect(() => {
        if (webrtc.callState !== "connected") {
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [webrtc.callState]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const statusText = () => {
        switch (webrtc.callState) {
            case "calling": return "Calling...";
            case "ringing": return "Ringing...";
            case "connected": return formatTime(elapsed);
            case "ended": return "Call Ended";
            default: return "";
        }
    };

    return (
        <>
            {/* Hidden audio element — always plays remote audio */}
            <audio ref={webrtc.remoteAudioRef as React.RefObject<HTMLAudioElement>} autoPlay playsInline />

            {/* Minimized floating pill — shown on top when minimized */}
            {isMinimized && (
                <div
                    className="fixed bottom-24 right-4 z-[60] flex items-center gap-3 bg-zinc-900/95 border border-zinc-700 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl cursor-pointer hover:bg-zinc-800/95 transition-all duration-300 animate-in slide-in-from-bottom-4"
                    onClick={() => setIsMinimized(false)}
                >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-white text-sm font-semibold">{peerName}</span>
                    <span className="text-zinc-400 text-xs font-mono">{statusText()}</span>
                    <Maximize2 className="w-4 h-4 text-zinc-400" />
                </div>
            )}

            {/*
                Full call UI — always rendered to keep video elements mounted.
                When minimized, we move it off-screen instead of unmounting.
                This preserves the remote video stream connection.
            */}
            <div
                className={`fixed inset-0 z-50 bg-black/95 flex flex-col transition-all duration-300 ${
                    isMinimized ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100"
                }`}
            >
                {/* Remote Video — fullscreen background */}
                <div className="flex-1 relative overflow-hidden">
                    {webrtc.isVideo ? (
                        <video
                            ref={webrtc.remoteVideoRef as React.RefObject<HTMLVideoElement>}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        /* Audio-only: show avatar */
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                            <div className="w-28 h-28 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center shadow-2xl">
                                <span className="text-4xl font-bold text-white">
                                    {peerName.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <h2 className="text-white text-xl font-bold tracking-tight">{peerName}</h2>
                                <span className={`text-sm font-medium ${
                                    webrtc.callState === "connected"
                                        ? "text-emerald-400"
                                        : "text-zinc-400"
                                }`}>
                                    {statusText()}
                                </span>
                            </div>
                            {/* Audio wave animation when connected */}
                            {webrtc.callState === "connected" && (
                                <div className="flex items-end gap-1 h-8">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-emerald-500/60 rounded-full"
                                            style={{
                                                animation: `audioWave 1.2s ease-in-out ${i * 0.15}s infinite`,
                                                height: "8px",
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Calling / Ringing overlay */}
                    {(webrtc.callState === "calling" || webrtc.callState === "ringing") && webrtc.isVideo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="w-20 h-20 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-4 animate-pulse">
                                <span className="text-3xl font-bold text-white">
                                    {peerName.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <p className="text-white font-semibold text-lg">{peerName}</p>
                            <p className="text-zinc-400 text-sm mt-1">{statusText()}</p>
                        </div>
                    )}

                    {/* Local Video — picture-in-picture */}
                    {webrtc.isVideo && (
                        <div className="absolute top-4 right-4 w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl bg-zinc-900">
                            <video
                                ref={webrtc.localVideoRef as React.RefObject<HTMLVideoElement>}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                                style={{ transform: "scaleX(-1)" }}
                            />
                            {webrtc.isVideoOff && (
                                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                                    <VideoOff className="w-8 h-8 text-zinc-600" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Connected status for video calls */}
                    {webrtc.isVideo && webrtc.callState === "connected" && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-xl px-3 py-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-white text-sm font-medium">{peerName}</span>
                            <span className="text-zinc-400 text-xs font-mono">{formatTime(elapsed)}</span>
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-6">
                    <div className="flex items-center justify-center gap-4">
                        {/* Minimize */}
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all duration-200"
                            title="Minimize"
                        >
                            <Minimize2 className="w-5 h-5" />
                        </button>

                        {/* Mute Toggle */}
                        <button
                            onClick={webrtc.toggleMute}
                            className={`p-3.5 rounded-full transition-all duration-200 ${
                                webrtc.isMuted
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            }`}
                            title={webrtc.isMuted ? "Unmute" : "Mute"}
                        >
                            {webrtc.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        {/* Video Toggle */}
                        {webrtc.isVideo && (
                            <button
                                onClick={webrtc.toggleVideo}
                                className={`p-3.5 rounded-full transition-all duration-200 ${
                                    webrtc.isVideoOff
                                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                }`}
                                title={webrtc.isVideoOff ? "Turn on Camera" : "Turn off Camera"}
                            >
                                {webrtc.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                        )}

                        {/* Hang Up */}
                        <button
                            onClick={webrtc.hangUp}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-500/30 active:scale-95"
                            title="Hang Up"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Audio wave animation keyframes */}
                <style jsx>{`
                    @keyframes audioWave {
                        0%, 100% { height: 8px; }
                        50% { height: 28px; }
                    }
                `}</style>
            </div>
        </>
    );
};
