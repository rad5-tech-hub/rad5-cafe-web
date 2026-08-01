import React from 'react';
import { GlassSheet } from './glass-panel';
import { Icon } from './icon';
import { formatMoney } from './money';

export type SheetSubmitVariant = 'tint' | 'danger';

type ActionSheetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  submitVariant?: SheetSubmitVariant;
  submitDisabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  note?: React.ReactNode;
  error?: string | null;
  maxWidth?: number;
  children: React.ReactNode;
};

/**
 * ActionSheetModal — the ONE generic centered glass sheet used for every
 * config-driven form overlay (fund wallet, transfer, restock, stock write-off,
 * ...). Callers supply title/subtitle/copy + their own field markup as
 * children (see SheetField/SheetPresets below) and keep their own submit
 * logic/API calls — this component only owns the shell, backdrop, note,
 * error and cancel/submit footer chrome so every sheet looks identical.
 */
export const ActionSheetModal: React.FC<ActionSheetModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  submitLabel,
  submitVariant = 'tint',
  submitDisabled = false,
  loading = false,
  loadingLabel,
  note,
  error,
  maxWidth = 420,
  children,
}) => {
  if (!isOpen) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center p-5"
      style={{ background: 'rgba(17,24,39,0.38)', backdropFilter: 'blur(5px)' }}
    >
      <GlassSheet onClick={stop} className="w-full animate-rad5-pop max-h-[90vh] overflow-y-auto" style={{ maxWidth }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 rounded-lg grid place-items-center border border-border bg-card text-text-secondary hover:text-text-main hover:border-tint transition-colors cursor-pointer"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col mt-5">
          {children}

          {error && <div className="mt-3.5 text-xs font-semibold text-error-val">{error}</div>}

          {note && (
            <div className="mt-4 px-3.5 py-3 rounded-[13px] bg-tint-a text-[12.5px] leading-relaxed text-tint-dark">
              {note}
            </div>
          )}

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border bg-card text-sm font-semibold cursor-pointer hover:border-tint hover:text-tint transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled || loading}
              className={`flex-[1.5] py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                submitVariant === 'danger' ? 'bg-error-val hover:brightness-110' : 'bg-tint-dark hover:bg-tint'
              }`}
            >
              {loading ? loadingLabel || 'Please wait…' : submitLabel}
            </button>
          </div>
        </form>
      </GlassSheet>
    </div>
  );
};

type SheetFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

/** SheetField — labeled text input styled to match every sheet field (recipient/reason/amount/etc). */
export const SheetField: React.FC<SheetFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  mono = false,
  autoFocus,
  required,
  disabled,
  maxLength,
  inputMode,
}) => (
  <div className="mt-3.5 first:mt-0">
    <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      inputMode={inputMode}
      className={`w-full px-3.5 py-3 rounded-[11px] border border-border bg-card text-[15px] text-text-main outline-none transition-all focus:border-tint focus:shadow-[0_0_0_3px_var(--tint-b)] disabled:opacity-50 ${
        mono ? 'font-money font-semibold' : ''
      }`}
    />
  </div>
);

/** SheetPresets — quick-pick amount chips (fund/transfer). */
export const SheetPresets: React.FC<{ values: number[]; active?: number; onPick: (v: number) => void }> = ({
  values,
  active,
  onPick,
}) => (
  <div className="flex flex-wrap gap-2 mt-3">
    {values.map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => onPick(v)}
        className={`px-3.5 py-2 rounded-full border font-money text-xs font-semibold cursor-pointer transition-colors ${
          active === v ? 'border-tint text-tint bg-tint-a' : 'border-border bg-card hover:border-tint hover:text-tint'
        }`}
      >
        {formatMoney(v)}
      </button>
    ))}
  </div>
);

/** SheetTabs — the add/remove-style mode toggle used inside the restock sheet. */
export const SheetTabs: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex gap-1 p-1 rounded-xl bg-tint-a mb-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
          value === opt.value ? 'bg-card shadow-sm text-text-main' : 'text-text-secondary hover:text-text-main'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
