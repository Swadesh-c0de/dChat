'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Lock, ShieldCheck, Fingerprint, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';

function TypewriterHash({ text, delay = 0 }: { text: string; delay?: number }) {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        const timeout = setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayed(text.slice(0, i + 1));
                i++;
                if (i >= text.length) clearInterval(interval);
            }, 25);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timeout);
    }, [text, delay]);
    return <span>{displayed}<span className="animate-pulse">_</span></span>;
}

export function EncryptionCard() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 600),
            setTimeout(() => setStep(2), 1400),
            setTimeout(() => setStep(3), 2200),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="relative group w-full max-w-md mx-auto">
            {/* Outer glow */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-emerald-500/20 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-white/[0.06]">
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Secure Tunnel Active</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-zinc-800" />
                        <div className="w-2 h-2 rounded-full bg-zinc-800" />
                        <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    </div>
                </div>

                {/* Main content */}
                <div className="p-6 sm:p-8 space-y-6">
                    {/* Lock icon with rings */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center">
                                <Lock className="w-7 h-7 text-emerald-400" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">Trustless Encryption</h3>
                        <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">AES-256-GCM · X3DH · MLS</p>
                    </div>

                    {/* Animated terminal */}
                    <div className="rounded-xl bg-black/80 border border-white/5 overflow-hidden">
                        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            <span className="text-[9px] font-mono text-zinc-600 uppercase">encryption pipeline</span>
                        </div>
                        <div className="p-4 font-mono text-[11px] leading-6 space-y-1 min-h-[120px]">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={step >= 1 ? { opacity: 1, x: 0 } : {}}
                                className="flex gap-2"
                            >
                                <span className="text-zinc-600">{'>'}</span>
                                <span className="text-emerald-400">Deriving session key...</span>
                                {step >= 2 && <span className="text-emerald-600">✓</span>}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={step >= 2 ? { opacity: 1, x: 0 } : {}}
                                className="flex gap-2"
                            >
                                <span className="text-zinc-600">{'>'}</span>
                                <span className="text-blue-400">Encrypting payload...</span>
                                {step >= 3 && <span className="text-emerald-600">✓</span>}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={step >= 3 ? { opacity: 1, x: 0 } : {}}
                                className="flex gap-2"
                            >
                                <span className="text-zinc-600">{'>'}</span>
                                <span className="text-zinc-400">Hash: </span>
                                <span className="text-zinc-500">
                                    <TypewriterHash text="0x8a2f3c91...e4d1b7" delay={200} />
                                </span>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={step >= 3 ? { opacity: 1 } : {}}
                                transition={{ delay: 0.8 }}
                                className="flex gap-2 pt-1"
                            >
                                <span className="text-zinc-600">{'>'}</span>
                                <span className="text-emerald-500 font-bold">Sealed. Ready for broadcast.</span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Bottom badges */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: ShieldCheck, label: 'E2E Verified' },
                            { icon: Fingerprint, label: 'Zero Knowledge' },
                            { icon: KeyRound, label: 'Forward Secrecy' },
                        ].map((badge, i) => (
                            <motion.div
                                key={badge.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.15 }}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                            >
                                <badge.icon className="w-4 h-4 text-zinc-500" />
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider text-center leading-tight">{badge.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
