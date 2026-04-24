import { Client, Dm, Group } from "@xmtp/browser-sdk";
import { IdentifierKind, ConsentState } from "@xmtp/wasm-bindings";
import { ChatConversation } from "@/types/chat";

// Mutex to prevent concurrent sync operations which can lead to SecretReuseErrors
const syncLocks = new Map<string, Promise<void>>();

const withSyncLock = async (client: Client, action: () => Promise<void>) => {
    const inboxId = client.inboxId;
    if (!inboxId) return action();

    // Wait for any existing sync to finish
    while (syncLocks.has(inboxId)) {
        await syncLocks.get(inboxId);
    }

    const syncPromise = action();
    syncLocks.set(inboxId, syncPromise);
    try {
        await syncPromise;
    } finally {
        syncLocks.delete(inboxId);
    }
};

export const listConversations = async (client: Client): Promise<ChatConversation[]> => {
    // 1. Trigger network sync to fetch any conversations from the network (important after clearing local storage)
    try {
        await withSyncLock(client, async () => {
            await client.conversations.sync();
        });
    } catch (e: any) {
        if (e.message?.includes("SecretReuseError") || e.message?.includes("GenerationOutOfBound")) {
            console.error("CRITICAL: XMTP Cryptographic State Corruption detected.", e);
            throw e; // Bubble up for Repair UI
        }
        console.warn("Conversation sync failed, listing local conversations only:", e);
    }

    // 2. Filter out Denied conversations (deleted by user)
    // Include Allowed + Unknown so new inbound DMs appear automatically
    const options = {
        consentStates: [ConsentState.Allowed, ConsentState.Unknown]
    };
    const conversations = await client.conversations.list(options);

    console.log(`XMTP listConversations: found ${conversations.length} total conversations`);
    
    // We return all conversations that passed the list() filter (Allowed/Unknown).
    // Removing the isActive() check because it can be slow and might filter out 
    // valid conversations during initial synchronization.
    return conversations;
};

/**
 * Synchronizes metadata and messages for a specific conversation from the network.
 */
export const syncConversation = async (conversation: ChatConversation): Promise<void> => {
    try {
        await conversation.sync();
    } catch (e: any) {
        if (e.message?.includes("SecretReuseError") || e.message?.includes("GenerationOutOfBound")) {
            console.error("CRITICAL: Conversation state corruption detected.", e);
            throw e;
        }
        console.error("Failed to sync conversation history", e);
        throw e;
    }
};


export const deleteConversation = async (conversation: ChatConversation): Promise<void> => {
    try {
        // "Delete" by setting consent to Denied
        await conversation.updateConsentState(ConsentState.Denied);
    } catch (e) {
        console.error("Failed to delete conversation", e);
        throw e;
    }
};

export const createConversation = async (
    client: Client,
    peerAddress: string
): Promise<ChatConversation> => {
    try {
        const identifier = {
            identifier: peerAddress,
            identifierKind: IdentifierKind.Ethereum
        };
        // Use createDmWithIdentifier for Ethereum addresses
        const conversation = await client.conversations.createDmWithIdentifier(identifier);

        // Ensure the conversation is synced and active
        await conversation.sync();

        if (!(await (conversation as any).isActive())) {
            console.warn("Returned conversation is inactive even after sync. Fallback to list and find active.");
        }

        // Ensure consent is reset to Allowed if it was previously Denied/Deleted
        const consent = await conversation.consentState();
        if (consent === ConsentState.Denied) {
            await conversation.updateConsentState(ConsentState.Allowed);
        }

        return conversation;
    } catch (e: any) {
        if (e.message?.includes("SecretReuseError")) {
            throw e;
        }
        console.error("Failed to create conversation", e);
        throw e;
    }
};

export const checkCanMessage = async (
    client: Client,
    peerAddress: string
): Promise<boolean> => {
    try {
        const identifier = {
            identifier: peerAddress,
            identifierKind: IdentifierKind.Ethereum
        };
        const results = await client.canMessage([identifier]);

        if (results instanceof Map) {
            return results.get(peerAddress.toLowerCase()) || results.get(peerAddress) || false;
        }

        if (Array.isArray(results) && (results as any).length > 0) {
            return (results as any)[0];
        }

        return false;
    } catch (e) {
        console.error("Failed to check canMessage", e);
        return false;
    }
};


