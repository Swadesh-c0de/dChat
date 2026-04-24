import { PinataSDK } from "pinata";

export const uploadFileToIPFS = async (file: File): Promise<string> => {
    const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
    if (!jwt) {
        throw new Error("Pinata JWT not found in environment variables");
    }

    const pinata = new PinataSDK({
        pinataJwt: jwt,
        pinataGateway: "gateway.pinata.cloud", // Default gateway, can be customized
    });

    try {
        const upload = await pinata.upload.public.file(file);
        return upload.cid;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw new Error("Failed to upload file to IPFS");
    }
};
