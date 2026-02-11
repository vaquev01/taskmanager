import { useToastStore } from '../store/useToastStore';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />,
};

const colors: Record<string, string> = {
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
    info: 'border-violet-500/40 bg-violet-500/10 text-violet-400',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl animate-fade-in-up ${colors[toast.type]}`}
                >
                    {icons[toast.type]}
                    <span className="text-sm font-medium text-[var(--text-main)] flex-1">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors text-[var(--text-dim)]"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};
