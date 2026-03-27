"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
      <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-xl relative z-10 max-w-sm text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3 tracking-tight">Something went wrong</h2>
        <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
           The secure layer encountered an unexpected interruption. We might need to re-sync your session.
        </p>
        <button
          onClick={() => reset()}
          className="w-full px-6 py-3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
