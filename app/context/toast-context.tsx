import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

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

const dotColor: Record<ToastType, string> = {
  success: 'var(--color-ok)',
  error: 'var(--color-err)',
  warning: 'var(--color-warn)',
  info: 'var(--color-tint)',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 2600);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      onClick={() => onDismiss(item.id)}
      className="flex items-center gap-3 px-5 py-3.5 rounded-[14px] text-white cursor-pointer animate-rad5-pop"
      style={{
        background: 'rgba(17,24,39,0.92)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 24px 50px -20px rgba(17,24,39,0.7)',
      }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor[item.type] }} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[13.5px] font-semibold leading-snug truncate">{item.title}</span>
        {item.message && <span className="text-white/75 text-xs leading-normal break-words">{item.message}</span>}
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
      {/* Toast Overlay Container — bottom-center, stacked upward */}
      <div className="fixed z-9999 bottom-6 left-1/2 -translate-x-1/2 flex flex-col-reverse gap-2.5 items-center pointer-events-none px-4">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
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
