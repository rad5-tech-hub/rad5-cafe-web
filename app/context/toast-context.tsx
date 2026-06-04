import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { Icon, type IconName } from '../components/ui/icon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, 'id'> | string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig: Record<ToastType, { bgKey: string; iconName: IconName }> = {
  success: { bgKey: 'bg-success', iconName: 'check' },
  error: { bgKey: 'bg-error-val', iconName: 'x' },
  warning: { bgKey: 'bg-warning', iconName: 'alert-triangle' },
  info: { bgKey: 'bg-tint', iconName: 'bell' },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const config = toastConfig[item.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      onClick={() => onDismiss(item.id)}
      className={`flex items-center gap-3 px-4 py-3 text-white rounded-xl shadow-xl border border-white/10 max-w-sm w-full cursor-pointer animate-bounce-in transition-all duration-300 hover:scale-[1.02] ${config.bgKey}`}
      style={{
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
        <Icon name={config.iconName} size={18} color="#FFFFFF" />
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="font-bold text-sm leading-snug truncate">{item.title}</span>
        {item.message && (
          <span className="text-white/85 text-xs leading-normal break-words">{item.message}</span>
        )}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'> | string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2);
    if (typeof toast === 'string') {
      setToasts((prev) => [...prev, { id, title: toast, type }]);
    } else {
      setToasts((prev) => [...prev, { ...toast, id }]);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <ToastCard item={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
