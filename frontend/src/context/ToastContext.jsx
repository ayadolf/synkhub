import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
        return id;
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error', 6000),
        warning: (msg) => addToast(msg, 'warning', 5000),
        info: (msg) => addToast(msg, 'info'),
    };

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const iconMap = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info',
    };

    const colorMap = {
        success: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', icon: 'text-primary' },
        error: { bg: 'bg-error/10', border: 'border-error/30', text: 'text-on-surface', icon: 'text-error' },
        warning: { bg: 'bg-tertiary/10', border: 'border-tertiary/30', text: 'text-on-surface', icon: 'text-tertiary' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-on-surface', icon: 'text-blue-500' },
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map((t) => {
                    const colors = colorMap[t.type] || colorMap.info;
                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto ${colors.bg} border ${colors.border} rounded-2xl px-5 py-4 shadow-lg backdrop-blur-xl flex items-start gap-3 animate-slide-in`}
                        >
                            <span className={`material-symbols-outlined text-xl mt-0.5 flex-shrink-0 ${colors.icon}`}>
                                {iconMap[t.type] || 'info'}
                            </span>
                            <p className={`text-sm font-medium ${colors.text} flex-1`}>{t.message}</p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-on-surface-variant/50 hover:text-on-surface transition-colors flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
