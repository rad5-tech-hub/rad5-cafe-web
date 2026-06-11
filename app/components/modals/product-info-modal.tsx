import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { api } from '~/lib/api';

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
    createdAt: string;
  }>;
  summary: {
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    averageSellingPrice: number;
  };
};

interface ProductInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
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

  useEffect(() => {
    if (!isOpen || !productId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.adminDashboard.products.analytics(productId, { period: 'this_month' })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load product analytics.');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load product analytics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, productId]);

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
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

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-sm text-error-val font-semibold mb-3">{error}</p>
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
                    <span className={`font-bold ${data.product.currentStock === 0 ? 'text-error-val' : data.product.currentStock < (10) ? 'text-warning' : 'text-success'}`}>
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
                            <td className="py-2 px-3 font-medium text-text-main">{formatDate(s.period)}</td>
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
                  No sales or stock history available yet.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
