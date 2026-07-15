import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { api } from '~/lib/api';
import { Link } from 'react-router';

export function meta() {
  return [
    { title: "Accounting Analytics & Reconciliation - RAD5 Café" },
    { name: "description", content: "Reconcile expected vs actual revenues and manage manual quantity overrides." },
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

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} />
        <p className="text-text-secondary text-sm mt-3">Loading accounting intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center text-error-val font-semibold">
        Failed to load accounting analytics.
      </div>
    );
  }

  const computedDetails = data.details.map((item: any) => {
    const manualQty = manualQuantities[item.productId];
    const hasManual = manualQty !== undefined && manualQty !== null && !isNaN(manualQty);
    const quantity = hasManual ? manualQty : item.quantityAdded;
    
    // Derived unit rates
    const sellingPrice = item.sellingPrice ?? (item.quantityAdded > 0 ? item.expectedRevenue / item.quantityAdded : 0);
    const costPrice = item.costPrice ?? (sellingPrice - (item.quantityAdded > 0 ? item.expectedProfit / item.quantityAdded : 0));

    const expectedRevenue = quantity * sellingPrice;
    const expectedProfit = quantity * (sellingPrice - costPrice);

    return {
      ...item,
      quantity,
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

  const stockTotals = computedDetails.reduce((acc: any, curr: any) => {
    const remaining = safeNum(curr.remainingStock);
    const sellPrice = safeNum(curr.sellingPrice);
    const cPrice = safeNum(curr.costPrice);
    acc.totalStock += remaining;
    acc.expectedStockRevenue += remaining * sellPrice;
    acc.expectedStockProfit += remaining * (sellPrice - cPrice);
    return acc;
  }, {
    totalStock: 0,
    expectedStockRevenue: 0,
    expectedStockProfit: 0
  });

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Accounting Analytics</h1>
        <p className="text-text-secondary text-xs mt-1">
          Detailed expected vs actual revenues and cash reconciliation.
        </p>
      </div>

      {viewMode === 'reconciliation' ? (
        <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <StatCard label="Total Expected Rev" value={fmtCurrency(computedTotals.expectedRevenue)} icon="dollar" variant="success" />
          <StatCard label="Total Actual Rev" value={fmtCurrency(computedTotals.actualizedRevenue)} icon="trending-up" variant="success" />
          <StatCard label="Limbo Amount" value={fmtCurrency(computedTotals.limboAmount)} icon="alert-triangle" variant="warning" />
          <StatCard label="Actual Profit" value={fmtCurrency(computedTotals.actualizedProfit)} icon="cash" />
        </Card>
      ) : (
        <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <StatCard label="Remaining Stock Qty" value={stockTotals.totalStock.toLocaleString()} icon="shopping-bag" />
          <StatCard label="Stock Retail Value" value={fmtCurrency(stockTotals.expectedStockRevenue)} icon="dollar" variant="success" />
          <StatCard label="Stock Cost Value" value={fmtCurrency(stockTotals.expectedStockRevenue - stockTotals.expectedStockProfit)} icon="trending-up" />
          <StatCard label="Potential Stock Profit" value={fmtCurrency(stockTotals.expectedStockProfit)} icon="cash" variant="success" />
        </Card>
      )}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-transparent border-b border-border pb-3">
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('reconciliation')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
              viewMode === 'reconciliation'
                ? 'bg-tint text-white border-tint shadow-xs'
                : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
            }`}
          >
            Expected vs Actual Reconciliation
          </button>
          <button 
            onClick={() => setViewMode('stock')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
              viewMode === 'stock'
                ? 'bg-tint text-white border-tint shadow-xs'
                : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
            }`}
          >
            Remaining Stock Valuation
          </button>
        </div>
        <Link 
          to="/accounting/manual"
          className="flex items-center gap-2 bg-tint hover:bg-tint/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer self-start sm:self-auto"
        >
          <Icon name="edit" size={14} />
          <span>Manual Quantities</span>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'reconciliation' ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-element border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-text-secondary sticky left-0 bg-bg-element z-10">Product</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Qty Added</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right text-tint">Manual Qty</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Rev</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Profit</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Rev</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Profit</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Limbo Qty</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Limbo Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {computedDetails.map((item: any) => (
                  <tr key={item.productId} className="hover:bg-bg-element/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-main sticky left-0 bg-card z-10">{item.productName}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{item.quantityAdded}</td>
                    <td className={`px-4 py-3 text-right font-bold transition-all duration-200 ${item.hasManual ? 'text-tint bg-tint/5 scale-102' : 'text-text-secondary/30 font-normal'}`}>
                      {item.hasManual ? item.quantity : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-success">{fmtCurrency(item.expectedRevenue)}</td>
                    <td className="px-4 py-3 text-right text-success">{fmtCurrency(item.expectedProfit)}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-main">{fmtCurrency(item.actualizedRevenue)}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-main">{fmtCurrency(item.actualizedProfit)}</td>
                    <td className="px-4 py-3 text-right text-warning">{item.limboQuantity}</td>
                    <td className="px-4 py-3 text-right text-warning">{fmtCurrency(item.limboAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-element border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-text-secondary sticky left-0 bg-bg-element z-10">Product</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Remaining Stock</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Unit Cost</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Unit Retail</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Stock Rev</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary text-right text-success">Expected Stock Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {computedDetails.map((item: any) => {
                  const remaining = safeNum(item.remainingStock);
                  const cost = safeNum(item.costPrice);
                  const retail = safeNum(item.sellingPrice);
                  const stockRev = remaining * retail;
                  const stockProfit = remaining * (retail - cost);
                  
                  return (
                    <tr key={item.productId} className="hover:bg-bg-element/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-main sticky left-0 bg-card z-10">{item.productName}</td>
                      <td className={`px-4 py-3 text-right font-bold ${remaining <= 5 ? 'text-error-val' : 'text-text-main'}`}>
                        {remaining}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">{fmtCurrency(cost)}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{fmtCurrency(retail)}</td>
                      <td className="px-4 py-3 text-right text-tint font-semibold">{fmtCurrency(stockRev)}</td>
                      <td className="px-4 py-3 text-right text-success font-semibold">{fmtCurrency(stockProfit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
