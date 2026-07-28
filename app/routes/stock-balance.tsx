import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
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
  amount: number;
  note: string;
  stockQuantitySnapshot: number;
  stockValueSnapshot: number;
  createdBy: string;
  createdAt: string;
}

function ConfirmBalanceOutModal({
  amount,
  note,
  summary,
  submitting,
  onCancel,
  onConfirm,
}: {
  amount: number;
  note: string;
  summary: StockSummary | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
}) {
  const [pin, setPin] = useState('');
  const resultingProfit = (summary?.netProfit ?? 0) - amount;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-card border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1.5 w-full bg-error-val" />
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-brand-900 dark:text-brand-100">Confirm Stock Balance Out</h3>
            <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
              This will permanently deduct the amount below from total profit and record it as a loss.
            </p>
          </div>

          <div className="rounded-lg border border-brand-200 dark:border-brand-800 divide-y divide-brand-100 dark:divide-brand-800/50 text-sm">
            <div className="flex justify-between px-4 py-3">
              <span className="text-brand-500 dark:text-brand-400">Amount to balance out</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-brand-500 dark:text-brand-400">Current total profit</span>
              <span className="font-semibold">₦{(summary?.totalProfit ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-brand-500 dark:text-brand-400">Net profit after this action</span>
              <span className="font-semibold">₦{resultingProfit.toLocaleString()}</span>
            </div>
            {note && (
              <div className="flex justify-between px-4 py-3 gap-4">
                <span className="text-brand-500 dark:text-brand-400 shrink-0">Note</span>
                <span className="font-medium text-right">{note}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Admin PIN</label>
            <Input
              type="password"
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={pin.length !== 4 || submitting}
              onClick={() => onConfirm(pin)}
            >
              {submitting ? 'Balancing Out...' : 'Confirm & Balance Out'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockBalance() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [records, setRecords] = useState<BalanceOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({ amount: '', note: '' });

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
    setHistoryError(null);
    api.adminDashboard.stockBalance.list({ page: pageNum, limit })
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setRecords(res.data);
          setTotal(res.total ?? res.data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? res.data.length) / limit));
        } else {
          setRecords([]);
          setHistoryError(res.message || 'Could not load balance-out history.');
        }
      })
      .catch((err: any) => {
        setRecords([]);
        setHistoryError(err.message || 'Could not reach the server to load history.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  const onReviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(formData.amount);
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
      showToast({ type: 'error', title: 'Invalid amount', message: 'Enter a positive amount to balance out.' });
      return;
    }
    if (summary && amountNum > summary.totalValue) {
      showToast({ type: 'error', title: 'Amount too high', message: `Cannot exceed remaining stock value of ₦${summary.totalValue.toLocaleString()}.` });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async (pin: string) => {
    setSubmitting(true);
    try {
      const res = await api.adminDashboard.stockBalance.create({
        amount: Number(formData.amount),
        note: formData.note,
        pin,
      });

      if (res.success) {
        showToast({ type: 'success', title: 'Stock Balanced Out', message: 'The amount has been deducted from total profit and recorded as a loss.' });
        setShowConfirm(false);
        setShowForm(false);
        setFormData({ amount: '', note: '' });
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 dark:text-brand-100">
            Stock Balance Out
          </h1>
          <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
            Write off remaining stock value against total profit, recording it as a loss.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'}>
          {showForm ? 'Cancel' : 'Balance Out Stock'}
        </Button>
      </div>

      {summaryError && (
        <Card className="p-4 border-error-val bg-error-val/10">
          <p className="text-sm font-medium text-error-val">
            Couldn't load the stock/profit summary: {summaryError}
          </p>
          <Button variant="outline" className="mt-2" onClick={fetchSummary}>Retry</Button>
        </Card>
      )}

      {/* Financial summary: total profit vs what's been balanced out */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase font-medium text-brand-500 dark:text-brand-400">Total Profit</p>
          <p className="text-xl font-bold text-brand-900 dark:text-brand-100 mt-1">
            {summaryLoading ? '—' : `₦${(summary?.totalProfit ?? 0).toLocaleString()}`}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase font-medium text-brand-500 dark:text-brand-400">Total Balanced Out (Loss)</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
            {summaryLoading ? '—' : `₦${(summary?.totalBalancedOut ?? 0).toLocaleString()}`}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase font-medium text-brand-500 dark:text-brand-400">Net Profit</p>
          <p className="text-xl font-bold text-brand-900 dark:text-brand-100 mt-1">
            {summaryLoading ? '—' : `₦${(summary?.netProfit ?? 0).toLocaleString()}`}
          </p>
        </Card>
      </div>

      {/* Stock ledger: every remaining item, its quantity and value, with totals */}
      <Card className="overflow-hidden">
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-100">Remaining Stock Ledger</h3>
          <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
            Every active product's remaining quantity and value, as it stands right now.
          </p>
        </div>
        {summaryLoading ? (
          <div className="p-12 text-center text-brand-500">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading stock ledger...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-brand-500">
            <p>{summaryError ? 'Unable to load stock ledger.' : 'No active products in stock.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-brand-500 uppercase bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium text-right">Quantity</th>
                  <th className="px-6 py-4 font-medium text-right">Cost Price</th>
                  <th className="px-6 py-4 font-medium text-right">Remaining Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 dark:divide-brand-800/50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors">
                    <td className="px-6 py-4">{p.name}</td>
                    <td className="px-6 py-4 text-right">{p.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-brand-600 dark:text-brand-400">₦{p.costPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium">₦{p.remainingValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-brand-50 dark:bg-brand-900/20 border-t-2 border-brand-200 dark:border-brand-800 font-semibold">
                <tr>
                  <td className="px-6 py-4">Total</td>
                  <td className="px-6 py-4 text-right">{(summary?.totalQuantity ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">—</td>
                  <td className="px-6 py-4 text-right">₦{(summary?.totalValue ?? 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Card className="p-6 bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800">
          <h3 className="text-lg font-semibold mb-2">Balance Out Stock</h3>
          <p className="text-sm text-brand-500 dark:text-brand-400 mb-4">
            Remaining stock value: ₦{(summary?.totalValue ?? 0).toLocaleString()} · Total profit: ₦{(summary?.totalProfit ?? 0).toLocaleString()}.
            You'll review and confirm with your PIN before anything is recorded.
          </p>
          <form onSubmit={onReviewClick} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Note (optional)</label>
                <Input
                  placeholder="e.g. Expired/damaged stock write-off"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit">
                Review & Confirm
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-100">Balance-Out History</h3>
        </div>
        {historyError && (
          <div className="mx-6 mb-2 p-3 rounded-lg bg-error-val/10 border border-error-val">
            <p className="text-sm font-medium text-error-val">{historyError}</p>
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center text-brand-500">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading history...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-brand-500">
            <p>{historyError ? 'Unable to load history.' : 'No stock balance-out records found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-brand-500 uppercase bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Note</th>
                  <th className="px-6 py-4 font-medium text-right">Stock Value at the Time</th>
                  <th className="px-6 py-4 font-medium text-right">Amount Balanced Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 dark:divide-brand-800/50">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-brand-600 dark:text-brand-400">
                      {new Date(rec.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {rec.note || '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-brand-600 dark:text-brand-400">
                      ₦{(rec.stockValueSnapshot || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400">
                      -₦{(rec.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-brand-500">
            Page {page} of {totalPages} ({total} records)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmBalanceOutModal
          amount={Number(formData.amount) || 0}
          note={formData.note}
          summary={summary}
          submitting={submitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
