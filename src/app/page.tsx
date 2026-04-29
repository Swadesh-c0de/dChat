import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  GlobeLock,
  ArrowRight,
  Shield,
  Activity,
  MessageSquare,
  Video,
  Phone,
} from "lucide-react";
import { ProjectOverviewCard } from "@/components/home/project-overview-card";
import { CodePreview } from "@/components/home/code-preview";
import { EncryptionCard } from "@/components/home/encryption-card";
import { HeroCTA } from "@/components/home/hero-cta";
import { BottomCTA } from "@/components/home/bottom-cta";
import { FeatureCard } from "@/components/home/feature-card";
import { ScrollAnimationWrapper } from "@/components/home/scroll-animation-wrapper";

const features = [
  {
    icon: ShieldCheck,
    title: "XMTP V3 Encryption",
    description: "Every message is sealed with MLS (Messaging Layer Security) — ensuring multi-device forward secrecy.",
    accent: "from-emerald-500/20 to-emerald-500/0",
  },
  {
    icon: Video,
    title: "E2E Voice & Video",
    description: "Encrypted peer-to-peer calling powered by WebRTC. High-fidelity streams, zero surveillance.",
    accent: "from-blue-500/20 to-blue-500/0",
  },
  {
    icon: GlobeLock,
    title: "IPFS File Sharing",
    description: "Decentralized file storage via Pinata & Remote Attachments. Encrypted before it ever leaves your device.",
    accent: "from-purple-500/20 to-purple-500/0",
  },
  {
    icon: Shield,
    title: "Sovereign Identity",
    description: "Your wallet is your profile. Persistent avatars and names synced across the decentralized web.",
    accent: "from-amber-500/20 to-amber-500/0",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description: "Automatic history recovery and real-time streaming via decentralized nodes. No central server bottlenecks.",
    accent: "from-zinc-500/20 to-zinc-500/0",
  },
  {
    icon: Activity,
    title: "Enterprise UX",
    description: "Multi-device session management, message revocation, and intelligent threading by default.",
    accent: "from-cyan-500/20 to-cyan-500/0",
  },
];

const stats = [
  { label: "Protocol", value: "MLS V3" },
  { label: "Calling", value: "WebRTC" },
  { label: "Storage", value: "IPFS" },
  { label: "Uptime", value: "99.9%" },
];

export default function Home() {
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
            <HeroCTA />

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
                    dChat isn&apos;t just a UI; it&apos;s a decentralized node in the global XMTP web.
                    Integrating V3 protocols for end-to-end sovereignty.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-emerald-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">E2E Media Layer</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Custom WebRTC implementation with XMTP signaling ensures that voice and video metadata never touches a central server.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-blue-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Remote Attachments</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Files are encrypted with unique keys and pinned to IPFS. Only the recipient with the correct hash can reconstruct them.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-purple-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">MLS Protocol V3</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Utilizes Messaging Layer Security for perfect forward secrecy and efficient group messaging across all devices.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-zinc-500/50 mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Self-Sovereign Identity</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Names and avatars are encrypted and stored on the network. Your social graph is your own, portable and permanent.
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
              {features.map((feature, i) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                  icon={<feature.icon className="h-6 w-6 text-foreground" />}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Privacy/Security Section ── */}
        <section id="privacy" className="relative z-10 py-24 sm:py-32 px-5 sm:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div className="order-2 lg:order-1 flex justify-center">
              <ScrollAnimationWrapper>
                <EncryptionCard />
              </ScrollAnimationWrapper>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                  Zero Access.<br />Zero Metadata.
                </h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Unlike traditional &quot;secure&quot; apps, dChat removes the company from the equation.
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

            <ScrollAnimationWrapper>
              <CodePreview />
            </ScrollAnimationWrapper>

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
            <BottomCTA />
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
