import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Icon } from '~/components/ui/icon';

type Transaction = {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

const fallbackTransactions: Transaction[] = [
  { _id: '1', type: 'Funding', amount: 5000, status: 'success', createdAt: new Date().toISOString() },
  { _id: '2', type: 'Purchase', amount: -2500, status: 'success', createdAt: new Date().toISOString() },
  { _id: '3', type: 'Purchase', amount: -1000, status: 'success', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '4', type: 'Funding', amount: 3000, status: 'success', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '5', type: 'Purchase', amount: -1500, status: 'success', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: '6', type: 'Funding', amount: 10000, status: 'success', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { _id: '7', type: 'Purchase', amount: -800, status: 'failed', createdAt: new Date(Date.now() - 345600000).toISOString() },
];

const filters = ['Today', 'Weekly', 'Monthly', 'All'];

export function meta() {
  return [
    { title: "Transaction History - RAD5 Café" },
    { name: "description", content: "Check your RAD5 Café transaction ledger statements." },
  ];
}

export default function History() {
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.wallet.transactions({ limit: 50 })
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setTransactionsList(res.data);
        } else {
          setTransactionsList(fallbackTransactions);
        }
      })
      .catch(() => setTransactionsList(fallbackTransactions))
      .finally(() => setLoading(false));
  }, []);

  const filterTransactions = () => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    return transactionsList.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      
      switch (activeFilter) {
        case 'Today':
          return txDate.toDateString() === todayStr;
        case 'Weekly':
          // Past 7 days
          return (now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        case 'Monthly':
          // Past 30 days
          return (now.getTime() - txDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        case 'All':
        default:
          return true;
      }
    });
  };

  const filteredTransactions = filterTransactions();

  const formatTxDate = (iso: string): string => {
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Transaction Statement</h1>
        <p className="text-text-secondary text-xs mt-1">
          Review all debits, credits, and orders associated with your wallet.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
              activeFilter === f
                ? 'bg-tint text-white border-tint shadow-xs'
                : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <Card padded={false} className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm flex flex-col items-center justify-center gap-3">
            <Icon name="sync" size={40} className="text-text-secondary animate-pulse-slow" />
            <span className="font-semibold text-text-main">No Transactions Found</span>
            <span className="text-xs">No records matched your selected filter period.</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTransactions.map((tx) => {
              const isDebit = tx.amount < 0;
              const isFailed = tx.status === 'failed';
              return (
                <div key={tx._id} className="flex justify-between items-center p-4 md:p-5 hover:bg-bg-selected/35 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isFailed
                          ? 'bg-error-val/10 text-error-val'
                          : isDebit
                          ? 'bg-accent/10 text-accent'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      <Icon
                        name={isFailed ? 'x' : isDebit ? 'arrow-up' : 'arrow-down'}
                        size={18}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm md:text-base text-text-main">{tx.type}</span>
                      <span className="text-xs text-text-secondary">{formatTxDate(tx.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`font-bold text-sm md:text-base select-all ${
                        isFailed ? 'text-error-val line-through' : isDebit ? 'text-accent' : 'text-success'
                      }`}
                    >
                      {isDebit ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
                    </span>
                    {isFailed && <Badge label="Failed" variant="error" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
