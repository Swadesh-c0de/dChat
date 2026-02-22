'use client';

import { Navbar } from "@/components/layout/navbar";
import { LoginButton } from "@/components/auth/login-button";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  GlobeLock,
  ArrowRight,
  MessageSquare,
  Shield,
  Activity,
} from "lucide-react";
import { useAccount } from "wagmi";
import { ProjectOverviewCard } from "@/components/home/project-overview-card";
import { CodePreview } from "@/components/home/code-preview";
import { EncryptionCard } from "@/components/home/encryption-card";

const features = [
  {
    icon: ShieldCheck,
    title: "XMTP V3 Encryption",
    description: "Every message is sealed with X3DH key exchange and Double Ratchet protocol — ensuring total privacy.",
    accent: "from-emerald-500/20 to-emerald-500/0",
  },
  {
    icon: GlobeLock,
    title: "IPFS File Sharing",
    description: "Decentralized file storage via Pinata & Remote Attachments. Encrypted before it ever leaves your device.",
    accent: "from-blue-500/20 to-blue-500/0",
  },
  {
    icon: Zap,
    title: "Multi-Device Sync",
    description: "Built-in session management and revocation. Seamlessly handle the 10-installation protocol limit.",
    accent: "from-amber-500/20 to-amber-500/0",
  },
  {
    icon: MessageSquare,
    title: "Real-time Streaming",
    description: "Instant message delivery via decentralized nodes. No central server delays or bottlenecks.",
    accent: "from-purple-500/20 to-purple-500/0",
  },
  {
    icon: Shield,
    title: "Wallet-Native Auth",
    description: "Your Ethereum address IS your identity. No emails, no passwords, no centralized databases.",
    accent: "from-zinc-500/20 to-zinc-500/0",
  },
  {
    icon: Activity,
    title: "Smart UX",
    description: "Automatic message grouping, intelligent date headers, and persistent scroll management by default.",
    accent: "from-cyan-500/20 to-cyan-500/0",
  },
];

const stats = [
  { label: "Protocol", value: "XMTP V3" },
  { label: "Encryption", value: "E2E" },
  { label: "Storage", value: "IPFS" },
  { label: "Sovereign", value: "100%" },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-white/20 selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col relative">
        {/* ── Background Effects ── */}
        <div className="absolute inset-0 grid-bg pointer-events-none" />

        {/* Central glow orb */}
        <div
          className="hero-glow-orb absolute top-[40%] left-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Secondary subtle orb */}
        <div
          className="hero-glow-orb absolute top-[60%] left-[30%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(130,130,255,0.04) 0%, transparent 70%)',
            animationDelay: '3s',
          }}
        />

        {/* ── Hero Section ── */}
        <section className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[90vh] pt-32 sm:pt-28 px-5 sm:px-12 text-center">
          <div className="max-w-5xl mx-auto w-full space-y-12 sm:space-y-16">

            <div className="space-y-8 mt-16">
              {/* Headline */}
              <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter leading-[0.8] animate-float-up-delay-1 bg-gradient-to-b from-white via-white/90 to-zinc-600 bg-clip-text text-transparent">
                Talk Without<br /> Trust.
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-10 animate-float-up-delay-2">
                The decentralized messaging layer for the sovereign web. <span className="text-white">Built</span> on XMTP. <span className="text-white">Secured</span> by Ethereum. <span className="text-white">Owned</span> by You.
              </p>
            </div>

            {/* CTA Buttons */}
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

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pt-12 items-center justify-center animate-float-up-delay-4 border-t border-white/5 opacity-80">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <div className="text-xl sm:text-2xl font-bold text-white tracking-widest">{stat.value}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── System Manifest Section (Moved & Improved) ── */}
        <section id="manifest" className="relative z-10 py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-5 sm:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

              <div className="space-y-8 sm:space-y-12">
                <div className="space-y-4">
                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                    Technical Manifest.<br />
                    <span className="text-zinc-600 italic">Engineered for Privacy.</span>
                  </h2>
                  <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
                    dChat isn't just a UI; it's a decentralized node in the global XMTP web.
                    Integrating V3 protocols for end-to-end sovereignty.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-emerald-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Client Singleton</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Advanced session management prevents concurrent client conflicts and handles the 10/10 device limit automatically.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-blue-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Remote Attachments</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Files are sliced, encrypted with unique keys, and pinned to IPFS. Only the recipient can reconstruct the data.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-purple-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Protocol V3</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Leverages the latest MLS (Messaging Layer Security) standards for group chats and improved network performance.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-zinc-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Decentralized Auth</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Signature-based identity verification. No passwords, no KYC, no central user database to be breached.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                {/* Background glow for the card */}
                <div className="absolute -inset-20 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                <ProjectOverviewCard />
              </div>

            </div>
          </div>
        </section>


        {/* ── Features Section ── */}
        <section id="features" className="relative z-10 py-16 sm:py-24 md:py-32 px-5 sm:px-12">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Why dChat?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl mx-auto">
                Your keys, your messages. A chat app that respects you by default.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="rounded-2xl p-6 sm:p-8 bg-white/[0.02] border border-white/[0.06] cursor-default group hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    {/* Icon */}
                    <div className="relative mb-6">
                      <div className="h-12 w-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-white/20 transition-all duration-300">
                        <Icon className="h-6 w-6 text-foreground" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground tracking-tight">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Privacy/Security Section ── */}
        <section id="privacy" className="relative z-10 py-24 sm:py-32 px-5 sm:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div className="order-2 lg:order-1 flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
              >
                <EncryptionCard />
              </motion.div>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                  Zero Access.<br />Zero Metadata.
                </h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Unlike traditional "secure" apps, dChat removes the company from the equation.
                  Messages are end-to-end encrypted before they reach the network.
                  Even the XMTP nodes cannot see who is talking to whom.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Sovereign Identity", desc: "No phone numbers or emails required. Connect via wallet." },
                  { title: "P2P Network", desc: "Decentralized message propagation via libp2p and XMTP nodes." },
                  { title: "Forward Secrecy", desc: "New encryption keys for every message batch." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-1 group-hover:scale-110 transition-transform">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <Link
                  href="https://docs.xmtp.org"
                  target="_blank"
                  className="group flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Deep dive into Protocol docs
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <div className="h-px w-12 bg-white/10 hidden sm:block" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">Secure Protocol v3.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Integration Section (New) ── */}
        <section id="integration" className="relative z-10 py-24 sm:py-32 px-5 sm:px-12">
          <div className="max-w-4xl mx-auto space-y-12 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white line">
                Built on Open Standards.
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                No proprietary silos. Just clean, interoperable code that puts users first.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <CodePreview />
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              {['Wagmi', 'Next.js', 'Viem', 'Pinata', 'Tailwind', 'RainbowKit'].map(logo => (
                <span key={logo} className="text-sm font-bold tracking-widest text-white uppercase">{logo}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Call to Action ── */}
        <section className="relative z-10 py-32 px-5 sm:px-12 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] blur-[150px] pointer-events-none" />
          <div className="max-w-2xl mx-auto space-y-8 relative">
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Ready to claim your<br /> digital sovereignty?
            </h2>
            <p className="text-zinc-400 text-lg">
              No signups. No fees. Just pure, decentralized communication.
            </p>
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
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] pt-8">
              Available on all modern web browsers & mobile devices.
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-6 sm:py-8 border-t border-border/40">
        <div className="container flex justify-between items-center text-xs sm:text-sm text-muted-foreground/60 px-5 sm:px-6">
          <p className="font-medium tracking-tight">dChat &copy; 2026</p>
          <div className="flex gap-6">
            <a href="https://github.com/Swadesh-c0de/dChat" className="hover:text-foreground/80 transition-colors duration-200">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
