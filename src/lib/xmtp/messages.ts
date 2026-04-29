import { ChatConversation, ChatMessage } from "@/types/chat";
import { DecodedMessage } from "@xmtp/browser-sdk";
import { AttachmentCodec, RemoteAttachmentCodec, ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { ContentTypeDelete, DeleteCodec } from "./codecs/DeleteCodec";

export const fetchMessages = async (conversation: ChatConversation): Promise<ChatMessage[]> => {
    try {
        // Double check activity status
        // Sync the conversation from the network to fetch the latest messages (or recovered history).
        // This is necessary after a storage wipe or when being newly added to a group.
        try {
            await conversation.sync();
        } catch (e) {
            console.warn(`Sync failed for conversation ${conversation.id}, fetching local messages:`, e);
        }
        
        const messages = await conversation.messages();
        console.log(`Fetched ${messages.length} messages for conversation ${conversation.id}`);
        return messages;
    } catch (e) {
        console.error("Failed to fetch messages", e);
        return [];
    }
};

export const sendMessage = async (
    conversation: ChatConversation,
    content: string | File
): Promise<string> => { // Returns message ID
    try {
        // Double check activity status
        const active = await (conversation as any).isActive();
        if (!active) {
            console.warn("Conversation is inactive, attempting one final sync before sending...");
            await conversation.sync();
            const stillActive = await (conversation as any).isActive();
            if (!stillActive) {
                throw new Error("Group is inactive. You cannot send messages to this conversation anymore.");
            }
        }

        if (content instanceof File) {
            console.log("ContentTypeRemoteAttachment:", ContentTypeRemoteAttachment);
            // Check if file is small enough for direct attachment (limit < 1MB for example) 
            // but for simplicity we will treat all files as RemoteAttachments for now to use IPFS.
            // XMTP RemoteAttachmentCodec flow:
            // 1. Encrypt attachment
            // 2. Upload encrypted payload
            // 3. Send RemoteAttachment

            const attachment = {
                filename: content.name,
                mimeType: content.type,
                data: new Uint8Array(await content.arrayBuffer()),
            };

            const encryptedAttachment = await RemoteAttachmentCodec.encodeEncrypted(
                attachment,
                new AttachmentCodec()
            );

            const uploadUrl = await uploadFileToIPFS(
                new File([new Blob([encryptedAttachment.payload as any])], "encrypted", { type: "application/octet-stream" })
            );

            const remoteAttachment = {
                url: `https://gateway.pinata.cloud/ipfs/${uploadUrl}`,
                contentDigest: encryptedAttachment.digest,
                salt: encryptedAttachment.salt,
                nonce: encryptedAttachment.nonce,
                secret: encryptedAttachment.secret,
                scheme: "https://",
                filename: attachment.filename,
                contentLength: attachment.data.byteLength,
            };

            console.log("Sending RemoteAttachment:", remoteAttachment);

            // Manually encode to ensure paremeters field is present (fix for [worker] error: missing field parameters)
            const codec = new RemoteAttachmentCodec();
            const encodedContent = codec.encode(remoteAttachment);

            console.log("Encoded parameters:", encodedContent.parameters);

            const messageId = await conversation.send(encodedContent);
            try {
                await conversation.sync();
            } catch (e) {
                console.warn("Post-file sync failed (non-critical)", e);
            }
            return messageId;
        }

        // V3 sendText returns message ID
        const messageId = await conversation.sendText(content);
        try {
            // Proactive sync ensures our local list is up-to-date with the new message
            // and any concurrent changes from other devices.
            await conversation.sync();
        } catch (e) {
            console.warn("Post-send sync failed (non-critical)", e);
        }
        return messageId;
    } catch (e) {
        console.error("Failed to send message", e);
        throw e;
    }
};

export const streamMessages = async (
    conversation: ChatConversation,
    onMessage: (message: ChatMessage) => void
): Promise<() => void> => {
    let isStreaming = true;

    // Check activity before streaming
    try {
        const active = await (conversation as any).isActive();
        if (!active) {
            await conversation.sync();
        }
    } catch (e) {
        console.warn("Activity check before stream failed (non-critical):", e);
    }

    // Await stream setup BEFORE returning cleanup — ensures cleanup always
    // holds a valid stream reference and can never be a no-op due to a race condition.
    const stream = await conversation.stream();

    // Run the message loop in the background
    (async () => {
        try {
            for await (const message of stream) {
                if (!isStreaming) break;
                onMessage(message);
            }
        } catch (e) {
            console.error("Stream loop error", e);
        }
    })();

    return () => {
        isStreaming = false;
        if (typeof stream?.return === 'function') {
            try {
                const res = stream.return();
                if (res instanceof Promise) res.catch(() => {});
            } catch (e) { /* ignore */ }
        }
    };
};

export const sendDeleteMessage = async (
    conversation: ChatConversation,
    messageId: string
): Promise<string> => {
    try {
        const content = { messageId };

        // Manually encode to ensure paremeters field is present (fix for [worker] error: missing field parameters)
        const codec = new DeleteCodec();
        const encodedContent = codec.encode(content);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const messageIdResponse = await conversation.send(encodedContent);
        return messageIdResponse;
    } catch (e) {
        console.error("Failed to send delete message", e);
        throw e;
    }
};

import { ProfileCodec, ProfileContent } from "./codecs/ProfileCodec";

export const sendProfileUpdateMessage = async (
    conversation: ChatConversation,
    displayName: string,
    avatarUrl: string
): Promise<string> => {
    try {
        const content: ProfileContent = { displayName, avatarUrl };

        const codec = new ProfileCodec();
        const encodedContent = codec.encode(content);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const messageIdResponse = await conversation.send(encodedContent);
        return messageIdResponse;
    } catch (e) {
        console.error("Failed to send profile update message", e);
        throw e;
    }
};

import { CallCodec, CallContent } from "./codecs/CallCodec";

export const sendCallSignal = async (
    conversation: ChatConversation,
    signal: CallContent
): Promise<string> => {
    try {
        const codec = new CallCodec();
        const encodedContent = codec.encode(signal);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const messageIdResponse = await conversation.send(encodedContent);
        return messageIdResponse;
    } catch (e) {
        console.error("Failed to send call signal", e);
        throw e;
    }
};
