import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GlassSheet } from '../components/ui/glass-panel';
import type { IconName } from '../components/ui/icon';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  icon?: IconName;
};

type ConfirmItem = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

function ConfirmModal({ item, onDismiss }: { item: ConfirmItem; onDismiss: (value: boolean) => void }) {
  const isDanger = (item.variant ?? 'default') === 'danger';
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={() => onDismiss(false)}
      className="fixed inset-0 z-9999 grid place-items-center p-5"
      style={{ background: 'rgba(17,24,39,0.38)', backdropFilter: 'blur(5px)' }}
    >
      <GlassSheet onClick={stop} className="w-full animate-rad5-pop" radius="lg" style={{ maxWidth: 360 }}>
        <h2 className="text-[19px] font-extrabold tracking-tight">{item.title}</h2>
        {item.message && <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary select-all">{item.message}</p>}

        <div className="flex gap-2.5 mt-5.5">
          <button
            onClick={() => onDismiss(false)}
            className="flex-1 py-3 rounded-xl border border-border bg-card text-sm font-semibold cursor-pointer hover:border-tint hover:text-tint transition-colors"
          >
            {item.cancelLabel ?? 'Stay'}
          </button>
          <button
            onClick={() => onDismiss(true)}
            className={`flex-1 py-3 rounded-xl border-none text-white text-sm font-bold cursor-pointer transition-colors ${
              isDanger ? 'bg-error-val hover:brightness-110' : 'bg-tint-dark hover:bg-tint'
            }`}
          >
            {item.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </GlassSheet>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ConfirmItem[]>([]);
  const [current, setCurrent] = useState<ConfirmItem | null>(null);

  // Safely process queue outside of render phase using useEffect
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  }, [current, queue]);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const item: ConfirmItem = { ...options, resolve };
      setQueue((prev) => [...prev, item]);
    });
  }, []);

  const handleDismiss = useCallback(
    (value: boolean) => {
      if (current) {
        current.resolve(value);
        setCurrent(null);
      }
    },
    [current],
  );

  const value = useMemo<ConfirmContextValue>(() => ({ showConfirm }), [showConfirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {current ? <ConfirmModal item={current} onDismiss={handleDismiss} /> : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
}
