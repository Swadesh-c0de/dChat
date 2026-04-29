'use client';

import * as React from "react";

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    title?: string;
    description?: string;
    type: ToastType;
}

interface ToastContextType {
    toasts: Toast[];
    toast: (options: { title?: string; description?: string; variant?: string }) => void;
    removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id));
    }, []);

    const toast = React.useCallback(({ title, description, variant }: { title?: string; description?: string; variant?: string }) => {
        const id = Math.random().toString(36).substring(2, 9);
        const type: ToastType = variant === 'destructive' ? 'error' : 'success';
        setToasts((prev: Toast[]) => [...prev, { id, title, description, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, toast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
