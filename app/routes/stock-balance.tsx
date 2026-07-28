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

export default function StockBalance() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [records, setRecords] = useState<BalanceOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: '', note: '', pin: '' });

  const fetchSummary = () => {
    setSummaryLoading(true);
    api.adminDashboard.stockBalance.getSummary()
      .then((res: any) => {
        if (res.success && res.data) {
          setSummary(res.data);
        }
      })
      .catch((err: any) => {
        console.warn('Could not load stock balance summary:', err);
      })
      .finally(() => setSummaryLoading(false));
  };

  const fetchRecords = (pageNum: number) => {
    setLoading(true);
    api.adminDashboard.stockBalance.list({ page: pageNum, limit })
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setRecords(res.data);
          setTotal(res.total ?? res.data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? res.data.length) / limit));
        } else {
          setRecords([]);
        }
      })
      .catch((err: any) => {
        console.warn('Could not load stock balance history:', err);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  const handleBalanceOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.pin) return;

    setSubmitting(true);
    try {
      const res = await api.adminDashboard.stockBalance.create({
        amount: Number(formData.amount),
        note: formData.note,
        pin: formData.pin,
      });

      if (res.success) {
        showToast({ type: 'success', title: 'Stock Balanced Out', message: 'The amount has been deducted from total profit and recorded as a loss.' });
        setShowForm(false);
        setFormData({ amount: '', note: '', pin: '' });
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
            <p>No active products in stock.</p>
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
            The amount entered will be deducted from total profit and recorded as a loss.
          </p>
          <form onSubmit={handleBalanceOut} className="space-y-4">
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
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Admin PIN</label>
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Note (optional)</label>
                <Input
                  placeholder="e.g. Expired/damaged stock write-off"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Balancing Out...' : 'Confirm Balance Out'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-6 pt-5 pb-1">
          <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-100">Balance-Out History</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-brand-500">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading history...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-brand-500">
            <p>No stock balance-out records found.</p>
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
    </div>
  );
}
