import React, { useEffect, useState, useCallback } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { Icon } from '~/components/ui/icon';
import { IconButton } from '~/components/ui/icon-button';
import { PillButton } from '~/components/ui/pill-button';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import type { ReconciledOrder } from './types';

export function ReconciledHistoryList({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<ReconciledOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchData = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await api.adminDashboard.orders.reconciled(currentPage, limit);
      if (res.success && res.orders) {
        setOrders(res.orders);
        setTotalPages(res.totalPages || 1);
      } else {
        setOrders([]);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Failed to load reconciled history' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const columns: DataTableColumn<ReconciledOrder>[] = [
    { key: 'receipt', header: 'Receipt', render: (o) => <span className="text-[13px] font-bold">{o.receiptNumber}</span> },
    { key: 'walkIn', header: 'Walk-in name', render: (o) => <span className="text-[12.5px] text-text-secondary">{o.customerAccountName || 'Walk-in customer'}</span> },
    { key: 'reconciledTo', header: 'Reconciled to', render: (o) => o.userId ? <span className="text-[12.5px] font-semibold text-tint">{o.userId}</span> : <span className="text-[12.5px] text-text-secondary">N/A</span> },
    { key: 'reconciledBy', header: 'Reconciled by', render: (o) => <span className="text-[12.5px] text-text-secondary">{o.reconciledByName || o.reconciledBy || 'System'}</span> },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <Money amount={o.total ?? 0} className="text-[13px] font-bold text-tint" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Reconciled history</h1>
          <p className="text-text-secondary text-xs mt-1">View cash orders that have been reconciled.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors flex items-center gap-1.5">
            <Icon name="chevron-left" size={14} />
            Back to limbo orders
          </button>
          <IconButton icon="sync" title="Refresh" onClick={() => fetchData(page)} disabled={loading} iconSize={15} className={loading ? '[&_svg]:animate-spin' : ''} />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        keyExtractor={(o) => o.id}
        loading={loading && orders.length === 0}
        emptyMessage="No reconciled orders found."
        minWidth={700}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <PillButton disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>Next</PillButton>
        </div>
      )}
    </div>
  );
}
