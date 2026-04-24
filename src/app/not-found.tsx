import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
      <div className="text-center space-y-8 relative z-10 max-w-sm animate-in fade-in duration-700 blur-in-sm scale-in-95">
        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-800 drop-shadow-2xl">404</h1>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Lost in Cyberspace</h2>
          <p className="text-zinc-500 text-sm leading-relaxed px-4">
            The page you're searching for hasn't been broadcasted on the network.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center px-8 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:scale-105 rounded-full text-white font-semibold transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)] active:scale-[0.98]"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
