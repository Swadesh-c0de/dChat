import { Client } from "@xmtp/browser-sdk";
import { IdentifierKind } from "@xmtp/wasm-bindings";
import type { WalletClient } from "viem";
import { hexToBytes } from "viem";
import { AttachmentCodec, RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { DeleteCodec } from "./codecs/DeleteCodec";
import { ProfileCodec } from "./codecs/ProfileCodec";
import { CallCodec } from "./codecs/CallCodec";

let clientInstance: Client<any> | null = null;

export type XmtpEnv = "dev" | "production" | "local";

interface ClientOptions {
    walletClient: WalletClient;
    env: XmtpEnv;
}

// Extended Client type to include address for session checking
export type ChatClient = Client<any> & { address: string; inboxId: string };

const checkBrowserCompatibility = () => {
    // Check for Secure Context (HTTPS or localhost)
    if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new Error(
            "XMTP requires a Secure Context (HTTPS). If testing locally on a device, strictly use localhost or set up HTTPS."
        );
    }

    // Check for Storage API (OPFS)
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.getDirectory) {
        throw new Error(
            "Your browser does not support the File System Access API (OPFS) needed for XMTP V3. Please use a modern browser (Chrome/Edge/Safari) and ensure you are not in Incognito/Private mode."
        );
    }
};

export const createXmtpClient = async ({
    walletClient,
    env,
}: ClientOptions): Promise<ChatClient> => {
    // Perform compatibility check before anything else
    checkBrowserCompatibility();

    if (clientInstance) {
        return clientInstance as ChatClient;
    }

    if (!walletClient || !walletClient.account) {
        throw new Error("Wallet client is not connected");
    }

    const signer = {
        type: "EOA" as const,
        getIdentifier: async () => ({
            identifier: walletClient.account!.address,
            identifierKind: IdentifierKind.Ethereum,
        }),
        signMessage: async (message: string) => {
            const signature = await walletClient.signMessage({
                account: walletClient.account!,
                message
            });
            return hexToBytes(signature);
        },
    };

    try {
        console.log("Initializing XMTP V3 Client...");

        // Use any for options as a workaround for the Omit union vs literal property type conflict in v7 types
        const client = await Client.create(signer, {
            env: env as any,
            codecs: [new AttachmentCodec(), new RemoteAttachmentCodec(), new DeleteCodec(), new ProfileCodec(), new CallCodec()],
        } as any);

        // Monkey patch address for session management in UI
        (client as any).address = walletClient.account.address;

        clientInstance = client;
        return client as ChatClient;
    } catch (error) {
        console.error("Failed to initialize XMTP client:", error);
        throw error;
    }
};

export const getXmtpClient = (): ChatClient | null => clientInstance as ChatClient | null;

export const disconnectXmtpClient = () => {
    if (clientInstance) {
        // clientInstance.close(); 
    }
    clientInstance = null;
};

export const revokeOtherInstallations = async (
    walletClient: WalletClient, 
    inboxId: string, 
    env: XmtpEnv = (process.env.NEXT_PUBLIC_XMTP_ENV as any) || "production"
) => {
    if (!walletClient.account) throw new Error("Wallet not connected");

    const signer = {
        type: "EOA" as const,
        getIdentifier: async () => ({
            identifier: walletClient.account!.address,
            identifierKind: IdentifierKind.Ethereum,
        }),
        signMessage: async (message: string) => {
            const signature = await walletClient.signMessage({
                account: walletClient.account!,
                message
            });
            return hexToBytes(signature);
        },
    };

    try {
        console.log(`Attempting to revoke installations for Inbox ID: ${inboxId}`);

        // 1. Get Inbox State to find installations using static method
        // type-casting Client to any because TS is failing to pick up static methods despite being in d.ts
        const inboxStates = await (Client as any).fetchInboxStates([inboxId], env);

        if (!inboxStates || inboxStates.length === 0) {
            throw new Error("Could not fetch inbox state");
        }

        const inboxState = inboxStates[0];

        // 2. Filter installations
        // Revoke ALL existing installations to ensure we can register the new one.
        const installations = inboxState.installations;

        if (installations.length === 0) {
            console.log("No installations to revoke.");
            return;
        }

        // Map to bytes for revocation
        // Accessing 'id' (which is bytes) from each installation
        // Ensure we handle both hex strings and byte arrays
        const installationIds = installations.map((inst: any) => {
            if (typeof inst.id === "string") {
                return inst.id.startsWith("0x") ? hexToBytes(inst.id as any) : hexToBytes(("0x" + inst.id) as any);
            }
            return inst.id as Uint8Array;
        });

        console.log(`Revoking ${installationIds.length} installations...`);

        // 3. Revoke using static method
        await (Client as any).revokeInstallations(signer, inboxId, installationIds, env);

        // 4. Verify revocation (polling)
        let retries = 5;
        while (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
            try {
                const newInboxStates = await (Client as any).fetchInboxStates([inboxId], env);
                const newInstallations = newInboxStates?.[0]?.installations || [];
                // account for the current installation that might still be there or if we revoked everything
                if (newInstallations.length < installations.length) {
                    console.log("Verification successful: Installation count dropped.");
                    return;
                }
                console.log(`Verification pending: ${newInstallations.length} installations remaining...`);
            } catch (err) {
                console.warn("Verification check failed, retrying...", err);
            }
            retries--;
        }
        console.warn("Verification timed out. Proceeding regardless.");

    } catch (error) {
        console.error("Failed to revoke installations:", error);
        throw error;
    }
};

/**
 * Wipes all local XMTP data from the browser's Origin Private File System (OPFS).
 * This is a "hard reset" for the XMTP V3 client on the current device.
 */
export const wipeLocalXmtpData = async () => {
    try {
        console.log("Wiping local XMTP storage (OPFS)...");
        // Get the root of the OPFS
        const root = await navigator.storage.getDirectory();
        
        // XMTP v3 usually stores data in a directory or file within OPFS
        // To be safe and thorough, we clear the entire directory.
        // We iterate and remove all entries.
        for await (const name of (root as any).keys()) {
            await root.removeEntry(name, { recursive: true });
        }
        
        console.log("Local XMTP storage wiped successfully.");
        return true;
    } catch (error) {
        console.error("Failed to wipe local XMTP storage:", error);
        // Fallback: try clearing indexedDB if any was used (though V3 is primarily OPFS)
        try {
            const dbs = await window.indexedDB.databases();
            dbs.forEach(db => {
                if (db.name?.includes("xmtp")) {
                    window.indexedDB.deleteDatabase(db.name);
                }
            });
        } catch (e) { /* ignore fallback errors */ }
        return false;
    }
};

