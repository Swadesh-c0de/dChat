'use client';

import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export function Toaster() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl min-w-[300px] transition-all duration-300 ${toast.type === 'error' ? 'glass-dark bg-destructive/20 border-destructive/30 text-destructive' :
                            toast.type === 'success' ? 'glass-dark bg-green-500/10 border-green-500/20 text-green-500' :
                                'glass-dark text-foreground'
                            }`}
                    >
                        {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
                        {toast.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
                        {toast.type === 'info' && <Info className="h-5 w-5 shrink-0" />}

                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            {toast.title && <p className="text-sm font-bold tracking-tight">{toast.title}</p>}
                            {toast.description && <p className="text-xs font-medium opacity-90 truncate">{toast.description}</p>}
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4 opacity-70" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
