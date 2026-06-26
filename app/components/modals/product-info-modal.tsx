import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { api } from '~/lib/api';

type FirestoreTimestamp = { _seconds: number; _nanoseconds: number };

type ProductAnalytics = {
  product: {
    id: string;
    name: string;
    currentStock: number;
    costPrice: number;
    sellingPrice: number;
    profitPerUnit: number;
  };
  salesByPeriod: Array<{
    period: string;
    totalQuantity: number;
    totalRevenue: number;
    totalProfit: number;
    orderCount: number;
  }>;
  stockHistory: Array<{
    id: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    reference: string;
    createdAt: string | FirestoreTimestamp;
  }>;
  summary: {
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    averageSellingPrice: number;
  };
};

type PeriodOption = 'this_month' | 'today' | 'this_year' | 'custom';

interface ProductInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

const PERIOD_LABELS: Record<PeriodOption, string> = {
  this_month: 'This Month',
  today: 'Today',
  this_year: 'This Year',
  custom: 'Custom Range',
};

function toDate(input: string | FirestoreTimestamp | undefined): Date | null {
  if (!input) return null;
  if (typeof input === 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (input._seconds) {
    return new Date(input._seconds * 1000);
  }
  return null;
}

function formatDate(input: string | FirestoreTimestamp | undefined): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateInputValue(input: string | FirestoreTimestamp | undefined): string {
  const d = toDate(input);
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

function formatPeriodLabel(period: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return formatDate(period);
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split('-');
    return new Date(+y, +m - 1).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
  }
  return period;
}

function getCustomerDisplayName(p: any): string {
  const name = p.user?.fullName || p.customerName || '';
  if (!name || name.toLowerCase() === 'unkwun customer' || name.toLowerCase() === 'unknown customer' || name.toLowerCase() === 'unknown') {
    return p.user?.email || p.customerEmail || name || 'Unknown';
  }
  return name || 'Unknown';
}

export const ProductInfoModal: React.FC<ProductInfoModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
}) => {
  const [data, setData] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodOption>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedParams, setAppliedParams] = useState<{ period?: string; startDate?: string; endDate?: string }>({ period: 'this_month' });
  const [activeTab, setActiveTab] = useState<'analytics' | 'purchases'>('analytics');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);

  const handlePeriodChange = (p: PeriodOption) => {
    setPeriod(p);
    if (p !== 'custom') {
      const params = { period: p };
      setAppliedParams(params);
      setStartDate('');
      setEndDate('');
    }
  };

  const handleApplyCustom = () => {
    const params: { period?: string; startDate?: string; endDate?: string } = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    setAppliedParams(params);
  };

  const fetchAnalytics = useCallback(() => {
    if (!productId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.adminDashboard.products.analytics(productId, appliedParams)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load product analytics.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load analytics. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [productId, appliedParams]);

  const fetchPurchases = useCallback(() => {
    if (!productId || purchasesLoaded) return;
    setPurchasesLoading(true);
    api.adminDashboard.products.purchaseHistory({ productId, limit: 50 })
      .then((res: any) => {
        if (res.success && res.data) {
          setPurchases(res.data);
          setPurchasesLoaded(true);
        }
      })
      .catch(() => {})
      .finally(() => setPurchasesLoading(false));
  }, [productId, purchasesLoaded]);

  useEffect(() => {
    if (isOpen && activeTab === 'purchases') {
      fetchPurchases();
    }
  }, [isOpen, activeTab, fetchPurchases]);

  useEffect(() => {
    if (!isOpen) return;
    const cancel = fetchAnalytics();
    return cancel;
  }, [fetchAnalytics, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPeriod('this_month');
      setStartDate('');
      setEndDate('');
      setAppliedParams({ period: 'this_month' });
      setData(null);
      setError(null);
      setActiveTab('analytics');
      setPurchases([]);
      setPurchasesLoaded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stockTypeLabel = (type: string) => {
    switch (type) {
      case 'added': return 'Restock';
      case 'removed': return 'Removal';
      case 'sold': return 'Sale';
      case 'adjusted': return 'Adjustment';
      default: return type;
    }
  };

  const stockTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'text-success';
      case 'removed': return 'text-error-val';
      case 'sold': return 'text-tint';
      case 'adjusted': return 'text-warning';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-card border border-border w-full max-w-lg rounded-2xl flex flex-col shadow-2xl animate-scale-up max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-lg font-bold text-text-main leading-tight">
              {productName}
            </h3>
            <span className="text-xs text-text-secondary">Product Analytics</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-bg-selected text-text-secondary hover:text-text-main transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-border text-sm font-bold mt-2 px-6">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-1 border-b-2 transition-colors mr-6 ${
              activeTab === 'analytics' ? 'border-tint text-tint' : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            Analytics & Stock
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'purchases' ? 'border-tint text-tint' : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            Purchase History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {activeTab === 'analytics' ? (
            <>
              {/* Period Selector */}
          <div className="flex flex-col gap-2">
            <Select
              value={period}
              onChange={(val) => handlePeriodChange(val as PeriodOption)}
              options={(['this_month', 'today', 'this_year', 'custom'] as PeriodOption[]).map((p) => ({
                label: PERIOD_LABELS[p],
                value: p
              }))}
              className="w-full"
            />
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 bg-bg-element border border-border text-text-main text-xs px-3 py-1.5 rounded-lg outline-none focus:border-tint"
                />
                <span className="text-xs text-text-secondary">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 bg-bg-element border border-border text-text-main text-xs px-3 py-1.5 rounded-lg outline-none focus:border-tint"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyCustom}
                  disabled={!startDate && !endDate}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-full bg-error-val/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error-val">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <p className="text-sm text-text-main font-semibold">Unable to load analytics</p>
              <p className="text-xs text-text-secondary">{error}</p>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          ) : data ? (
            <>
              {/* Product Details */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Product Details</span>
                <div className="grid grid-cols-2 gap-3 p-4 bg-bg-element border border-border rounded-xl text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Current Stock</span>
                    <span className={`font-bold ${data.product.currentStock === 0 ? 'text-error-val' : data.product.currentStock < 10 ? 'text-warning' : 'text-success'}`}>
                      {data.product.currentStock} units
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Profit / Unit</span>
                    <span className="font-bold text-success">₦{data.product.profitPerUnit.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Cost Price</span>
                    <span className="font-bold text-text-main">₦{data.product.costPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Selling Price</span>
                    <span className="font-bold text-text-main">₦{data.product.sellingPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Summary</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-bg-element border border-border rounded-xl text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Total Sold</span>
                    <span className="font-bold text-text-main">{data.summary.totalSold}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Revenue</span>
                    <span className="font-bold text-tint">₦{data.summary.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Profit</span>
                    <span className="font-bold text-success">₦{data.summary.totalProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">Avg. Price</span>
                    <span className="font-bold text-text-main">₦{data.summary.averageSellingPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Sales by Period */}
              {data.salesByPeriod.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sales by Period</span>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-bg-element border-b border-border">
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Date</th>
                          <th className="text-right py-2 px-3 font-semibold text-text-secondary">Qty</th>
                          <th className="text-right py-2 px-3 font-semibold text-text-secondary">Orders</th>
                          <th className="text-right py-2 px-3 font-semibold text-text-secondary">Revenue</th>
                          <th className="text-right py-2 px-3 font-semibold text-text-secondary">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.salesByPeriod.map((s, i) => (
                          <tr key={i} className="border-b border-border last:border-b-0 hover:bg-bg-element/50">
                            <td className="py-2 px-3 font-medium text-text-main">{formatPeriodLabel(s.period)}</td>
                            <td className="py-2 px-3 text-right text-text-main">{s.totalQuantity}</td>
                            <td className="py-2 px-3 text-right text-text-main">{s.orderCount}</td>
                            <td className="py-2 px-3 text-right font-medium text-tint">₦{s.totalRevenue.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-medium text-success">₦{s.totalProfit.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Stock History */}
              {data.stockHistory.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Stock History</span>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-bg-element border-b border-border">
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Date</th>
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Type</th>
                          <th className="text-right py-2 px-3 font-semibold text-text-secondary">Qty</th>
                          <th className="text-right py-2 px-3 font-semibold text-text-secondary">Prev</th>
                          <th className="text-right py-2 px-3 font-semibold text-text-secondary">New</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stockHistory.map((h) => (
                          <tr key={h.id} className="border-b border-border last:border-b-0 hover:bg-bg-element/50">
                            <td className="py-2 px-3 font-medium text-text-main">{formatDate(h.createdAt)}</td>
                            <td className={`py-2 px-3 font-semibold ${stockTypeColor(h.type)}`}>
                              {stockTypeLabel(h.type)}
                            </td>
                            <td className="py-2 px-3 text-right text-text-main">{h.quantity}</td>
                            <td className="py-2 px-3 text-right text-text-secondary">{h.previousStock}</td>
                            <td className="py-2 px-3 text-right font-medium text-text-main">{h.newStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.salesByPeriod.length === 0 && data.stockHistory.length === 0 && (
                <div className="text-center py-6 text-xs text-text-secondary">
                  No sales or stock history for this period.
                </div>
              )}
            </>
          ) : null}
            </>
          ) : (
            /* Purchase History Tab */
            <div className="flex flex-col gap-1">
              {purchasesLoading ? (
                <div className="flex justify-center items-center py-16">
                  <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-secondary">
                  No purchase history found for this product.
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-bg-element border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold text-text-secondary">Date</th>
                        <th className="text-left py-2 px-3 font-semibold text-text-secondary">Customer</th>
                        <th className="text-right py-2 px-3 font-semibold text-text-secondary">Qty</th>
                        <th className="text-right py-2 px-3 font-semibold text-text-secondary">Total</th>
                        <th className="text-right py-2 px-3 font-semibold text-text-secondary">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((p, i) => (
                        <tr key={p.orderId || i} className="border-b border-border last:border-b-0 hover:bg-bg-element/50">
                          <td className="py-2 px-3 font-medium text-text-main">{formatDate(p.createdAt)}</td>
                          <td className="py-2 px-3 text-text-main truncate max-w-[100px]">{getCustomerDisplayName(p)}</td>
                          <td className="py-2 px-3 text-right font-bold text-text-main">{p.quantity}</td>
                          <td className="py-2 px-3 text-right font-medium text-tint">₦{p.totalPrice?.toLocaleString()}</td>
                          <td className={`py-2 px-3 text-right font-semibold capitalize ${p.status === 'purchase' || p.status === 'completed' ? 'text-success' : 'text-error-val'}`}>
                            {p.status?.replace(/_/g, ' ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
