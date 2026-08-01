import React from 'react';
import { Icon } from '~/components/ui/icon';
import { TransactionRow } from '~/components/ui/transaction-row';

export type RecentTxn = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

type RecentActivityProps = {
  transactions: RecentTxn[];
  loading: boolean;
  formatWhen: (iso: string) => string;
};

/** RecentActivity — glass ledger list of the most recent wallet transactions. */
export const RecentActivity: React.FC<RecentActivityProps> = ({ transactions, loading, formatWhen }) => {
  return (
    <div className="glass-surface rounded-2xl overflow-hidden">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Icon name="sync" size={22} className="animate-spin text-tint" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-text-secondary text-sm">No transactions recorded yet.</div>
      ) : (
        transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            kind={tx.type}
            label={tx.type === 'reward' && tx.amount < 0 ? 'Reward reversal' : capitalize(tx.type)}
            when={formatWhen(tx.createdAt)}
            amount={tx.amount}
            status={tx.status}
          />
        ))
      )}
    </div>
  );
};

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
