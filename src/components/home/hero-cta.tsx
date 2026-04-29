"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";

export function HeroCTA() {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-float-up-delay-3 px-4">
      <LoginButton />
      {isConnected && (
        <Link
          href="/chat"
          className="group px-8 py-3.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 font-bold flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto"
        >
          Launch App
          <MessageSquare className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      )}
      <a
        href="https://docs.xmtp.org"
        target="_blank"
        rel="noopener noreferrer"
        className="group px-8 py-3.5 rounded-full border border-border/60 bg-white/[0.02] md:backdrop-blur-sm hover:bg-white/[0.05] text-foreground transition-all duration-300 font-medium flex items-center justify-center gap-2 text-sm hover:border-white/20 w-full sm:w-auto"
      >
        Read Protocol
        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
      </a>
    </div>
  );
}
