import React from 'react';

type PinPadProps = {
  value: string;
  onChange: (next: string) => void;
  onConfirm?: () => void;
  length?: number;
  showConfirmKey?: boolean;
  error?: string | null;
  disabled?: boolean;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;

/**
 * PinPad — 4 dot indicators (filled once a digit is entered) + a 3x4 numeric
 * keypad (1-9, delete, 0, confirm). Shared by PIN setup and (in a later pass)
 * the PIN confirm modal.
 */
export const PinPad: React.FC<PinPadProps> = ({
  value,
  onChange,
  onConfirm,
  length = 4,
  showConfirmKey = true,
  error,
  disabled = false,
}) => {
  const press = (key: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === 'ok') {
      onConfirm?.();
      return;
    }
    if (value.length >= length) return;
    onChange(value + key);
  };

  const keys = showConfirmKey ? KEYS : KEYS.filter((k) => k !== 'ok');

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="flex justify-center gap-3.5 mb-6">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <span
              key={i}
              className="w-[16px] h-[16px] rounded-full border-2 transition-colors"
              style={{
                background: filled ? 'var(--color-tint-dark)' : 'transparent',
                borderColor: filled ? 'var(--color-tint-dark)' : 'var(--color-border-strong)',
              }}
            />
          );
        })}
      </div>

      {error && <div className="text-center text-xs font-semibold text-error-val mb-4">{error}</div>}

      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => press(k)}
            className="h-14 w-full rounded-xl border border-border bg-card text-text-main font-money text-xl font-bold flex items-center justify-center cursor-pointer transition-all hover:border-tint hover:text-tint active:scale-[0.96] disabled:opacity-50"
          >
            {k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}
          </button>
        ))}
      </div>
    </div>
  );
};
