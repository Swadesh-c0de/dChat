"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { LoginButton } from "@/components/auth/login-button";

export function BottomCTA() {
  const { isConnected } = useAccount();

  return (
    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
      <LoginButton />
      {isConnected && (
        <Link
          href="/chat"
          className="px-8 py-3.5 rounded-full bg-white text-black font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          Open Inbox
        </Link>
      )}
    </div>
  );
}