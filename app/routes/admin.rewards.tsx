import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { PillButton } from '~/components/ui/pill-button';
import { Money } from '~/components/ui/money';
import { Icon } from '~/components/ui/icon';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';

type RewardTransaction = {
  id: string;
  amount: number;
  description: string;
  userId: string;
  createdAt: any;
};

export function meta() {
  return [
    { title: "Rewards Given - Admin Panel" },
    { name: "description", content: "Review all rewards distributed to users." },
  ];
}

export default function AdminRewards() {
  const [rewardsList, setRewardsList] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

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

  const fetchRewards = (pageNum: number) => {
    setLoading(true);
    api.admin.rewards(pageNum, limit)
      .then((res: any) => {
        if (res.success && Array.isArray(res.rewards)) {
          const normalized = res.rewards.map((tx: any) => ({
            ...tx,
            id: tx.id ?? tx._id,
            createdAt: parseDate(tx.createdAt),
          }));
          setRewardsList(normalized);
          const total = res.total ?? normalized.length;
          setTotalPages(res.totalPages ?? Math.ceil(total / limit));
        } else {
          setRewardsList([]);
        }
      })
      .catch(() => setRewardsList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRewards(page);
  }, [page]);

  const columns: DataTableColumn<RewardTransaction>[] = [
    {
      key: 'when',
      header: 'Date & time',
      width: '1.2fr',
      render: (tx) => {
        const d = new Date(tx.createdAt);
        return (
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 flex-shrink-0 rounded-full grid place-items-center bg-tint-a text-tint">
              <Icon name="star-circle" size={15} />
            </span>
            <div>
              <div className="text-[13px] font-semibold">{d.toLocaleDateString()}</div>
              <div className="text-[11px] text-text-secondary">{d.toLocaleTimeString()}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'user',
      header: 'User ID',
      render: (tx) => <span className="font-money text-xs text-text-secondary truncate block">{tx.userId}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      width: '1.6fr',
      render: (tx) => <span className="text-[13.5px] font-medium truncate block">{tx.description}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (tx) => <Money amount={tx.amount} showSign className="text-sm font-bold text-ok" />,
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Rewards given</h1>
        <p className="text-text-secondary text-xs mt-1">Audit log of all referral and cashback rewards issued to customers.</p>
      </div>

      <DataTable
        columns={columns}
        rows={rewardsList}
        keyExtractor={(tx) => tx.id}
        loading={loading}
        emptyMessage="No rewards found."
        minWidth={620}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>Next</PillButton>
        </div>
      )}
    </div>
  );
}
