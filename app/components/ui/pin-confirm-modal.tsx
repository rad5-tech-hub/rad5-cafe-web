import React, { useEffect, useState } from 'react';
import { GlassSheet } from './glass-panel';
import { PinPad } from './pin-pad';
import { Money } from './money';

type PinConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void | Promise<void>;
  title: string;
  amount?: number;
  loading?: boolean;
  error?: string | null;
};

/**
 * PinConfirmModal — the shared "confirm with PIN" overlay (dots + numeric
 * keypad, built on the existing PinPad primitive). Used as the second step
 * after transfer/restock/write-off sheets are submitted, and by checkout.
 */
export const PinConfirmModal: React.FC<PinConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  amount,
  loading = false,
  error,
}) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isOpen) setPin('');
  }, [isOpen]);

  if (!isOpen) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const handleConfirm = () => {
    if (pin.length === 4 && !loading) onConfirm(pin);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] grid place-items-center p-5"
      style={{ background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(6px)' }}
    >
      <GlassSheet onClick={stop} className="w-full text-center animate-rad5-pop" style={{ maxWidth: 360 }}>
        <div className="text-[11.5px] font-bold tracking-[0.08em] text-text-secondary">CONFIRM WITH PIN</div>
        <h2 className="mt-2.5 text-xl font-extrabold tracking-tight">{title}</h2>
        {amount != null && <Money amount={amount} className="block mt-1.5 text-2xl font-semibold tracking-tight" />}

        <div className="mt-5">
          <PinPad value={pin} onChange={setPin} onConfirm={handleConfirm} error={error} disabled={loading} />
        </div>

        <div className="flex gap-2.5 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border bg-card text-sm font-semibold cursor-pointer hover:border-tint hover:text-tint transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pin.length !== 4 || loading}
            className="flex-[1.4] py-3 rounded-xl bg-tint-dark text-white text-sm font-bold cursor-pointer hover:bg-tint disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Confirming…' : 'Confirm'}
          </button>
        </div>
      </GlassSheet>
    </div>
  );
};
