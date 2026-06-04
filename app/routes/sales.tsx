import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';

type Sale = {
  id: string;
  receiptNumber: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    totalPrice: number;
  }[];
  revenue: number;
  profit: number;
  status: string;
  date: string;
};

const filters = ['Daily', 'Weekly', 'Monthly', 'All'];

export function meta() {
  return [
    { title: "Sales Logs - RAD5 Café" },
    { name: "description", content: "Review total daily revenues, margins, and processed transaction counts." },
  ];
}

export default function Sales() {
  const { showToast } = useToast();
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Cancellation state
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);
  const [cancelPin, setCancelPin] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchSalesData = (filter: string) => {
    setLoading(true);
    api.adminDashboard.sales.list({ filter: filter.toLowerCase(), limit: 100 })
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setSalesList(res.data);
        } else {
          setSalesList([]);
        }
      })
      .catch((err) => {
        console.warn('Could not load live sales records:', err);
        setSalesList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSalesData(activeFilter);
  }, [activeFilter]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingSaleId || !cancelPin) return;

    setAdjusting(true);
    try {
      const res = await api.adminDashboard.sales.adjust(cancellingSaleId, {
        status: 'cancelled',
        pin: cancelPin,
      });

      if (res.success) {
        showToast('Order cancelled and customer refunded successfully!', 'success');
        setCancellingSaleId(null);
        setCancelPin('');
        fetchSalesData(activeFilter); // Reload sales data
      } else {
        showToast(res.message || 'Failed to cancel order.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const totalRevenue = salesList.reduce((s, sale) => s + (sale.status !== 'cancelled' ? sale.revenue : 0), 0);
  const totalProfit = salesList.reduce((s, sale) => s + (sale.status !== 'cancelled' ? sale.profit : 0), 0);
  const totalTransactions = salesList.filter(s => s.status !== 'cancelled').length;

  return (
    <div className="flex flex-col gap-6 select-none max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Sales Records</h1>
        <p className="text-text-secondary text-xs mt-1">
          Review summary cash flow indexes and transaction checkout rows.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col gap-1 text-center shadow-xs">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Revenue</span>
          <span className="text-lg md:text-xl font-extrabold text-success select-all">₦{totalRevenue.toLocaleString()}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 text-center shadow-xs">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Profit</span>
          <span className="text-lg md:text-xl font-extrabold text-success select-all">₦{totalProfit.toLocaleString()}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 text-center shadow-xs">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Orders</span>
          <span className="text-lg md:text-xl font-extrabold text-tint select-all">{totalTransactions}</span>
        </Card>
      </div>

      {/* Filters chips horizontal scrolling */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
              activeFilter === f
                ? 'bg-tint text-white border-tint shadow-xs'
                : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sales Rows list */}
      <Card padded={false} className="overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : salesList.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm">
            No sales logs found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {salesList.map((sale) => (
              <div key={sale.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-4 hover:bg-bg-selected/10 transition-colors gap-3">
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-text-main select-all">
                      {sale.receiptNumber}
                    </span>
                    <Badge
                      label={sale.status}
                      variant={sale.status === 'completed' ? 'success' : sale.status === 'cancelled' ? 'error' : 'warning'}
                    />
                  </div>
                  <span className="text-xs text-text-main font-semibold mt-1">
                    {sale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    {sale.customerName} • {new Date(sale.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm text-text-main select-all">
                      ₦{sale.revenue.toLocaleString()}
                    </span>
                    {sale.status !== 'cancelled' && sale.profit > 0 && (
                      <span className="text-[10px] font-bold text-success select-all">
                        +₦{sale.profit.toLocaleString()} profit
                      </span>
                    )}
                  </div>
                  
                  {sale.status === 'completed' && (
                    <button
                      onClick={() => setCancellingSaleId(sale.id)}
                      className="text-[10px] font-bold text-error-val hover:underline cursor-pointer border border-error-val/30 hover:border-error-val/80 py-1 px-2 rounded-lg bg-error-val/5 transition-all mt-1"
                    >
                      Cancel & Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirmation Modal for PIN validation */}
      {cancellingSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setCancellingSaleId(null)} />
          <Card
            padded={true}
            className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-4 shadow-2xl animate-scale-up"
            style={{ borderRadius: 'var(--radius-xl)' }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-text-main">Cancel Order & Refund</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                This action is irreversible. The customer's wallet balance will be credited with the order amount, and product quantities will be returned to stock.
              </p>
            </div>
            <form onSubmit={handleConfirmCancel} className="flex flex-col gap-4">
              <Input
                label="Admin Transaction PIN"
                placeholder="4-digit PIN"
                type="password"
                maxLength={4}
                pattern="\d{4}"
                value={cancelPin}
                onChange={(e) => setCancelPin(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="new-password"
                autoFocus
              />
              <div className="flex gap-2 justify-end border-t border-border pt-3 mt-1">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => {
                    setCancellingSaleId(null);
                    setCancelPin('');
                  }}
                  className="cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={adjusting}
                  className="bg-error-val hover:opacity-90 font-bold"
                >
                  {adjusting ? 'Adjusting...' : 'Cancel & Refund'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
