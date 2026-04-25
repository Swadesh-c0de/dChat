import { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentCodec, EncodedContent } from "@xmtp/content-type-primitives";

export const ContentTypeCall = {
    authorityId: "xmtp.org",
    typeId: "call",
    versionMajor: 1,
    versionMinor: 0,
};

export type CallContent = {
    signalType: "offer" | "answer" | "ice-candidate" | "hang-up" | "reject";
    sdp?: string;           // For offer/answer
    candidate?: string;     // For ICE candidates (JSON stringified)
    callId: string;         // Unique ID to match signals to a specific call session
};

export class CallCodec implements ContentCodec<CallContent> {
    get contentType(): ContentTypeId {
        return ContentTypeCall;
    }

    encode(content: CallContent): EncodedContent {
        return {
            type: ContentTypeCall,
            parameters: {},
            content: new TextEncoder().encode(JSON.stringify(content)),
        };
    }

    decode(content: EncodedContent): CallContent {
        const json = new TextDecoder().decode(content.content);
        return JSON.parse(json);
    }

    fallback(content: CallContent): string | undefined {
        return undefined; // Call signals should never be displayed as text
    }

    shouldPush(content: any): boolean {
        return false;
    }
}
