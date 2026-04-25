import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            // Add TURN server credentials here if needed later for strict firewalls
            // Example with Metered.ca (500GB/month free):
            // {
            //     urls: "turn:a.relay.metered.ca:443",
            //     username: "YOUR_USERNAME",
            //     credential: "YOUR_CREDENTIAL",
            // },
        ],
    });
}
