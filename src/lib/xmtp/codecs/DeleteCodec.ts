import { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentCodec, EncodedContent } from "@xmtp/content-type-primitives";

export const ContentTypeDelete = {
    authorityId: "xmtp.org",
    typeId: "delete",
    versionMajor: 1,
    versionMinor: 0,
};

export type DeleteContent = {
    messageId: string;
};

export class DeleteCodec implements ContentCodec<DeleteContent> {
    get contentType(): ContentTypeId {
        return ContentTypeDelete;
    }

    encode(content: DeleteContent): EncodedContent {
        return {
            type: ContentTypeDelete,
            parameters: {},
            content: new TextEncoder().encode(JSON.stringify(content)),
        };
    }

    decode(content: EncodedContent): DeleteContent {
        const json = new TextDecoder().decode(content.content);
        return JSON.parse(json);
    }

    fallback(content: DeleteContent): string | undefined {
        return "This message was deleted.";
    }

    shouldPush(content: any): boolean {
        return false;
    }
}
