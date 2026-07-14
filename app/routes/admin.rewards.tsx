import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';

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
  const [total, setTotal] = useState(0);
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
          setTotal(res.total ?? normalized.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? normalized.length) / limit));
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Rewards Given</h1>
          <p className="text-sm font-medium text-text-secondary">
            Audit log of all referral and cashback rewards.
          </p>
        </div>
      </div>

      <Card className="flex flex-col overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-bg-main/40">
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Date & Time</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">User ID</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Description</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && rewardsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-secondary">
                    <Icon name="loading" size={24} className="animate-spin mx-auto mb-2 text-tint" />
                    Loading rewards...
                  </td>
                </tr>
              ) : rewardsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center flex flex-col items-center justify-center gap-2">
                    <Icon name="star-outline" size={48} className="text-text-secondary opacity-50" />
                    <span className="text-text-secondary font-medium mt-2">No rewards found.</span>
                  </td>
                </tr>
              ) : (
                rewardsList.map((tx) => {
                  const txDate = new Date(tx.createdAt);
                  return (
                    <tr key={tx.id} className="hover:bg-bg-selected/20 transition-colors group">
                      <td className="p-4 text-sm font-medium text-text-main whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
                            <Icon name="star-circle" size={16} className="text-success" />
                          </div>
                          <div>
                            <div>{txDate.toLocaleDateString()}</div>
                            <div className="text-xs text-text-secondary">{txDate.toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono text-text-secondary">
                        {tx.userId}
                      </td>
                      <td className="p-4 text-sm font-medium text-text-main">
                        {tx.description}
                      </td>
                      <td className="p-4 text-sm font-extrabold text-success text-right whitespace-nowrap tabular-nums">
                        +₦{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-bg-main/30">
            <span className="text-sm font-medium text-text-secondary">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
