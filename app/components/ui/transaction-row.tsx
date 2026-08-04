import React from 'react';
import { Money } from './money';

export type TxKind = 'funding' | 'purchase' | 'transfer' | 'reward' | string;
export type TxStatus = 'completed' | 'pending' | 'refunded' | 'failed' | 'issue' | string;

type TxMeta = { tag: string; color: string; tintBg: string };
type StatusMeta = { bg: string; color: string };

/** Two-letter tag + color for a transaction kind (Funding/Purchase/Transfer/Reward). */
export function getTxMeta(kind: TxKind): TxMeta {
  const key = (kind || '').toLowerCase();
  const map: Record<string, TxMeta> = {
    funding: { tag: 'FD', color: '#10B981', tintBg: 'rgba(16,185,129,0.12)' },
    purchase: { tag: 'PY', color: 'var(--color-tint)', tintBg: 'var(--tint-b)' },
    transfer: { tag: 'TR', color: '#F59E0B', tintBg: 'rgba(245,158,11,0.14)' },
    reward: { tag: 'RW', color: '#3B82F6', tintBg: 'rgba(59,130,246,0.14)' },
  };
  return map[key] || { tag: 'TX', color: 'var(--color-text-secondary)', tintBg: 'rgba(107,114,128,0.12)' };
}

/** Descriptive row label: item list, then description, then capitalized type. */
export function getTxLabel(tx: {
  type: string;
  amount?: number;
  description?: string;
  metadata?: { items?: { productName: string; quantity: number }[] };
}): string {
  if (tx.type === 'reward' && (tx.amount ?? 0) < 0) return 'Reward reversal';
  const items = tx.metadata?.items;
  if (items?.length) {
    return items.map((item) => `${item.quantity}x ${item.productName}`).join(', ');
  }
  if (tx.description) return tx.description;
  return tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : tx.type;
}

/** Status pill background/foreground for a transaction status. */
export function getStatusMeta(status: TxStatus): StatusMeta {
  const key = (status || '').toLowerCase();
  const map: Record<string, StatusMeta> = {
    completed: { bg: 'rgba(16,185,129,0.14)', color: 'var(--color-ok)' },
    pending: { bg: 'rgba(245,158,11,0.16)', color: 'var(--color-warn)' },
    refunded: { bg: 'rgba(239,68,68,0.12)', color: 'var(--color-err)' },
    failed: { bg: 'rgba(239,68,68,0.12)', color: 'var(--color-err)' },
    issue: { bg: 'rgba(245,158,11,0.16)', color: 'var(--color-warn)' },
  };
  return map[key] || { bg: 'rgba(107,114,128,0.14)', color: 'var(--color-text-tertiary)' };
}

type TransactionRowProps = {
  kind: TxKind;
  label: string;
  when: string;
  amount: number;
  status?: TxStatus;
  ref?: string;
  className?: string;
};

/**
 * TransactionRow — colored 2-letter tag chip + label/timestamp + status pill +
 * right-aligned mono amount (green add, tint/red subtract). Used in the
 * dashboard recent-activity list and the transaction history table.
 */
export const TransactionRow: React.FC<TransactionRowProps> = ({ kind, label, when, amount, status, ref, className = '' }) => {
  const meta = getTxMeta(kind);
  const statusMeta = status ? getStatusMeta(status) : null;
  const isCredit = amount > 0;

  return (
    <div className={`flex items-center gap-3.5 px-5 py-[15px] border-b border-border last:border-b-0 hover:bg-tint-a transition-colors ${className}`}>
      <span
        className="w-[34px] h-[34px] flex-shrink-0 rounded-[10px] grid place-items-center font-money text-xs font-semibold"
        style={{ background: meta.tintBg, color: meta.color }}
      >
        {meta.tag}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{label}</div>
        <div className="text-xs text-text-secondary truncate">
          {when}
          {ref ? ` · ${ref}` : ''}
        </div>
      </div>
      {statusMeta && (
        <span
          className="px-2.5 py-[3px] rounded-full text-[11.5px] font-bold whitespace-nowrap hidden sm:inline-block"
          style={{ background: statusMeta.bg, color: statusMeta.color }}
        >
          {status}
        </span>
      )}
      <div className="w-[100px] sm:w-[116px] text-right" style={{ color: isCredit ? meta.color : 'var(--color-text-main)' }}>
        <Money amount={amount} showSign className="text-[14.5px] font-semibold" />
      </div>
    </div>
  );
};
