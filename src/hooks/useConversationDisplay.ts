import { useState, useEffect } from "react";
import { ChatConversation } from "@/types/chat";

export interface ConversationDisplay {
    title: string;
    description: string;
    avatarSeed: string;
    isLoading: boolean;
}

export const useConversationDisplay = (conversation: ChatConversation): ConversationDisplay => {
    const [display, setDisplay] = useState<ConversationDisplay>({
        title: "Loading...",
        description: "",
        avatarSeed: "",
        isLoading: true
    });

    useEffect(() => {
        let isMounted = true;

        const resolve = async () => {
            try {
                let title = "";
                let description = "Chat";
                let avatarSeed = "";
                let profileAvatar = "";
                let peerTargetId = conversation.id;

                // Check for DM (peerInboxId method)
                if ('peerInboxId' in conversation && typeof (conversation as any).peerInboxId === 'function') {
                    const dm = conversation as any;
                    try {
                        const peerInboxId = await dm.peerInboxId();
                        peerTargetId = peerInboxId;
                        title = peerInboxId.slice(0, 6) + "..." + peerInboxId.slice(-4);
                        description = "Direct Message";
                        avatarSeed = peerInboxId;
                    } catch (e) {
                        console.warn("Failed to get peerInboxId", e);
                        title = "Unknown User";
                    }
                }
                // Check for Group (groupName method or property)
                else if ('groupName' in conversation) {
                    const group = conversation as any;
                    if (typeof group.groupName === 'function') {
                        title = await group.groupName();
                    } else {
                        title = group.groupName;
                    }
                    description = "Group Chat";
                    peerTargetId = group.id;
                    avatarSeed = group.id;
                }

                // CHECK LOCAL PROFILE
                try {
                    const rawProfile = localStorage.getItem(`profile-${peerTargetId}`);
                    if (rawProfile) {
                        const profile = JSON.parse(rawProfile);
                        if (profile.displayName) title = profile.displayName;
                        if (profile.avatarUrl) profileAvatar = profile.avatarUrl;
                    }
                } catch (e) {
                    console.error("Failed to parse local profile", e);
                }

                if (isMounted) {
                    setDisplay({
                        title,
                        description,
                        avatarSeed: profileAvatar || avatarSeed, // Reusing avatarSeed conceptually, but now it can hold a URL 
                        isLoading: false
                    });
                }
            } catch (e) {
                console.error("Failed to resolve conversation display", e);
                if (isMounted) {
                    setDisplay(prev => ({ ...prev, isLoading: false, title: "Unknown" }));
                }
            }
        };

        resolve();

        // Listen for real-time profile updates
        const onProfileUpdated = () => resolve();
        window.addEventListener('profile-updated', onProfileUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener('profile-updated', onProfileUpdated);
        };
    }, [conversation.id]);

    return display;
};
