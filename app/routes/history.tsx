import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';

type Transaction = {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return new Date(val).toISOString();
    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') return val.toDate().toISOString();
      if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
      if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
    }
    return new Date(val).toISOString();
  };

  const fetchTransactions = (pageNum: number) => {
    setLoading(true);
    api.wallet.transactions({ page: pageNum, limit })
      .then((res: any) => {
        const rawList = res.transactions || res.data;
        if (res.success && Array.isArray(rawList)) {
          const normalized = rawList.map((tx: any) => ({
            ...tx,
            _id: tx.id ?? tx._id,
            createdAt: parseDate(tx.createdAt),
          }));
          setTransactionsList(normalized);
          setTotal(res.total ?? normalized.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? normalized.length) / limit));
        } else {
          setTransactionsList([]);
        }
      })
      .catch(() => setTransactionsList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchTransactions(1);
  }, []);

  useEffect(() => {
    if (page > 1) fetchTransactions(page);
  }, [page]);

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs font-bold cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs font-bold text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs font-bold cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
