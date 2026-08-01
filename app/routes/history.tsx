import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { Button } from '~/components/ui/button';
import { PillButton } from '~/components/ui/pill-button';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { getTxMeta, getStatusMeta } from '~/components/ui/transaction-row';

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
          const total = res.total ?? normalized.length;
          setTotalPages(res.totalPages ?? Math.ceil(total / limit));
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
          return (now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        case 'Monthly':
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

  const columns: DataTableColumn<Transaction>[] = [
    {
      key: 'transaction',
      header: 'Transaction',
      width: '1.6fr',
      render: (tx) => {
        const meta = getTxMeta(tx.type);
        return (
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-[30px] h-[30px] flex-shrink-0 rounded-[9px] grid place-items-center font-money text-[11px] font-semibold"
              style={{ background: meta.tintBg, color: meta.color }}
            >
              {meta.tag}
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold capitalize truncate">
                {tx.type === 'reward' && tx.amount < 0 ? 'Reward reversal' : tx.type}
              </div>
              <div className="text-[11.5px] text-text-secondary">{formatTxDate(tx.createdAt)}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference',
      width: '0.9fr',
      render: (tx) => <span className="font-money text-xs text-text-secondary">#{tx._id.slice(-8).toUpperCase()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '0.8fr',
      render: (tx) => {
        const s = getStatusMeta(tx.status);
        return (
          <span className="px-2.5 py-[3px] rounded-full text-[11.5px] font-bold whitespace-nowrap" style={{ background: s.bg, color: s.color }}>
            {tx.status}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '0.7fr',
      align: 'right',
      render: (tx) => (
        <Money
          amount={tx.amount}
          showSign
          className="text-sm font-semibold"
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Transaction history</h1>
        <p className="text-text-secondary text-xs mt-1">
          Review all debits, credits, and orders associated with your wallet.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <PillButton key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
            {f}
          </PillButton>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filteredTransactions}
        keyExtractor={(tx) => tx._id}
        loading={loading}
        emptyMessage="No records matched your selected filter period."
        minWidth={620}
      />

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
