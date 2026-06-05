import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { api } from '~/lib/api';
import type { RevenueDataPoint, TopProduct, TopCustomer, ProfitResponse } from '~/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly';

const periodLabels: Record<Period, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const revenuePeriods: { value: Period; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function meta() {
  return [
    { title: "Analytics Overview - RAD5 Café" },
    { name: "description", content: "Review revenues, top selling products, customer insights, and profit margins." },
  ];
}

function safeNum(n: unknown): number {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
}

function fmtCurrency(amount: unknown): string {
  return `₦${safeNum(amount).toLocaleString()}`;
}

export default function Analytics() {
  const [revenuePeriod, setRevenuePeriod] = useState<Period>('daily');
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [bestSelling, setBestSelling] = useState<TopProduct[]>([]);
  const [highestProfit, setHighestProfit] = useState<TopProduct[]>([]);
  const [mostActive, setMostActive] = useState<TopCustomer[]>([]);
  const [highestSpending, setHighestSpending] = useState<TopCustomer[]>([]);
  const [profitData, setProfitData] = useState<ProfitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = (period: Period) => {
    setLoading(true);
    setError(false);

    Promise.all([
      api.adminDashboard.analytics.revenue(period, 30),
      api.adminDashboard.analytics.topProducts(10),
      api.adminDashboard.analytics.customers(10),
      api.adminDashboard.analytics.profit(),
    ]).then(([revRes, prodRes, custRes, profitRes]) => {
      if (revRes.success && Array.isArray(revRes.data)) {
        setRevenueData(revRes.data);
      } else {
        setRevenueData([]);
      }

      if (prodRes.success && prodRes.data) {
        setBestSelling(prodRes.data.bestSelling ?? []);
        setHighestProfit(prodRes.data.highestProfit ?? []);
      } else {
        setBestSelling([]);
        setHighestProfit([]);
      }

      if (custRes.success && custRes.data) {
        setMostActive(custRes.data.mostActive ?? []);
        setHighestSpending(custRes.data.highestSpending ?? []);
      } else {
        setMostActive([]);
        setHighestSpending([]);
      }

      if (profitRes.success && profitRes.data) {
        setProfitData(profitRes.data);
      } else {
        setProfitData(null);
      }
    }).catch((err) => {
      console.warn('Could not load analytics:', err);
      setError(true);
      setRevenueData([]);
      setBestSelling([]);
      setHighestProfit([]);
      setMostActive([]);
      setHighestSpending([]);
      setProfitData(null);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(revenuePeriod);
  }, [revenuePeriod]);

  const chartData = revenueData.map((d) => ({
    period: d.period,
    revenue: safeNum(d.revenue),
    profit: safeNum(d.profit),
    label: (() => {
      try {
        const dt = new Date(d.period);
        if (!isNaN(dt.getTime())) {
          return dt.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
        }
      } catch {}
      return d.period;
    })(),
  }));

  return (
    <div className="flex flex-col gap-6 select-none max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Analytics Dashboard</h1>
        <p className="text-text-secondary text-xs mt-1">
          Review sales patterns, customer transactions, profit margins, and revenue charts.
        </p>
      </div>

      {error && (
        <Card className="p-4 text-center text-error-val text-sm font-semibold">
          Failed to load analytics data. Please try again.
        </Card>
      )}

      {/* Revenue Chart with period selector */}
      <Card padded={false}>
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            {periodLabels[revenuePeriod]} Revenue
          </h3>
          <div className="flex gap-1 bg-bg-element rounded-lg p-0.5">
            {revenuePeriods.map((p) => (
              <button
                key={p.value}
                onClick={() => setRevenuePeriod(p.value)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  revenuePeriod === p.value
                    ? 'bg-tint text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-52">
            <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : revenueData.length === 0 ? (
          <div className="flex justify-center items-center h-52 text-text-secondary text-xs">
            No {periodLabels[revenuePeriod].toLowerCase()} revenue data recorded yet.
          </div>
        ) : (
          <div className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  formatter={(value: any) => [fmtCurrency(Number(value)), '']}
                  labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}
                />
                <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Profit Summary */}
      <Card padded={false}>
        <div className="p-6 pb-4">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Profit Summary</h3>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : !profitData ? (
          <div className="text-center py-8 text-text-secondary text-xs px-6">
            No profit data available yet.
          </div>
        ) : (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-bg-element rounded-xl">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Today</span>
                <p className="text-lg font-extrabold text-success mt-1">{fmtCurrency(profitData.dailyProfit)}</p>
              </div>
              <div className="text-center p-3 bg-bg-element rounded-xl">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">This Month</span>
                <p className="text-lg font-extrabold text-success mt-1">{fmtCurrency(profitData.monthlyProfit)}</p>
              </div>
              <div className="text-center p-3 bg-bg-element rounded-xl">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Lifetime</span>
                <p className="text-lg font-extrabold text-tint mt-1">{fmtCurrency(profitData.lifetimeProfit)}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Top Products - Best Selling & Highest Profit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padded={false}>
          <div className="p-6 pb-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Best Selling</h3>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : bestSelling.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-xs px-6">
              No sales data yet.
            </div>
          ) : (
            <div className="px-6 pb-6 divide-y divide-border">
              {bestSelling.map((p, index) => (
                <div key={p.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-tint/15 text-tint font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-text-main">{p.name}</span>
                      <span className="text-xs text-text-secondary">{safeNum(p.totalSold)} units sold</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-text-main select-all">
                    {fmtCurrency(safeNum(p.sellingPrice) * safeNum(p.totalSold))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="p-6 pb-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Highest Profit</h3>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : highestProfit.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-xs px-6">
              No profit data yet.
            </div>
          ) : (
            <div className="px-6 pb-6 divide-y divide-border">
              {highestProfit.map((p, index) => (
                <div key={p.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-success/15 text-success font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-text-main">{p.name}</span>
                      <span className="text-xs text-text-secondary">{safeNum(p.totalSold)} sold · ₦{safeNum(p.profitPerUnit)}/unit</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-success select-all">
                    {fmtCurrency(safeNum(p.profitPerUnit) * safeNum(p.totalSold))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top Customers - Most Active & Highest Spending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padded={false}>
          <div className="p-6 pb-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Most Active</h3>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : mostActive.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-xs px-6">
              No customer activity yet.
            </div>
          ) : (
            <div className="px-6 pb-6 divide-y divide-border">
              {mostActive.map((c, index) => (
                <div key={c.userId} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-tint/15 text-tint font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-text-main">{c.fullName}</span>
                      <span className="text-xs text-text-secondary">{c.ordersCount} purchases</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-text-main select-all">
                    {fmtCurrency(c.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="p-6 pb-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Highest Spending</h3>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : highestSpending.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-xs px-6">
              No spending data yet.
            </div>
          ) : (
            <div className="px-6 pb-6 divide-y divide-border">
              {highestSpending.map((c, index) => (
                <div key={c.userId} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-success/15 text-success font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-text-main">{c.fullName}</span>
                      <span className="text-xs text-text-secondary">{c.ordersCount} purchases</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-success select-all">
                    {fmtCurrency(c.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
