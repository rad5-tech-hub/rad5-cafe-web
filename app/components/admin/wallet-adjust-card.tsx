import React from 'react';
import { GlassPanel } from '../ui/glass-panel';
import { SheetField } from '../ui/action-sheet-modal';

type WalletAdjustCardProps = {
  userId: string;
  onUserIdChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  pin: string;
  onPinChange: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

/** WalletAdjustCard — manual admin wallet credit/debit form (userId + amount + reason + PIN). */
export const WalletAdjustCard: React.FC<WalletAdjustCardProps> = ({
  userId,
  onUserIdChange,
  amount,
  onAmountChange,
  description,
  onDescriptionChange,
  pin,
  onPinChange,
  loading,
  onSubmit,
}) => (
  <div className="flex flex-col gap-2.5">
    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">Manual wallet operation</span>
    <GlassPanel radius="lg">
      <form onSubmit={onSubmit} className="flex flex-col">
        <div className="grid grid-cols-2 gap-3">
          <SheetField label="Customer user ID" value={userId} onChange={onUserIdChange} placeholder="e.g. RAD500042" required />
          <SheetField label="Amount (₦)" value={amount} onChange={onAmountChange} type="number" mono placeholder="e.g. 5000 or -2000" required />
        </div>
        <SheetField label="Adjustment reason" value={description} onChange={onDescriptionChange} placeholder="Compensation refund for billing issue" />

        <div className="grid grid-cols-2 gap-3 items-end pt-3.5 mt-1 border-t border-border">
          <SheetField label="Transaction PIN" value={pin} onChange={(v) => onPinChange(v.replace(/\D/g, ''))} type="password" mono maxLength={4} placeholder="4-digit PIN" required />
          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-[11px] border-none bg-tint-dark text-white text-sm font-bold cursor-pointer hover:bg-tint disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adjusting…' : 'Perform adjustment'}
          </button>
        </div>
      </form>
    </GlassPanel>
  </div>
);
