'use client';

import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

export function CodePreview() {
    const [copied, setCopied] = useState(false);

    const code = `
// 1. Initialize XMTP Client
const xmtp = await Client.create(signer, { 
  env: "production" 
});

// 2. Start Conversation
const conversation = await xmtp.conversations.newConversation(
  "0x123..." // Recipient Address
);

// 3. Send Encrypted Message
await conversation.send("Hello decentralized world!");
  `.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto glass-dark rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="bg-white/[0.03] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-zinc-500" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">xmtp_integration.ts</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-white/5 rounded-md transition-colors group"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />}
                </button>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre">
                <pre className="text-zinc-400">
                    <span className="text-zinc-600 italic">// 1. Initialize XMTP Client</span>{"\n"}
                    <span className="text-purple-400">const</span> xmtp = <span className="text-purple-400">await</span> Client.<span className="text-blue-400">create</span>(signer, {"{"}{"\n"}
                    {"  "}env: <span className="text-emerald-400">"production"</span>{"\n"}
                    {"}"});{"\n\n"}
                    <span className="text-zinc-600 italic">// 2. Start Conversation</span>{"\n"}
                    <span className="text-purple-400">const</span> conversation = <span className="text-purple-400">await</span> xmtp.conversations.<span className="text-blue-400">newConversation</span>({"\n"}
                    {"  "}<span className="text-emerald-400">"0x123..."</span> <span className="text-zinc-600 italic">// Recipient Address</span>{"\n"}
                    );{"\n\n"}
                    <span className="text-zinc-600 italic">// 3. Send Encrypted Message</span>{"\n"}
                    <span className="text-purple-400">await</span> conversation.<span className="text-blue-400">send</span>(<span className="text-emerald-400">"Hello decentralized world!"</span>);
                </pre>
            </div>
        </div>
    );
}
