import { PinataSDK } from "pinata-web3";

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
        const upload = await pinata.upload.file(file);
        return upload.IpfsHash;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw new Error("Failed to upload file to IPFS");
    }
};
