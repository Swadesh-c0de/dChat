import { ChatConversation, ChatMessage } from "@/types/chat";
import { DecodedMessage } from "@xmtp/browser-sdk";
import { AttachmentCodec, RemoteAttachmentCodec, ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { uploadFileToIPFS } from "@/lib/ipfs";
import { ContentTypeDelete, DeleteCodec } from "./codecs/DeleteCodec";

export const fetchMessages = async (conversation: ChatConversation): Promise<ChatMessage[]> => {
    try {
        // Double check activity status
        const active = await (conversation as any).isActive();
        if (!active) {
            console.warn("Conversation is inactive, syncing before fetching messages...");
        }

        // Sync the conversation from the network first to get the latest messages.
        // This is critical for User2 to see User1's messages without needing a manual refresh.
        await conversation.sync();
        const messages = await conversation.messages();
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
            return messageId;
        }

        // V3 sendText returns message ID
        const messageId = await conversation.sendText(content);
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
    let stream: any;
    let isStreaming = true;

    (async () => {
        try {
            // Check activity before streaming
            const active = await (conversation as any).isActive();
            if (!active) {
                await conversation.sync();
            }

            stream = await conversation.stream();
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
        if (stream && typeof stream.return === 'function') {
            stream.return();
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
