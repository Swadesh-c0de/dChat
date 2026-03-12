'use client';

import { motion } from 'framer-motion';
import { Cpu, Database, Network, Code2, Terminal, FileCode, Activity, Layers, Shield, Zap, Lock } from 'lucide-react';

export function ProjectOverviewCard() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col w-full max-w-[450px] lg:w-[450px] glass-dark rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group mx-auto lg:mx-0"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">

                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-2">Protocol_Manifest.v3</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-zinc-400">NETWORK_LIVE</span>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Core Stack */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Cpu className="w-3.5 h-3.5" />
                        <h4 className="text-[11px] uppercase tracking-widest font-bold">Foundation Stack</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Network', value: 'XMTP V3', icon: Network },
                            { label: 'Framework', value: 'Next.js 16', icon: Layers },
                            { label: 'Logic', value: 'TypeScript', icon: Code2 },
                            { label: 'Style', value: 'Tailwind 4', icon: Activity },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group/item">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <item.icon className="w-3 h-3 text-zinc-500 group-hover/item:text-white transition-colors" />
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-tight">{item.label}</span>
                                </div>
                                <span className="text-xs font-bold text-zinc-200">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Features */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Lock className="w-3.5 h-3.5" />
                        <h4 className="text-[11px] uppercase tracking-widest font-bold">Security & Encryption</h4>
                    </div>
                    <div className="space-y-2">
                        {[
                            { title: 'End-to-End Encryption', desc: 'Device-level XMTP sealing', icon: Shield },
                            { title: 'Decentralized Identity', desc: 'Ethereum wallet-based auth', icon: UserCircle },
                            { title: 'Session Revocation', desc: 'Secure multi-device management', icon: Zap },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 group/feat">
                                <div className="mt-1 p-1 rounded bg-white/[0.03] border border-white/10 text-zinc-400 group-hover/feat:text-white group-hover/feat:border-zinc-500 transition-all">
                                    <item.icon className="w-3 h-3" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-zinc-200 tracking-tight">{item.title}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* File Structure Visualization */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Terminal className="w-3.5 h-3.5" />
                        <h4 className="text-[11px] uppercase tracking-widest font-bold">Project Architecture</h4>
                    </div>
                    <div className="font-mono text-[10px] bg-black/40 rounded-lg p-3 border border-white/5 space-y-1.5 overflow-hidden relative">
                        <div className="text-zinc-500">dchat/</div>
                        <div className="flex items-center gap-2 ml-3">
                            <span className="text-zinc-700">├─</span>
                            <FileCode className="w-3 h-3 text-zinc-600" />
                            <span className="text-zinc-300">src/app/</span>
                            <span className="text-zinc-600 italic">// Next.js Routes</span>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            <span className="text-zinc-700">├─</span>
                            <Cpu className="w-3 h-3 text-zinc-600" />
                            <span className="text-zinc-300">src/lib/xmtp/</span>
                            <span className="text-zinc-600 italic">// Protocol Logic</span>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            <span className="text-zinc-700">├─</span>
                            <Layers className="w-3 h-3 text-zinc-600" />
                            <span className="text-zinc-300">src/components/</span>
                            <span className="text-zinc-600 italic">// Modular UI</span>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            <span className="text-zinc-700">└─</span>
                            <Database className="w-3 h-3 text-zinc-600" />
                            <span className="text-zinc-300">src/lib/ipfs.ts</span>
                            <span className="text-zinc-600 italic">// File Sharing</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Footer */}
            <div className="mt-auto p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] font-mono text-zinc-600">
                    v1.0.0_PRODUCTION
                </div>
            </div>

            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-20 scanline-effect" />
            </div>
        </motion.div>
    );
}

function UserCircle({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
    );
}
