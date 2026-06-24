import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
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

export function meta() {
  return [
    { title: "Sales Logs - RAD5 Café" },
    { name: "description", content: "Review total daily revenues, margins, and processed transaction counts." },
  ];
}

export default function Sales() {
  const { showToast } = useToast();
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Cancellation state
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);
  const [cancelPin, setCancelPin] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [issuingSaleId, setIssuingSaleId] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);

  const [aggregateRevenue, setAggregateRevenue] = useState(0);
  const [aggregateProfit, setAggregateProfit] = useState(0);
  const [aggregateOrders, setAggregateOrders] = useState(0);

  const fetchSalesData = (filterValue: string, pageNum: number) => {
    setLoading(true);
    api.adminDashboard.sales.list({ filter: filterValue, page: pageNum, limit })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setSalesList(res.data);
          setTotal(res.total ?? res.data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? res.data.length) / limit));
          setAggregateRevenue(res.totalRevenue ?? 0);
          setAggregateProfit(res.totalProfit ?? 0);
          setAggregateOrders(res.totalOrders ?? res.total ?? 0);
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
    setPage(1);
    fetchSalesData(activeFilter, 1);
  }, [activeFilter]);

  useEffect(() => {
    if (page > 1) fetchSalesData(activeFilter, page);
  }, [page]);

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
        setSalesList(prev => prev.map(s => s.id === cancellingSaleId ? { ...s, status: 'cancelled' } : s));
        setCancellingSaleId(null);
        setCancelPin('');
      } else {
        showToast(res.message || 'Failed to cancel order.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const handleConfirmIssue = async () => {
    if (!issuingSaleId) return;

    setIssuing(true);
    try {
      const res = await api.adminDashboard.sales.issue(issuingSaleId);

      if (res.success) {
        showToast('Order issued successfully!', 'success');
        if (res.data) {
          const updatedSale = res.data;
          setSalesList(prev => prev.map(s => s.id === issuingSaleId ? { ...s, ...updatedSale } : s));
        } else {
          setSalesList(prev => prev.map(s => s.id === issuingSaleId ? { ...s, issued: true, status: 'completed' } : s));
        }
        setIssuingSaleId(null);
      } else {
        showToast(res.message || 'Failed to issue order.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to issue order.', 'error');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Sales Records</h1>
          <p className="text-text-secondary text-xs mt-1">
            Review summary cash flow indexes and transaction checkout rows.
          </p>
        </div>
        <button
          onClick={() => {
            fetchSalesData(activeFilter, page);
          }}
          disabled={loading}
          className="text-text-secondary hover:text-tint transition-colors cursor-pointer p-2 rounded-full hover:bg-bg-selected disabled:opacity-50"
          title="Refresh Sales"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col gap-1 text-center shadow-xs">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Revenue</span>
          <span className="text-lg md:text-xl font-extrabold text-success select-all">₦{aggregateRevenue.toLocaleString()}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 text-center shadow-xs">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Profit</span>
          <span className="text-lg md:text-xl font-extrabold text-success select-all">₦{aggregateProfit.toLocaleString()}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 text-center shadow-xs">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Orders</span>
          <span className="text-lg md:text-xl font-extrabold text-tint select-all">{aggregateOrders}</span>
        </Card>
      </div>

      {/* Filters chips horizontal scrolling */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
              activeFilter === f.value
                ? 'bg-tint text-white border-tint shadow-xs'
                : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
            }`}
          >
            {f.label}
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
                    {sale.customerName} • {new Date(parseDate(sale.date)).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                  
                  {sale.status === 'completed' && !sale.issued && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIssuingSaleId(sale.id)}
                        className="text-[10px] font-bold text-success hover:underline cursor-pointer border border-success/30 hover:border-success/80 py-1 px-2 rounded-lg bg-success/5 transition-all mt-1"
                      >
                        Issue
                      </button>
                      <button
                        onClick={() => setCancellingSaleId(sale.id)}
                        className="text-[10px] font-bold text-error-val hover:underline cursor-pointer border border-error-val/30 hover:border-error-val/80 py-1 px-2 rounded-lg bg-error-val/5 transition-all mt-1"
                      >
                        Cancel & Refund
                      </button>
                    </div>
                  )}
                  {sale.status === 'completed' && sale.issued && (
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge label="Issued" variant="success" />
                      {sale.issuedBy && (
                        <span 
                          className="text-[10px] text-text-secondary cursor-pointer hover:text-tint transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(sale.issuedBy!);
                            showToast('Copied ID to clipboard!', 'success');
                          }}
                          title="Click to copy ID"
                        >
                          by {sale.issuedBy}
                        </span>
                      )}
                      {sale.issuedAt && (
                        <span className="text-[10px] text-text-secondary">
                          {new Date(parseDate(sale.issuedAt)).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center gap-3">
          <span className="text-xs text-text-secondary">{total} total results</span>
          <div className="flex items-center gap-3">
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
        </div>
      )}

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

      {issuingSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIssuingSaleId(null)} />
          <Card
            padded={true}
            className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-4 shadow-2xl animate-scale-up"
            style={{ borderRadius: 'var(--radius-xl)' }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-text-main">Issue Order</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Mark this order as processed/fulfilled. This confirms the items have been handed over to the customer.
              </p>
            </div>
            <div className="flex gap-2 justify-end border-t border-border pt-3 mt-1">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => setIssuingSaleId(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={handleConfirmIssue}
                disabled={issuing}
                className="bg-success hover:opacity-90 font-bold"
              >
                {issuing ? 'Issuing...' : 'Confirm Issue'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
