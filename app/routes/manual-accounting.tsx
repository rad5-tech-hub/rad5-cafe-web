import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { Button } from '~/components/ui/button';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';

export function meta() {
  return [
    { title: "Manage Manual Quantities - RAD5 Café" },
    { name: "description", content: "Override online product stock quantities for custom profit calculations." },
  ];
}

function safeNum(n: unknown): number {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
}

function fmtCurrency(amount: unknown): string {
  return `₦${safeNum(amount).toLocaleString()}`;
}

function StatCard({ label, value, icon, variant = 'default' }: { label: string, value: string, icon: any, variant?: 'default'|'success'|'warning'|'error' }) {
  const getColors = () => {
    switch (variant) {
      case 'success': return 'text-success bg-success/15';
      case 'warning': return 'text-warning bg-warning/15';
      case 'error': return 'text-error-val bg-error-val/15';
      default: return 'text-tint bg-tint/15';
    }
  };
  return (
    <div className="group flex flex-row items-center gap-4 p-5 select-none hover:bg-bg-selected/30 transition-colors duration-300 w-full cursor-default">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 flex-shrink-0 ${getColors()}`}>
        <Icon name={icon} size={22} />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-xs font-semibold text-text-secondary select-all">{label}</span>
        <span className="text-xl font-extrabold text-text-main tabular-nums select-all mt-0.5">{value}</span>
      </div>
    </div>
  );
}

export default function ManualAccounting() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState('');
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.accounting()
      .then(res => {
        if (res.success && res.data?.details) {
          setProducts(res.data.details);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    const saved = localStorage.getItem('manual_product_quantities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const stringified: Record<string, string> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          stringified[key] = String(val);
        });
        setDraftQuantities(stringified);
      } catch (e) {
        console.error('Error loading manual quantities:', e);
      }
    }
  }, []);

  const handleQuantityChange = (productId: string, val: string) => {
    if (val === '' || /^\d+$/.test(val)) {
      setDraftQuantities(prev => ({
        ...prev,
        [productId]: val,
      }));
    }
  };

  const handleIncrement = (productId: string, onlineQty: number) => {
    const currentValStr = draftQuantities[productId];
    const currentVal = currentValStr !== undefined && currentValStr !== '' 
      ? parseInt(currentValStr, 10) 
      : onlineQty;
    
    setDraftQuantities(prev => ({
      ...prev,
      [productId]: String(currentVal + 1),
    }));
  };

  const handleDecrement = (productId: string, onlineQty: number) => {
    const currentValStr = draftQuantities[productId];
    const currentVal = currentValStr !== undefined && currentValStr !== '' 
      ? parseInt(currentValStr, 10) 
      : onlineQty;
    
    if (currentVal <= 0) return;

    setDraftQuantities(prev => ({
      ...prev,
      [productId]: String(currentVal - 1),
    }));
  };

  const handleResetProduct = (productId: string) => {
    setDraftQuantities(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleClearAll = () => {
    setDraftQuantities({});
    showToast('Draft overrides cleared. Click Save to persist.', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOverrides: Record<string, number> = {};

    Object.entries(draftQuantities).forEach(([productId, valStr]) => {
      if (valStr !== '') {
        const val = parseInt(valStr, 10);
        if (!isNaN(val)) {
          finalOverrides[productId] = val;
        }
      }
    });

    localStorage.setItem('manual_product_quantities', JSON.stringify(finalOverrides));
    showToast('Manual quantity overrides updated successfully!', 'success');
    navigate('/accounting');
  };

  const handleCancel = () => {
    navigate('/accounting');
  };

  // Filter products by name
  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(search.toLowerCase())
  );

  // Real-time recalculations for top summary cards
  const computedDetails = products.map((item: any) => {
    const draftValStr = draftQuantities[item.productId];
    const hasManual = draftValStr !== undefined && draftValStr !== '';
    const quantity = hasManual ? parseInt(draftValStr, 10) : item.quantityAdded;
    const finalQty = isNaN(quantity) ? 0 : quantity;
    
    // Derived unit rates
    const sellingPrice = item.sellingPrice ?? (item.quantityAdded > 0 ? item.expectedRevenue / item.quantityAdded : 0);
    const costPrice = item.costPrice ?? (sellingPrice - (item.quantityAdded > 0 ? item.expectedProfit / item.quantityAdded : 0));

    const expectedRevenue = finalQty * sellingPrice;
    const expectedProfit = finalQty * (sellingPrice - costPrice);

    return {
      ...item,
      quantity: finalQty,
      hasManual,
      expectedRevenue,
      expectedProfit
    };
  });

  const computedTotals = computedDetails.reduce((acc: any, curr: any) => {
    acc.expectedRevenue += curr.expectedRevenue;
    acc.expectedProfit += curr.expectedProfit;
    acc.actualizedRevenue += curr.actualizedRevenue;
    acc.actualizedProfit += curr.actualizedProfit;
    acc.limboAmount += curr.limboAmount;
    return acc;
  }, {
    expectedRevenue: 0,
    expectedProfit: 0,
    actualizedRevenue: 0,
    actualizedProfit: 0,
    limboAmount: 0
  });

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} />
        <p className="text-text-secondary text-sm mt-3">Loading product inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-error-val/10 flex items-center justify-center text-error-val mx-auto mb-4">
          <Icon name="alert-triangle" size={24} />
        </div>
        <p className="text-error-val font-semibold">Failed to load product intelligence data.</p>
        <Button variant="primary" onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Manual Quantity Overrides</h1>
          <p className="text-text-secondary text-xs mt-1">
            Specify local overrides for stock quantities. Overridden products calculate expected revenues locally.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleClearAll} className="h-10 hover:bg-error-val/10 hover:text-error-val hover:border-error-val/30 flex-shrink-0">
            <Icon name="trash" size={14} className="mr-1.5" />
            Clear Overrides
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel} className="h-10 flex-shrink-0">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="h-10 px-5 font-bold flex-shrink-0">
            <Icon name="check" size={14} className="mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Real-time stats recalculation based on manual inputs */}
      <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <StatCard label="Total Expected Rev" value={fmtCurrency(computedTotals.expectedRevenue)} icon="dollar" variant="success" />
        <StatCard label="Total Actual Rev" value={fmtCurrency(computedTotals.actualizedRevenue)} icon="trending-up" variant="success" />
        <StatCard label="Limbo Amount" value={fmtCurrency(computedTotals.limboAmount)} icon="alert-triangle" variant="warning" />
        <StatCard label="Actual Profit" value={fmtCurrency(computedTotals.actualizedProfit)} icon="cash" />
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-text-secondary">
            <Icon name="search" size={18} />
          </div>
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-bg-element border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tint/40 focus:border-tint text-text-main transition-all placeholder:text-text-secondary/50"
          />
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-bg-element/20 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-element border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-text-secondary sticky left-0 bg-bg-element z-10">Product</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Qty Added</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right text-tint min-w-[140px]">Manual Qty</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Rev</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Profit</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Rev</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Profit</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Limbo Qty</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Limbo Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => {
                  const draftVal = draftQuantities[p.productId];
                  const hasManual = draftVal !== undefined && draftVal !== '';
                  const quantity = hasManual ? parseInt(draftVal, 10) : p.quantityAdded;
                  const finalQty = isNaN(quantity) ? 0 : quantity;

                  // Derived unit rates
                  const sellingPrice = p.sellingPrice ?? (p.quantityAdded > 0 ? p.expectedRevenue / p.quantityAdded : 0);
                  const costPrice = p.costPrice ?? (sellingPrice - (p.quantityAdded > 0 ? p.expectedProfit / p.quantityAdded : 0));

                  const expectedRevenue = finalQty * sellingPrice;
                  const expectedProfit = finalQty * (sellingPrice - costPrice);

                  return (
                    <tr key={p.productId} className={`hover:bg-bg-selected/20 transition-colors ${hasManual ? 'bg-tint/[0.01]' : ''}`}>
                      <td className="px-4 py-3 font-medium text-text-main sticky left-0 bg-card z-10">
                        {p.productName}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">
                        {p.quantityAdded}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center bg-bg-element border border-border rounded-xl p-0.5 shadow-xs align-middle">
                          <button
                            type="button"
                            onClick={() => handleDecrement(p.productId, p.quantityAdded)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-bg-selected text-text-secondary hover:text-text-main active:scale-90 transition-all cursor-pointer"
                          >
                            <Icon name="minus" size={12} />
                          </button>
                          
                          <input
                            type="text"
                            value={draftVal !== undefined ? draftVal : ''}
                            placeholder={String(p.quantityAdded)}
                            onChange={e => handleQuantityChange(p.productId, e.target.value)}
                            className="w-12 text-center border-0 bg-transparent text-xs font-bold text-text-main focus:ring-0 focus:outline-none placeholder:text-text-secondary/30"
                          />

                          <button
                            type="button"
                            onClick={() => handleIncrement(p.productId, p.quantityAdded)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-bg-selected text-text-secondary hover:text-text-main active:scale-90 transition-all cursor-pointer"
                          >
                            <Icon name="plus" size={12} />
                          </button>

                          {hasManual && (
                            <button
                              type="button"
                              onClick={() => handleResetProduct(p.productId)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-error-val/10 text-text-secondary hover:text-error-val transition-all cursor-pointer ml-0.5 border-l border-border"
                              title="Reset to Online Qty"
                            >
                              <Icon name="x" size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold transition-all duration-200 ${hasManual ? 'text-tint bg-tint/5 scale-102' : 'text-success'}`}>
                        {fmtCurrency(expectedRevenue)}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold transition-all duration-200 ${hasManual ? 'text-tint bg-tint/5 scale-102' : 'text-success'}`}>
                        {fmtCurrency(expectedProfit)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-main">
                        {fmtCurrency(p.actualizedRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-main">
                        {fmtCurrency(p.actualizedProfit)}
                      </td>
                      <td className="px-4 py-3 text-right text-warning">
                        {p.limboQuantity}
                      </td>
                      <td className="px-4 py-3 text-right text-warning">
                        {fmtCurrency(p.limboAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
