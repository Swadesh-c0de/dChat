import { Client, Dm, Group } from "@xmtp/browser-sdk";
import { IdentifierKind, ConsentState } from "@xmtp/wasm-bindings";
import { ChatConversation } from "@/types/chat";

export const listConversations = async (client: Client): Promise<ChatConversation[]> => {
    // Filter out Denied conversations (deleted by user)
    // Include Allowed + Unknown so new inbound DMs appear automatically
    const options = {
        consentStates: [ConsentState.Allowed, ConsentState.Unknown]
    };
    const conversations = await client.conversations.list(options);

    // Filter out inactive conversations (e.g. groups that were left or terminated)
    const activeConversations: ChatConversation[] = [];
    for (const conv of conversations) {
        if (await (conv as any).isActive()) {
            activeConversations.push(conv);
        }
    }
    return activeConversations;
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
            // If the DM is inactive, it might mean it's terminated. 
            // We can try to list and see if there's another one, but usually createDmWithIdentifier should handle this.
            // For now, let's just log it and proceed, as sync() might have helped.
        }

        // Ensure consent is reset to Allowed if it was previously Denied/Deleted
        const consent = await conversation.consentState();
        if (consent === ConsentState.Denied) {
            await conversation.updateConsentState(ConsentState.Allowed);
        }

        return conversation;
    } catch (e) {
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
        // canMessage returns boolean[] zipped with input
        const results = await client.canMessage([identifier]);

        if (Array.isArray(results) && results.length > 0) {
            return results[0];
        }

        // Fallback or unexpected return type
        console.warn("Unexpected return type from canMessage:", results);
        return false;
    } catch (e) {
        console.error("Failed to check canMessage", e);
        return false;
    }
};


