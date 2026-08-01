import React, { useState, useEffect } from 'react';
import { PillButton } from '~/components/ui/pill-button';
import { StatCard } from '~/components/ui/stat-card';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { WriteOffModal } from '~/components/modals/write-off-modal';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';

export function meta() {
  return [
    { title: "Stock Balance Out - RAD5 Café" },
    { name: "description", content: "Balance out remaining stock value against total profit." },
  ];
}

interface StockLedgerRow {
  id: string;
  name: string;
  quantity: number;
  costPrice: number;
  remainingValue: number;
}

interface StockSummary {
  products: StockLedgerRow[];
  totalQuantity: number;
  totalValue: number;
  totalBalancedOut: number;
  netStockValue: number;
  totalProfit: number;
  netProfit: number;
}

interface BalanceOutRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  amount: number;
  note: string;
  remainingQuantity: number;
  createdBy: string;
  createdAt: string;
}

export default function StockBalance() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [records, setRecords] = useState<BalanceOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchSummary = () => {
    setSummaryLoading(true);
    setSummaryError(null);
    api.adminDashboard.stockBalance.getSummary()
      .then((res: any) => {
        if (res.success && res.data) {
          setSummary(res.data);
        } else {
          setSummaryError(res.message || 'Could not load stock summary.');
        }
      })
      .catch((err: any) => {
        setSummaryError(err.message || 'Could not reach the server to load stock summary.');
      })
      .finally(() => setSummaryLoading(false));
  };

  const fetchRecords = (pageNum: number) => {
    setLoading(true);
    api.adminDashboard.stockBalance.list({ page: pageNum, limit })
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setRecords(res.data);
          const total = res.total ?? res.data.length;
          setTotalPages(res.totalPages ?? Math.ceil(total / limit));
        } else {
          setRecords([]);
        }
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  const handleConfirm = async (productId: string, quantity: number, note: string, pin: string) => {
    setSubmitting(true);
    try {
      const res = await api.adminDashboard.stockBalance.create({ productId, quantity, note, pin });

      if (res.success) {
        showToast({ type: 'success', title: 'Stock balanced out', message: 'The amount has been deducted from total profit and recorded as a loss.' });
        setShowModal(false);
        fetchSummary();
        fetchRecords(1);
        setPage(1);
      } else {
        showToast({ type: 'error', title: 'Failed to balance out stock', message: res.message || 'Error occurred.' });
      }
    } catch (error: any) {
      showToast({ type: 'error', title: 'Error', message: error.message || 'Failed to balance out stock.' });
    } finally {
      setSubmitting(false);
    }
  };

  const products = summary?.products ?? [];

  const statCards = [
    { label: 'Total profit', value: summary?.totalProfit ?? 0, sub: 'lifetime, before write-offs', color: undefined },
    { label: 'Stock value', value: summary?.totalValue ?? 0, sub: `${summary?.totalQuantity ?? 0} units on hand`, color: undefined },
    { label: 'Written off', value: summary?.totalBalancedOut ?? 0, sub: `${records.length} recorded losses`, color: '#EF4444' },
    { label: 'Net profit', value: summary?.netProfit ?? 0, sub: 'after write-offs', color: '#10B981' },
  ];

  const ledgerColumns: DataTableColumn<StockLedgerRow>[] = [
    { key: 'name', header: 'Product', width: '1.6fr', render: (r) => <span className="text-[13.5px] font-semibold">{r.name}</span> },
    { key: 'qty', header: 'Qty', render: (r) => <Money amount={r.quantity} className="text-[13px]" /> },
    { key: 'unit', header: 'Unit cost', render: (r) => <Money amount={r.costPrice} className="text-[13px] text-text-secondary" /> },
    {
      key: 'value',
      header: 'Stock value',
      align: 'right',
      render: (r) => <Money amount={r.remainingValue} className="text-[13px] font-semibold" />,
    },
  ];

  const ledgerFooter = summary ? (
    <div
      className="grid gap-3 px-5 py-3.5 bg-tint-a font-bold"
      style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1fr', minWidth: 620 }}
    >
      <span className="text-[13px]">Totals</span>
      <Money amount={summary.totalQuantity} className="text-[13px]" />
      <span />
      <Money amount={summary.totalValue} className="text-[13px] text-right" />
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Stock balance out</h1>
          <p className="text-text-secondary text-xs mt-1">
            Write off remaining stock value against total profit, recording it as a loss.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl border-none bg-error-val text-white text-[13.5px] font-bold cursor-pointer hover:brightness-110 transition-all whitespace-nowrap"
        >
          Balance out stock
        </button>
      </div>

      {summaryError && (
        <div className="glass-surface rounded-2xl p-4 border border-error-val/30">
          <p className="text-sm font-medium text-error-val">Couldn't load the stock/profit summary: {summaryError}</p>
          <PillButton className="mt-2" onClick={fetchSummary}>Retry</PillButton>
        </div>
      )}

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {statCards.map((s) => (
          <StatCard key={s.label} label={s.label} value={summaryLoading ? '—' : <Money amount={s.value} />} sub={s.sub} valueColor={s.color} />
        ))}
      </div>

      <div>
        <h2 className="text-[17px] font-bold tracking-tight mb-3">Stock ledger</h2>
        <DataTable
          columns={ledgerColumns}
          rows={products}
          keyExtractor={(r) => r.id}
          loading={summaryLoading}
          emptyMessage={summaryError ? 'Unable to load stock ledger.' : 'No active products in stock.'}
          minWidth={620}
          footer={ledgerFooter}
        />
      </div>

      <div>
        <h2 className="text-[17px] font-bold tracking-tight mb-3">Write-off history</h2>
        {loading ? (
          <div className="glass-surface rounded-2xl py-14 text-center text-text-secondary text-sm">Loading history...</div>
        ) : records.length === 0 ? (
          <div className="glass-surface rounded-2xl py-14 text-center text-text-secondary text-sm">No stock balance-out records found.</div>
        ) : (
          <div className="grid gap-2.5">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-[15px] border"
                style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.22)' }}
              >
                <span className="w-[9px] h-[9px] flex-shrink-0 rounded-full bg-error-val" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{rec.note || rec.productName || 'Stock write-off'}</div>
                  <div className="text-[11.5px] text-text-secondary">
                    {new Date(rec.createdAt).toLocaleString()} · {rec.productName} · by {rec.createdBy || 'admin'}
                  </div>
                </div>
                <Money amount={-Math.abs(rec.amount || 0)} showSign className="text-sm font-semibold text-error-val flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PillButton>
        </div>
      )}

      <WriteOffModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        products={products}
        totalProfit={summary?.netProfit ?? 0}
        submitting={submitting}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
