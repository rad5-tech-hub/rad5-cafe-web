import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Icon, type IconName } from '../components/ui/icon';

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

const variantConfig = {
  default: { confirmVariant: 'primary' as const, icon: 'alert-triangle' as IconName, accentClass: 'bg-tint', textAccentClass: 'text-tint', bgLightClass: 'bg-tint/10' },
  danger: { confirmVariant: 'danger' as const, icon: 'alert-triangle' as IconName, accentClass: 'bg-error-val', textAccentClass: 'text-error-val', bgLightClass: 'bg-error-val/10' },
};

function ConfirmModal({ item, onDismiss }: { item: ConfirmItem; onDismiss: (value: boolean) => void }) {
  const config = variantConfig[item.variant ?? 'default'];
  const icon = item.icon ?? config.icon;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => onDismiss(false)} />

      {/* Dialog Wrapper */}
      <div
        className="relative bg-card border border-border w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-scale-up"
        style={{
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div className={`h-1.5 w-full ${config.accentClass}`} />

        <div className="p-6 flex flex-col items-center gap-3">
          {icon && (
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${config.bgLightClass}`}>
              <Icon name={icon} size={28} className={config.textAccentClass} />
            </div>
          )}

          <h3 className="text-xl font-bold text-text-main text-center leading-snug select-none">{item.title}</h3>

          {item.message && (
            <p className="text-text-secondary text-sm text-center leading-relaxed select-all">
              {item.message}
            </p>
          )}

          <div className="flex gap-3 w-full mt-4">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => onDismiss(false)}
            >
              {item.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={config.confirmVariant}
              size="md"
              fullWidth
              onClick={() => onDismiss(true)}
            >
              {item.confirmLabel ?? 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
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
