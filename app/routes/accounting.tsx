import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Icon } from '~/components/ui/icon';
import { PillButton } from '~/components/ui/pill-button';
import { StatCard } from '~/components/ui/stat-card';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { api } from '~/lib/api';

export function meta() {
  return [
    { title: "Accounting - RAD5 Café" },
    { name: "description", content: "Reconcile expected vs actual revenues and manage manual quantity overrides." },
  ];
}

function safeNum(n: unknown): number {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
}

export default function Accounting() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [manualQuantities, setManualQuantities] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'reconciliation' | 'stock'>('reconciliation');

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.accounting()
      .then(res => {
        if (res.success && res.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    const saved = localStorage.getItem('manual_product_quantities');
    if (saved) {
      try {
        setManualQuantities(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing manual quantities:', e);
      }
    }
  }, []);

  const computedDetails = (data?.details ?? []).map((item: any) => {
    const manualQty = manualQuantities[item.productId];
    const hasManual = manualQty !== undefined && manualQty !== null && !isNaN(manualQty);
    const quantity = hasManual ? manualQty : item.quantityAdded;

    const sellingPrice = item.sellingPrice ?? (item.quantityAdded > 0 ? item.expectedRevenue / item.quantityAdded : 0);
    const costPrice = item.costPrice ?? (sellingPrice - (item.quantityAdded > 0 ? item.expectedProfit / item.quantityAdded : 0));

    const expectedRevenue = quantity * sellingPrice;
    const expectedProfit = quantity * (sellingPrice - costPrice);

    return { ...item, quantity, hasManual, expectedRevenue, expectedProfit, sellingPrice, costPrice };
  });

  const computedTotals = computedDetails.reduce((acc: any, curr: any) => {
    acc.expectedRevenue += curr.expectedRevenue;
    acc.expectedProfit += curr.expectedProfit;
    acc.actualizedRevenue += curr.actualizedRevenue;
    acc.actualizedProfit += curr.actualizedProfit;
    acc.limboAmount += curr.limboAmount;
    return acc;
  }, { expectedRevenue: 0, expectedProfit: 0, actualizedRevenue: 0, actualizedProfit: 0, limboAmount: 0 });

  const stockTotals = computedDetails.reduce((acc: any, curr: any) => {
    const remaining = safeNum(curr.remainingStock);
    const sellPrice = safeNum(curr.sellingPrice);
    const cPrice = safeNum(curr.costPrice);
    acc.totalStock += remaining;
    acc.expectedStockRevenue += remaining * sellPrice;
    acc.expectedStockProfit += remaining * (sellPrice - cPrice);
    return acc;
  }, { totalStock: 0, expectedStockRevenue: 0, expectedStockProfit: 0 });

  const reconciliationColumns: DataTableColumn<any>[] = [
    { key: 'product', header: 'Product', width: '1.4fr', render: (i) => <span className="text-[13px] font-semibold truncate block">{i.productName}</span> },
    { key: 'qty', header: 'Qty added', render: (i) => <span className="text-[12.5px] text-text-secondary">{i.quantityAdded}</span> },
    { key: 'manual', header: 'Manual qty', render: (i) => <span className={`text-[12.5px] font-bold ${i.hasManual ? 'text-tint' : 'text-text-secondary/40'}`}>{i.hasManual ? i.quantity : '—'}</span> },
    { key: 'expRev', header: 'Expected rev', align: 'right', render: (i) => <Money amount={i.expectedRevenue} className="text-[12.5px] text-ok" /> },
    { key: 'expProfit', header: 'Expected profit', align: 'right', render: (i) => <Money amount={i.expectedProfit} className="text-[12.5px] text-ok" /> },
    { key: 'actRev', header: 'Actual rev', align: 'right', render: (i) => <Money amount={i.actualizedRevenue} className="text-[12.5px] font-semibold" /> },
    { key: 'actProfit', header: 'Actual profit', align: 'right', render: (i) => <Money amount={i.actualizedProfit} className="text-[12.5px] font-semibold" /> },
    { key: 'limbo', header: 'Limbo', align: 'right', render: (i) => <span className="text-[12.5px] text-warn">{i.limboQuantity} · <Money amount={i.limboAmount} className="text-[12.5px] text-warn" /></span> },
  ];

  const stockColumns: DataTableColumn<any>[] = [
    { key: 'product', header: 'Product', width: '1.5fr', render: (i) => <span className="text-[13px] font-semibold truncate block">{i.productName}</span> },
    { key: 'remaining', header: 'Remaining', render: (i) => <span className={`text-[13px] font-bold ${safeNum(i.remainingStock) <= 5 ? 'text-err' : ''}`}>{safeNum(i.remainingStock)}</span> },
    { key: 'unitCost', header: 'Unit cost', render: (i) => <Money amount={safeNum(i.costPrice)} className="text-[12.5px] text-text-secondary" /> },
    { key: 'unitRetail', header: 'Unit retail', render: (i) => <Money amount={safeNum(i.sellingPrice)} className="text-[12.5px] text-text-secondary" /> },
    { key: 'stockRev', header: 'Stock revenue', align: 'right', render: (i) => <Money amount={safeNum(i.remainingStock) * safeNum(i.sellingPrice)} className="text-[12.5px] font-semibold text-tint" /> },
    { key: 'stockProfit', header: 'Stock profit', align: 'right', render: (i) => <Money amount={safeNum(i.remainingStock) * (safeNum(i.sellingPrice) - safeNum(i.costPrice))} className="text-[12.5px] font-semibold text-ok" /> },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Accounting</h1>
          <p className="text-text-secondary text-xs mt-1">
            Expected vs actual revenue reconciliation and remaining stock valuation.
          </p>
        </div>
        <Link
          to="/accounting/manual"
          className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-[13.5px] font-bold cursor-pointer hover:bg-tint transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Icon name="edit" size={14} />
          Manual quantities
        </Link>
      </div>

      {error ? (
        <div className="glass-surface rounded-2xl p-4 border border-error-val/30 text-sm font-medium text-error-val">
          Failed to load accounting analytics.
        </div>
      ) : (
        <>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {viewMode === 'reconciliation' ? (
              <>
                <StatCard label="Expected revenue" value={loading ? '—' : <Money amount={computedTotals.expectedRevenue} />} valueColor="var(--color-ok)" />
                <StatCard label="Actual revenue" value={loading ? '—' : <Money amount={computedTotals.actualizedRevenue} />} valueColor="var(--color-ok)" />
                <StatCard label="Limbo amount" value={loading ? '—' : <Money amount={computedTotals.limboAmount} />} valueColor="var(--color-warn)" />
                <StatCard label="Actual profit" value={loading ? '—' : <Money amount={computedTotals.actualizedProfit} />} />
              </>
            ) : (
              <>
                <StatCard label="Remaining stock qty" value={loading ? '—' : stockTotals.totalStock.toLocaleString()} />
                <StatCard label="Stock retail value" value={loading ? '—' : <Money amount={stockTotals.expectedStockRevenue} />} valueColor="var(--color-ok)" />
                <StatCard label="Stock cost value" value={loading ? '—' : <Money amount={stockTotals.expectedStockRevenue - stockTotals.expectedStockProfit} />} />
                <StatCard label="Potential stock profit" value={loading ? '—' : <Money amount={stockTotals.expectedStockProfit} />} valueColor="var(--color-ok)" />
              </>
            )}
          </div>

          <div className="flex gap-2">
            <PillButton active={viewMode === 'reconciliation'} onClick={() => setViewMode('reconciliation')}>Reconciliation</PillButton>
            <PillButton active={viewMode === 'stock'} onClick={() => setViewMode('stock')}>Stock valuation</PillButton>
          </div>

          <DataTable
            columns={viewMode === 'reconciliation' ? reconciliationColumns : stockColumns}
            rows={computedDetails}
            keyExtractor={(i) => i.productId}
            loading={loading}
            emptyMessage="No products to reconcile."
            minWidth={860}
          />
        </>
      )}
    </div>
  );
}
