'use client';

import { LoginButton } from "@/components/auth/login-button";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const router = useRouter();

    const handleScroll = useCallback(() => {
        const currentScrollY = window.scrollY;

        // Show/hide based on scroll direction
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setHidden(true); // scrolling down — hide
        } else {
            setHidden(false); // scrolling up — show
        }

        setScrolled(currentScrollY > 20);
        setLastScrollY(currentScrollY);
    }, [lastScrollY]);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
        <div className={cn(
            "fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4 pt-3 sm:pt-5 transition-all duration-500",
            hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}>
            <nav className={cn(
                "rounded-2xl flex items-center justify-between pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                scrolled
                    ? "w-full max-w-2xl px-4 sm:px-6 py-2.5 bg-zinc-950/80 backdrop-blur-xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                    : "w-full max-w-4xl px-5 sm:px-8 py-3 bg-transparent border border-transparent shadow-none"
            )}>
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => router.push('/')}
                >
                    <Image
                        src="/dChat.svg"
                        alt="dChat Logo"
                        width={36}
                        height={36}
                        className="ml-2 rounded-full scale-200"
                        priority
                    />
                    <span className={cn(
                        "text-sm font-bold text-white tracking-tight transition-all duration-300",
                        scrolled ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                    )}>
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
                    {[
                        { href: "#manifest", label: "Architecture" },
                        { href: "#features", label: "Features" },
                        { href: "#privacy", label: "Privacy" },
                        { href: "https://docs.xmtp.org", label: "Docs", external: true },
                    ].map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            onClick={(e) => {
                                if (link.href.startsWith('#')) {
                                    e.preventDefault();
                                    const element = document.querySelector(link.href);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth' });
                                        window.history.pushState(null, '', link.href);
                                    }
                                }
                            }}
                            className="hover:text-white transition-colors duration-200 relative group py-1"
                        >
                            {link.label}
                            <span className="absolute bottom-0 left-0 w-0 h-px bg-white/50 transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                <div className={cn(
                    "transition-all duration-300",
                    scrolled ? "pl-3 sm:pl-4 border-l border-white/10" : "pl-3 sm:pl-4"
                )}>
                    <LoginButton />
                </div>
            </nav>
        </div>
    );
}
