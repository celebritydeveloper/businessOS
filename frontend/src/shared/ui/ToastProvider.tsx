import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Standalone event dispatcher so non-React modules (httpClient, syncEngine) can trigger toasts
export const toast = {
  success: (message: string, title?: string) => dispatchToast('success', message, title),
  error: (message: string, title?: string) => dispatchToast('error', message, title),
  warning: (message: string, title?: string) => dispatchToast('warning', message, title),
  info: (message: string, title?: string) => dispatchToast('info', message, title),
};

function dispatchToast(variant: ToastVariant, message: string, title?: string) {
  window.dispatchEvent(new CustomEvent('bos:toast', { detail: { variant, message, title } }));
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((variant: ToastVariant, message: string, title?: string) => {
    if (!message) return;
    const id = crypto.randomUUID();
    setItems((prev) => [...prev.slice(-3), { id, variant, title, message }]);
    setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ variant: ToastVariant; message: string; title?: string }>).detail;
      if (detail) showToast(detail.variant, detail.message, detail.title);
    };
    window.addEventListener('bos:toast', handler);
    return () => window.removeEventListener('bos:toast', handler);
  }, [showToast]);

  const value: ToastContextValue = {
    showToast,
    success: (m, t) => showToast('success', m, t),
    error: (m, t) => showToast('error', m, t),
    warning: (m, t) => showToast('warning', m, t),
    info: (m, t) => showToast('info', m, t),
  };

  const styles: Record<ToastVariant, { border: string; icon: ReactNode; titleColor: string }> = {
    success: {
      border: 'border-emerald-200 bg-white',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      titleColor: 'text-emerald-900',
    },
    error: {
      border: 'border-red-200 bg-white',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
      titleColor: 'text-red-900',
    },
    warning: {
      border: 'border-amber-200 bg-white',
      icon: <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0" />,
      titleColor: 'text-amber-900',
    },
    info: {
      border: 'border-brand-100 bg-white',
      icon: <Info className="w-5 h-5 text-brand-600 shrink-0" />,
      titleColor: 'text-slate-900',
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Global Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2.5 pointer-events-none"
      >
        {items.map((item) => {
          const s = styles[item.variant];
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all ${s.border}`}
            >
              <div className="mt-0.5">{s.icon}</div>
              <div className="flex-1 min-w-0">
                {item.title && <p className={`text-xs font-bold ${s.titleColor}`}>{item.title}</p>}
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Close notification"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
