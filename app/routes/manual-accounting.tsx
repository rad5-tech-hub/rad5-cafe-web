import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '~/components/ui/icon';
import { StatCard } from '~/components/ui/stat-card';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';

export function meta() {
  return [
    { title: "Manual Accounting Override - RAD5 Café" },
    { name: "description", content: "Override online product stock quantities for custom profit calculations." },
  ];
}

function safeNum(n: unknown): number {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
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
      setDraftQuantities(prev => ({ ...prev, [productId]: val }));
    }
  };

  const handleIncrement = (productId: string, onlineQty: number) => {
    const currentValStr = draftQuantities[productId];
    const currentVal = currentValStr !== undefined && currentValStr !== '' ? parseInt(currentValStr, 10) : onlineQty;
    setDraftQuantities(prev => ({ ...prev, [productId]: String(currentVal + 1) }));
  };

  const handleDecrement = (productId: string, onlineQty: number) => {
    const currentValStr = draftQuantities[productId];
    const currentVal = currentValStr !== undefined && currentValStr !== '' ? parseInt(currentValStr, 10) : onlineQty;
    if (currentVal <= 0) return;
    setDraftQuantities(prev => ({ ...prev, [productId]: String(currentVal - 1) }));
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
    showToast({ type: 'success', title: 'Draft overrides cleared', message: 'Click Save to persist.' });
  };

  const handleSave = () => {
    const finalOverrides: Record<string, number> = {};
    Object.entries(draftQuantities).forEach(([productId, valStr]) => {
      if (valStr !== '') {
        const val = parseInt(valStr, 10);
        if (!isNaN(val)) finalOverrides[productId] = val;
      }
    });
    localStorage.setItem('manual_product_quantities', JSON.stringify(finalOverrides));
    showToast({ type: 'success', title: 'Manual quantity overrides updated' });
    navigate('/accounting');
  };

  const filteredProducts = products.filter(p => p.productName.toLowerCase().includes(search.toLowerCase()));

  const computedDetails = products.map((item: any) => {
    const draftValStr = draftQuantities[item.productId];
    const hasManual = draftValStr !== undefined && draftValStr !== '';
    const quantity = hasManual ? parseInt(draftValStr, 10) : item.quantityAdded;
    const finalQty = isNaN(quantity) ? 0 : quantity;
    const sellingPrice = item.sellingPrice ?? (item.quantityAdded > 0 ? item.expectedRevenue / item.quantityAdded : 0);
    const costPrice = item.costPrice ?? (sellingPrice - (item.quantityAdded > 0 ? item.expectedProfit / item.quantityAdded : 0));
    return {
      ...item,
      quantity: finalQty,
      hasManual,
      expectedRevenue: finalQty * sellingPrice,
      expectedProfit: finalQty * (sellingPrice - costPrice),
    };
  });

  const computedTotals = computedDetails.reduce((acc: any, curr: any) => {
    acc.expectedRevenue += curr.expectedRevenue;
    acc.expectedProfit += curr.expectedProfit;
    acc.actualizedRevenue += curr.actualizedRevenue;
    acc.actualizedProfit += curr.actualizedProfit;
    acc.limboAmount += curr.limboAmount;
    return acc;
  }, { expectedRevenue: 0, expectedProfit: 0, actualizedRevenue: 0, actualizedProfit: 0, limboAmount: 0 });

  const columns: DataTableColumn<any>[] = [
    { key: 'product', header: 'Product', width: '1.4fr', render: (p) => <span className="text-[13px] font-semibold truncate block">{p.productName}</span> },
    { key: 'qtyAdded', header: 'Qty added', render: (p) => <span className="text-[12.5px] text-text-secondary">{p.quantityAdded}</span> },
    {
      key: 'manualQty', header: 'Manual qty', width: '1.3fr',
      render: (p) => {
        const draftVal = draftQuantities[p.productId];
        const hasManual = draftVal !== undefined && draftVal !== '';
        return (
          <div className="inline-flex items-center glass-chip rounded-xl p-0.5 border">
            <button type="button" onClick={() => handleDecrement(p.productId, p.quantityAdded)} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-tint-a text-text-secondary hover:text-tint active:scale-90 transition-all cursor-pointer">
              <Icon name="minus" size={12} />
            </button>
            <input
              type="text"
              value={draftVal !== undefined ? draftVal : ''}
              placeholder={String(p.quantityAdded)}
              onChange={(e) => handleQuantityChange(p.productId, e.target.value)}
              className="w-12 text-center border-0 bg-transparent text-xs font-bold outline-none placeholder:text-text-secondary/40"
            />
            <button type="button" onClick={() => handleIncrement(p.productId, p.quantityAdded)} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-tint-a text-text-secondary hover:text-tint active:scale-90 transition-all cursor-pointer">
              <Icon name="plus" size={12} />
            </button>
            {hasManual && (
              <button type="button" onClick={() => handleResetProduct(p.productId)} title="Reset to online qty" className="w-7 h-7 rounded-lg grid place-items-center hover:bg-error-val/10 text-text-secondary hover:text-error-val transition-all cursor-pointer ml-0.5 border-l border-border">
                <Icon name="x" size={10} />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'expRev', header: 'Expected rev', align: 'right',
      render: (p) => {
        const draftVal = draftQuantities[p.productId];
        const hasManual = draftVal !== undefined && draftVal !== '';
        const sellingPrice = p.sellingPrice ?? (p.quantityAdded > 0 ? p.expectedRevenue / p.quantityAdded : 0);
        const qty = hasManual ? (parseInt(draftVal, 10) || 0) : p.quantityAdded;
        return <Money amount={qty * sellingPrice} className={`text-[12.5px] font-bold ${hasManual ? 'text-tint' : 'text-ok'}`} />;
      },
    },
    {
      key: 'expProfit', header: 'Expected profit', align: 'right',
      render: (p) => {
        const draftVal = draftQuantities[p.productId];
        const hasManual = draftVal !== undefined && draftVal !== '';
        const sellingPrice = p.sellingPrice ?? (p.quantityAdded > 0 ? p.expectedRevenue / p.quantityAdded : 0);
        const costPrice = p.costPrice ?? (sellingPrice - (p.quantityAdded > 0 ? p.expectedProfit / p.quantityAdded : 0));
        const qty = hasManual ? (parseInt(draftVal, 10) || 0) : p.quantityAdded;
        return <Money amount={qty * (sellingPrice - costPrice)} className={`text-[12.5px] font-bold ${hasManual ? 'text-tint' : 'text-ok'}`} />;
      },
    },
    { key: 'actRev', header: 'Actual rev', align: 'right', render: (p) => <Money amount={p.actualizedRevenue} className="text-[12.5px] font-semibold" /> },
    { key: 'actProfit', header: 'Actual profit', align: 'right', render: (p) => <Money amount={p.actualizedProfit} className="text-[12.5px] font-semibold" /> },
    { key: 'limbo', header: 'Limbo', align: 'right', render: (p) => <span className="text-[12px] text-warn">{p.limboQuantity} · <Money amount={p.limboAmount} className="text-[12px] text-warn" /></span> },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manual accounting override</h1>
          <p className="text-text-secondary text-xs mt-1">
            Set local overrides for quantities added; overridden products recalculate expected revenue instantly.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleClearAll} className="px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer hover:border-error-val hover:text-error-val transition-colors flex items-center gap-1.5">
            <Icon name="trash" size={13} />
            Clear overrides
          </button>
          <button onClick={() => navigate('/accounting')} className="px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl border-none bg-tint-dark text-white text-xs font-bold cursor-pointer hover:bg-tint transition-colors flex items-center gap-1.5">
            <Icon name="check" size={13} />
            Save changes
          </button>
        </div>
      </div>

      {error ? (
        <div className="glass-surface rounded-2xl p-4 border border-error-val/30 text-sm font-medium text-error-val">
          Failed to load product intelligence data.
        </div>
      ) : (
        <>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <StatCard label="Expected revenue" value={loading ? '—' : <Money amount={computedTotals.expectedRevenue} />} valueColor="var(--color-ok)" />
            <StatCard label="Actual revenue" value={loading ? '—' : <Money amount={computedTotals.actualizedRevenue} />} valueColor="var(--color-ok)" />
            <StatCard label="Limbo amount" value={loading ? '—' : <Money amount={computedTotals.limboAmount} />} valueColor="var(--color-warn)" />
            <StatCard label="Actual profit" value={loading ? '—' : <Money amount={computedTotals.actualizedProfit} />} />
          </div>

          <div className="relative">
            <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-chip text-sm pl-9 pr-4 py-2.5 rounded-full outline-none focus:border-tint placeholder:text-text-secondary transition-colors border"
            />
          </div>

          <DataTable
            columns={columns}
            rows={filteredProducts}
            keyExtractor={(p) => p.productId}
            loading={loading}
            emptyMessage="No products found."
            minWidth={900}
          />
        </>
      )}
    </div>
  );
}
