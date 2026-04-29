import { useState, useRef, useCallback, useEffect } from "react";
import { ChatConversation } from "@/types/chat";
import { sendCallSignal, streamMessages } from "@/lib/xmtp/messages";
import { CallContent } from "@/lib/xmtp/codecs/CallCodec";

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

export interface UseWebRTCReturn {
    callState: CallState;
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
    startCall: (video: boolean) => Promise<void>;
    acceptCall: (callId: string) => Promise<void>;
    rejectCall: (callId: string) => void;
    hangUp: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    isMuted: boolean;
    isVideoOff: boolean;
    incomingCallId: string | null;
    isVideo: boolean;
    handleCallSignal: (signal: CallContent, senderInboxId: string) => Promise<void>;
}

interface UseWebRTCOptions {
    conversation: ChatConversation;
    clientInboxId: string;
    onIncomingCall?: (callId: string) => void;
    onCallEnded?: () => void;
}

const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

export const useWebRTC = ({
    conversation,
    clientInboxId,
    onIncomingCall,
    onCallEnded,
}: UseWebRTCOptions): UseWebRTCReturn => {
    const [callState, setCallState] = useState<CallState>("idle");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [incomingCallId, setIncomingCallId] = useState<string | null>(null);
    const [isVideo, setIsVideo] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const currentCallIdRef = useRef<string | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    const cleanup = useCallback(() => {
        // Stop local media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Clear video elements
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        remoteStreamRef.current = null;

        currentCallIdRef.current = null;
        pendingCandidatesRef.current = [];
        setIsMuted(false);
        setIsVideoOff(false);
        setIncomingCallId(null);
    }, []);

    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Send ICE candidates to the peer via XMTP
        pc.onicecandidate = (event) => {
            if (event.candidate && currentCallIdRef.current) {
                sendCallSignal(conversation, {
                    signalType: "ice-candidate",
                    candidate: JSON.stringify(event.candidate.toJSON()),
                    callId: currentCallIdRef.current,
                }).catch(err => console.error("Failed to send ICE candidate", err));
            }
        };

        // Receive remote media tracks
        pc.ontrack = (event) => {
            console.log("ontrack fired:", event.track.kind, event.streams.length);
            const stream = event.streams[0] || new MediaStream([event.track]);
            remoteStreamRef.current = stream;

            // Attach to video element if available
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            // Always attach to audio element as fallback for audio playback
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
            if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                setCallState("connected");
            } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
                hangUp();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [conversation]);

    const getLocalMedia = useCallback(async (video: boolean) => {
        try {
            // This triggers the browser's native "Allow camera/microphone?" popup
            // Use enhanced audio constraints for better call quality
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
            });
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            return stream;
        } catch (err: any) {
            console.error("Failed to get user media:", err);

            if (err?.name === "NotAllowedError") {
                alert(
                    "Camera/Microphone permission was denied.\n\n" +
                    "To fix this:\n" +
                    "1. Click the lock icon 🔒 in the address bar\n" +
                    "2. Set Camera and Microphone to \"Allow\"\n" +
                    "3. Reload the page and try again"
                );
            } else if (err?.name === "NotFoundError") {
                alert("No camera or microphone found. Please connect a device and try again.");
            } else {
                alert("Could not access camera/microphone: " + (err?.message || "Unknown error"));
            }

            throw err;
        }
    }, []);

    // ─── Caller Flow ───────────────────────────────────────────────

    const startCall = useCallback(async (video: boolean) => {
        if (callState !== "idle" && callState !== "ended") return;

        const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        currentCallIdRef.current = callId;
        setIsVideo(video);
        setCallState("calling");

        try {
            const pc = createPeerConnection();
            const stream = await getLocalMedia(video);

            // Add tracks to the peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Create and set local description (SDP offer)
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send offer via XMTP
            await sendCallSignal(conversation, {
                signalType: "offer",
                sdp: JSON.stringify(offer),
                callId,
            });
        } catch (err: any) {
            console.error("Failed to start call:", err);
            cleanup();
            setCallState("idle");

            // Show user-friendly message based on error type
            if (err?.message?.includes("Permission denied") || err?.name === "NotAllowedError") {
                alert("Camera/microphone permission was denied. Please allow access in your browser settings and try again.");
            } else if (err?.name === "NotFoundError") {
                alert("No camera or microphone found. Please connect a device and try again.");
            } else {
                alert("Failed to start call: " + (err?.message || "Unknown error"));
            }
        }
    }, [callState, conversation, createPeerConnection, getLocalMedia, cleanup]);

    // ─── Callee Flow ───────────────────────────────────────────────

    const acceptCall = useCallback(async (callId: string) => {
        if (!peerConnectionRef.current) return;

        setCallState("connected");
        setIncomingCallId(null);

        try {
            const stream = await getLocalMedia(isVideo);

            // Add local tracks
            stream.getTracks().forEach(track => {
                peerConnectionRef.current!.addTrack(track, stream);
            });

            // Create and set answer
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);

            // Send answer via XMTP
            await sendCallSignal(conversation, {
                signalType: "answer",
                sdp: JSON.stringify(answer),
                callId,
            });

            // Process any ICE candidates that arrived before the answer
            for (const candidate of pendingCandidatesRef.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidatesRef.current = [];
        } catch (err) {
            console.error("Failed to accept call:", err);
            cleanup();
            setCallState("idle");
        }
    }, [conversation, getLocalMedia, isVideo, cleanup]);

    const rejectCall = useCallback((callId: string) => {
        sendCallSignal(conversation, {
            signalType: "reject",
            callId,
        }).catch(err => console.error("Failed to send reject signal", err));

        cleanup();
        setCallState("idle");
    }, [conversation, cleanup]);

    // ─── Hang Up ───────────────────────────────────────────────────

    const hangUp = useCallback(() => {
        if (currentCallIdRef.current) {
            sendCallSignal(conversation, {
                signalType: "hang-up",
                callId: currentCallIdRef.current,
            }).catch(err => console.error("Failed to send hang-up signal", err));
        }

        cleanup();
        setCallState("ended");
        onCallEnded?.();

        // Reset to idle after a short delay so "ended" state can be shown briefly
        setTimeout(() => setCallState("idle"), 2000);
    }, [conversation, cleanup, onCallEnded]);

    // ─── Media Toggles ─────────────────────────────────────────────

    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(prev => !prev);
        }
    }, []);

    // ─── Handle Incoming Signaling Messages ────────────────────────

    const handleCallSignal = useCallback(async (signal: CallContent, senderInboxId: string) => {
        // Ignore our own signals
        if (senderInboxId === clientInboxId) return;

        switch (signal.signalType) {
            case "offer": {
                // Incoming call
                currentCallIdRef.current = signal.callId;
                setIncomingCallId(signal.callId);
                setCallState("ringing");

                // Determine if video based on the offer SDP
                const offerSdp = JSON.parse(signal.sdp || "{}");
                const hasVideo = offerSdp.sdp?.includes("m=video");
                setIsVideo(hasVideo);

                // Create peer connection and set remote description
                const pc = createPeerConnection();
                await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

                onIncomingCall?.(signal.callId);
                break;
            }

            case "answer": {
                // Caller receives answer
                if (peerConnectionRef.current && signal.callId === currentCallIdRef.current) {
                    const answerSdp = JSON.parse(signal.sdp || "{}");
                    await peerConnectionRef.current.setRemoteDescription(
                        new RTCSessionDescription(answerSdp)
                    );
                    setCallState("connected");

                    // Process any pending ICE candidates
                    for (const candidate of pendingCandidatesRef.current) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    pendingCandidatesRef.current = [];
                }
                break;
            }

            case "ice-candidate": {
                if (signal.callId === currentCallIdRef.current && signal.candidate) {
                    const candidateInit: RTCIceCandidateInit = JSON.parse(signal.candidate);

                    if (peerConnectionRef.current?.remoteDescription) {
                        await peerConnectionRef.current.addIceCandidate(
                            new RTCIceCandidate(candidateInit)
                        );
                    } else {
                        // Queue candidates that arrive before remote description is set
                        pendingCandidatesRef.current.push(candidateInit);
                    }
                }
                break;
            }

            case "hang-up": {
                if (signal.callId === currentCallIdRef.current) {
                    cleanup();
                    setCallState("ended");
                    onCallEnded?.();
                    setTimeout(() => setCallState("idle"), 2000);
                }
                break;
            }

            case "reject": {
                if (signal.callId === currentCallIdRef.current) {
                    cleanup();
                    setCallState("ended");
                    onCallEnded?.();
                    setTimeout(() => setCallState("idle"), 2000);
                }
                break;
            }
        }
    }, [clientInboxId, createPeerConnection, cleanup, onIncomingCall, onCallEnded]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Re-attach remote stream to elements whenever callState changes
    // (ensures stream is attached even if ontrack fired before elements were mounted)
    useEffect(() => {
        if (remoteStreamRef.current) {
            if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
            }
            if (remoteAudioRef.current && !remoteAudioRef.current.srcObject) {
                remoteAudioRef.current.srcObject = remoteStreamRef.current;
            }
        }
    }, [callState]);

    return {
        callState,
        localVideoRef,
        remoteVideoRef,
        remoteAudioRef,
        startCall,
        acceptCall,
        rejectCall,
        hangUp,
        toggleMute,
        toggleVideo,
        isMuted,
        isVideoOff,
        incomingCallId,
        isVideo,
        handleCallSignal,
    };
};
