import React from 'react';
import { GlassPanel } from '../ui/glass-panel';

type PinChangeCardProps = {
  pinSetup: boolean;
  requestStatus?: 'PENDING' | 'REJECTED' | null;
  rejectReason?: string | null;
  onRequest: () => void;
};

/** PinChangeCard — transaction-PIN status + "request change" action, mirrors the spec's PIN card copy. */
export const PinChangeCard: React.FC<PinChangeCardProps> = ({ pinSetup, requestStatus, rejectReason, onRequest }) => {
  return (
    <GlassPanel radius="lg" className="p-5.5">
      <div className="text-sm font-bold">Transaction PIN</div>
      <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">
        {pinSetup
          ? 'Changing your PIN needs an admin approval. Requests are reviewed the same day.'
          : 'Create a 4-digit PIN to authorize wallet transactions.'}
      </p>

      {requestStatus === 'PENDING' && (
        <div className="mt-3 inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'rgba(245,158,11,0.16)', color: 'var(--color-warn)' }}>
          Awaiting admin approval
        </div>
      )}
      {requestStatus === 'REJECTED' && (
        <div className="mt-3 flex flex-col gap-1 items-start">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--color-err)' }}>
            PIN request rejected
          </span>
          {rejectReason && <span className="text-[11px] font-semibold text-error-val">Reason: {rejectReason}</span>}
        </div>
      )}

      <button
        onClick={onRequest}
        className="mt-4 px-4 py-2.5 rounded-[11px] border border-border bg-card text-[13.5px] font-semibold cursor-pointer hover:border-tint hover:text-tint transition-colors"
      >
        {pinSetup ? 'Request PIN change' : 'Set up transaction PIN'}
      </button>
    </GlassPanel>
  );
};
