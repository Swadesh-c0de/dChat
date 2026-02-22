import { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentCodec, EncodedContent } from "@xmtp/content-type-primitives";

export const ContentTypeProfile = {
    authorityId: "xmtp.org",
    typeId: "profile",
    versionMajor: 1,
    versionMinor: 0,
};

export type ProfileContent = {
    displayName: string;
    avatarUrl: string;
};

export class ProfileCodec implements ContentCodec<ProfileContent> {
    get contentType(): ContentTypeId {
        return ContentTypeProfile;
    }

    encode(content: ProfileContent): EncodedContent {
        return {
            type: ContentTypeProfile,
            parameters: {},
            content: new TextEncoder().encode(JSON.stringify(content)),
        };
    }

    decode(content: EncodedContent): ProfileContent {
        const json = new TextDecoder().decode(content.content);
        return JSON.parse(json);
    }

    fallback(content: ProfileContent): string | undefined {
        return `Updated profile to ${content.displayName}`;
    }

    shouldPush(content: any): boolean {
        return false;
    }
}
