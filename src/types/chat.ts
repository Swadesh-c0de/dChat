import { Client, DecodedMessage, Dm, Group } from "@xmtp/browser-sdk";

export type ChatClient = Client;
export type ChatConversation = Dm | Group;
export type ChatMessage = DecodedMessage;

export interface Message {
    id: string;
    senderInboxId: string;
    senderAddress?: string; // Optional if we can resolve it
    content: string;
    sentAt: Date;
    isMe: boolean;
}

export interface ChatPreview {
    id: string; // convo ID
    peerInboxId: string;
    peerAddress?: string; // Optional
    lastMessage?: Message;
    updatedAt: Date;
    conversation: ChatConversation;
}

