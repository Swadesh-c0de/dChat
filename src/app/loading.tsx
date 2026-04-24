import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin shadow-[0_0_20px_rgba(255,255,255,0.1)]"></div>
          <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-20 blur-md">
             <div className="w-16 h-16 border-4 border-white rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">Syncing Layer</h2>
          <p className="text-zinc-500 text-sm font-medium">Securing your communications...</p>
        </div>
      </div>
    </div>
  );
}
