import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { PillButton } from '~/components/ui/pill-button';
import { IconButton } from '~/components/ui/icon-button';
import { StatCard } from '~/components/ui/stat-card';
import { Money } from '~/components/ui/money';
import { Icon } from '~/components/ui/icon';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { PinConfirmModal } from '~/components/ui/pin-confirm-modal';
import { OrderDetailsModal, type OrderDetails } from '~/components/modals/order-details-modal';
import { useConfirm } from '~/context/confirm-context';
import { useToast } from '~/context/toast-context';
import { api, type Sale } from '~/lib/api';

function parseDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof val === 'number') return new Date(val).toISOString();
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
    if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
  }
  return new Date(val).toISOString();
}

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
] as const;

const statusTone: Record<string, string> = {
  completed: 'text-ok',
  cancelled: 'text-err',
  pending: 'text-warn',
};

function StatusChip({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-tint-a ${tone}`}>
      {label}
    </span>
  );
}

export function meta() {
  return [
    { title: "Sales Logs - RAD5 Café" },
    { name: "description", content: "Review total daily revenues, margins, and processed transaction counts." },
  ];
}

export default function Sales() {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const [aggregateRevenue, setAggregateRevenue] = useState(0);
  const [aggregateProfit, setAggregateProfit] = useState(0);
  const [aggregateOrders, setAggregateOrders] = useState(0);

  const [hideUnreconciled, setHideUnreconciled] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderDetails | null>(null);

  const fetchSalesData = (filterValue: string, pageNum: number, silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    api.adminDashboard.sales.list({ filter: filterValue, page: pageNum, limit })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setSalesList(res.data);
          setTotal(res.total ?? res.data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? res.data.length) / limit));
          setAggregateRevenue(res.totalRevenue ?? 0);
          setAggregateProfit(res.totalProfit ?? 0);
          setAggregateOrders(res.totalOrders ?? res.total ?? 0);
        } else if (!silent) {
          setSalesList([]);
        }
      })
      .catch((err) => {
        console.warn('Could not load live sales records:', err);
        if (!silent) setSalesList([]);
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    setPage(1);
    fetchSalesData(activeFilter, 1);
  }, [activeFilter]);

  useEffect(() => {
    if (page > 1) fetchSalesData(activeFilter, page);
  }, [page]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSalesData(activeFilter, page, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeFilter, page]);

  const handleConfirmCancel = async (pin: string) => {
    if (!cancellingSaleId) return;
    const saleToCancel = salesList.find(s => s.id === cancellingSaleId);
    if (saleToCancel?.issued) {
      showToast({ type: 'error', title: 'Issued orders cannot be cancelled.' });
      setCancellingSaleId(null);
      return;
    }
    if (saleToCancel?.reconciliationStatus === 'limbo') {
      showToast({ type: 'error', title: 'Unreconciled cash order', message: 'Manage it from Cash Orders instead of Sales.' });
      setCancellingSaleId(null);
      return;
    }

    setAdjusting(true);
    setCancelError(null);
    try {
      const res = await api.adminDashboard.sales.adjust(cancellingSaleId, { status: 'cancelled', pin });
      if (res.success) {
        showToast({ type: 'success', title: 'Order cancelled', message: 'Customer refunded successfully.' });
        setSalesList(prev => prev.map(s => s.id === cancellingSaleId ? { ...s, status: 'cancelled' } : s));
        setCancellingSaleId(null);
      } else {
        setCancelError(res.message || 'Failed to cancel order.');
      }
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel order.');
    } finally {
      setAdjusting(false);
    }
  };

  const handleIssue = async (sale: Sale) => {
    if (sale.reconciliationStatus === 'limbo') {
      showToast({ type: 'error', title: 'Unreconciled cash order', message: 'Manage it from Cash Orders instead of Sales.' });
      return;
    }
    const confirmed = await showConfirm({
      title: 'Issue this order?',
      message: 'This confirms the items have been handed over to the customer.',
      confirmLabel: 'Confirm issue',
    });
    if (!confirmed) return;

    setIssuing(true);
    try {
      const res = await api.adminDashboard.sales.issue(sale.id);
      if (res.success) {
        showToast({ type: 'success', title: 'Order issued' });
        if (res.data) {
          const updatedSale = res.data;
          setSalesList(prev => prev.map(s => s.id === sale.id ? { ...s, ...updatedSale } : s));
        } else {
          setSalesList(prev => prev.map(s => s.id === sale.id ? { ...s, issued: true, status: 'completed' } : s));
        }
      } else {
        showToast({ type: 'error', title: 'Failed to issue order', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to issue order', message: err.message });
    } finally {
      setIssuing(false);
    }
  };

  const visibleSalesList = hideUnreconciled
    ? salesList.filter((sale) => sale.reconciliationStatus !== 'limbo')
    : salesList;

  const columns: DataTableColumn<Sale>[] = [
    {
      key: 'receipt', header: 'Order', width: '1.4fr',
      render: (s) => (
        <div className="min-w-0">
          <div className="text-[13px] font-bold truncate">{s.receiptNumber}</div>
          <div className="text-[11px] text-text-secondary truncate">{s.customerName}</div>
        </div>
      ),
    },
    {
      key: 'items', header: 'Items', width: '2.4fr',
      render: (s) => {
        const items = s.items || [];
        const visibleItems = items.slice(0, 3);
        const hasMore = items.length > 3;
        return (
          <div className="flex flex-col gap-1 py-1">
            {visibleItems.length > 0 ? (
              visibleItems.map((i, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-bg-element/70 border border-border/80 px-2.5 py-1 rounded-lg text-xs font-medium text-text-main"
                >
                  <span className="truncate">{i.productName}</span>
                  <span className="font-extrabold text-[11px] text-tint bg-tint-a px-1.5 py-0.5 rounded-md whitespace-nowrap">
                    x{i.quantity}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-[12px] text-text-secondary">No items</span>
            )}
            {hasMore && (
              <button
                type="button"
                onClick={() => setSelectedOrderForModal(s)}
                className="text-[11.5px] font-bold text-tint hover:underline transition-colors mt-0.5 text-left cursor-pointer flex items-center gap-1"
              >
                <Icon name="eye" size={13} />
                +{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'date', header: 'Date', width: '1.1fr',
      render: (s) => <span className="text-[12px] text-text-secondary">{new Date(parseDate(s.date)).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>,
    },
    {
      key: 'revenue', header: 'Revenue', width: '1fr', align: 'right',
      render: (s) => (
        <div className="text-right">
          <Money amount={s.revenue} className="text-[13px] font-semibold block" />
          {s.status !== 'cancelled' && s.profit > 0 && <Money amount={s.profit} showSign className="text-[11px] text-ok" />}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', width: '1fr',
      render: (s) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusChip label={s.status} tone={statusTone[s.status] ?? 'text-tint'} />
          {s.reconciliationStatus === 'limbo' && <StatusChip label="Unreconciled cash" tone="text-warn" />}
          {s.issued && <span className="text-[10px] text-text-secondary">Issued{s.issuedBy ? ` · ${s.issuedBy}` : ''}</span>}
        </div>
      ),
    },
    {
      key: 'actions', header: '', width: '0.9fr', align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          {s.reconciliationStatus === 'limbo' ? (
            <Link to="/admin/cash-orders" className="text-[11px] font-bold text-tint hover:underline whitespace-nowrap">Cash Orders</Link>
          ) : (
            <>
              {s.status === 'completed' && !s.issued && (
                <IconButton icon="check" size={36} iconSize={14} title="Issue order" onClick={() => handleIssue(s)} disabled={issuing} />
              )}
              {s.status !== 'cancelled' && !s.issued && (
                <IconButton icon="x" size={36} iconSize={14} title="Cancel & refund" onClick={() => { setCancellingSaleId(s.id); setCancelError(null); }} />
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sales logs</h1>
          <p className="text-text-secondary text-xs mt-1">
            Review revenue, margins, and processed transaction counts.
          </p>
        </div>
        <button
          onClick={() => fetchSalesData(activeFilter, page, true)}
          disabled={loading || isRefreshing}
          className="w-10 h-10 rounded-xl glass-surface grid place-items-center cursor-pointer hover:border-tint hover:text-tint transition-colors disabled:opacity-50"
          title="Refresh sales"
        >
          <Icon name="sync" size={16} className={(loading || isRefreshing) ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Revenue" value={<Money amount={aggregateRevenue} />} valueColor="var(--color-ok)" />
        <StatCard label="Profit" value={<Money amount={aggregateProfit} />} valueColor="var(--color-ok)" />
        <StatCard label="Orders" value={aggregateOrders} />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <PillButton key={f.value} active={activeFilter === f.value} onClick={() => setActiveFilter(f.value)}>{f.label}</PillButton>
          ))}
        </div>
        <PillButton active={hideUnreconciled} onClick={() => setHideUnreconciled((v) => !v)}>
          Hide unreconciled cash orders
        </PillButton>
      </div>

      <DataTable
        columns={columns}
        rows={visibleSalesList}
        keyExtractor={(s) => s.id}
        loading={loading}
        emptyMessage="No sales logs found."
        minWidth={860}
      />

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-text-secondary">{total} total results</span>
          <div className="flex items-center gap-3">
            <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</PillButton>
            <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
            <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PillButton>
          </div>
        </div>
      )}

      <PinConfirmModal
        isOpen={!!cancellingSaleId}
        onClose={() => { setCancellingSaleId(null); setCancelError(null); }}
        onConfirm={handleConfirmCancel}
        title="Cancel order & refund"
        loading={adjusting}
        error={cancelError}
      />

      <OrderDetailsModal
        isOpen={!!selectedOrderForModal}
        onClose={() => setSelectedOrderForModal(null)}
        order={selectedOrderForModal}
      />
    </div>
  );
}
