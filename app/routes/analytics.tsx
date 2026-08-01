import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { GlassPanel } from '~/components/ui/glass-panel';
import { StatCard } from '~/components/ui/stat-card';
import { PillButton } from '~/components/ui/pill-button';
import { Money } from '~/components/ui/money';
import { Icon } from '~/components/ui/icon';
import { api } from '~/lib/api';
import type { DailyAnalyticsResponse, WeeklyAnalyticsResponse, MonthlyAnalyticsResponse, CustomAnalyticsResponse } from '~/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type TabType = 'daily' | 'weekly' | 'monthly' | 'custom';

export function meta() {
  return [
    { title: "Analytics - RAD5 Café" },
    { name: "description", content: "Deep insights into revenues, products, customers and operations." },
  ];
}

function safeNum(n: unknown): number {
  const num = Number(n);
  return Number.isFinite(num) ? num : 0;
}

function fmtCurrency(amount: unknown): string {
  return `₦${safeNum(amount).toLocaleString()}`;
}

function getDisplayName(user: any): string {
  const name = user.fullName || '';
  if (!name || name.toLowerCase() === 'unkwun customer' || name.toLowerCase() === 'unknown customer' || name.toLowerCase() === 'unknown') {
    return user.email || name || 'Unknown Customer';
  }
  return name || 'Unknown Customer';
}

const tooltipStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: 12 };
const axisTick = { fontSize: 11, fill: 'var(--color-text-secondary)' };

function LoadingState() {
  return <div className="py-20 text-center"><Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={28} /></div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="glass-surface rounded-2xl p-4 border border-error-val/30 text-sm font-medium text-error-val text-center">{message}</div>;
}

function DailyTab() {
  const [data, setData] = useState<DailyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.daily()
      .then(res => { if (res.success && res.data) setData(res.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load daily analytics." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Total revenue" value={<Money amount={data.summary.totalRevenue} />} valueColor="var(--color-ok)" />
        <StatCard label="Total profit" value={<Money amount={data.summary.totalProfit} />} valueColor="var(--color-ok)" />
        <StatCard label="Sales count" value={data.summary.totalSalesCount} />
        <StatCard label="New customers" value={data.summary.newCustomers} valueColor="var(--color-warn)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassPanel radius="lg" className="md:col-span-2">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Revenue trend (today)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend.revenueByHour}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => [fmtCurrency(val), 'Revenue']} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel radius="lg" className="flex flex-col justify-center">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Highlights</h3>
          <div className="flex flex-col gap-5">
            {data.highlights.topSellingProduct && (
              <div>
                <span className="text-xs text-text-secondary block mb-1">Top selling product</span>
                <p className="font-extrabold text-lg">{data.highlights.topSellingProduct.name}</p>
                <p className="text-xs text-ok font-semibold">{data.highlights.topSellingProduct.quantitySold} units sold ({fmtCurrency(data.highlights.topSellingProduct.revenue)})</p>
              </div>
            )}
            {data.highlights.highestMarginProduct && (
              <div>
                <span className="text-xs text-text-secondary block mb-1">Highest margin product</span>
                <p className="font-extrabold text-lg">{data.highlights.highestMarginProduct.name}</p>
                <p className="text-xs text-tint font-semibold">{data.highlights.highestMarginProduct.marginPercent.toFixed(1)}% margin</p>
              </div>
            )}
            <div>
              <span className="text-xs text-text-secondary block mb-1">Busiest hour</span>
              <p className="font-extrabold text-lg">{data.trend.busiestHour || 'N/A'}</p>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function WeeklyTab() {
  const [data, setData] = useState<WeeklyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.weekly()
      .then(res => { if (res.success && res.data) setData(res.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load weekly analytics." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Total revenue" value={<Money amount={data.summary.totalRevenue} />} valueColor="var(--color-ok)" />
        <StatCard label="Total profit" value={<Money amount={data.summary.totalProfit} />} valueColor="var(--color-ok)" />
        <StatCard label="Sales count" value={data.summary.totalSalesCount} />
        <StatCard label="New customers" value={data.summary.newCustomers} valueColor="var(--color-warn)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassPanel radius="lg" className="md:col-span-2">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Revenue trend (last 7 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-NG', { weekday: 'short' })} tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [fmtCurrency(val), 'Revenue']}
                  labelFormatter={d => new Date(d).toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel radius="lg">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Highlights</h3>
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-xs text-text-secondary block mb-1">Top selling product</span>
              <p className="font-extrabold text-lg">{data.highlights.topSellingProduct.name}</p>
              <p className="text-xs text-ok font-semibold">{data.highlights.topSellingProduct.quantitySold} units sold ({fmtCurrency(data.highlights.topSellingProduct.revenue)})</p>
            </div>
            <div>
              <span className="text-xs text-text-secondary block mb-1">Highest margin product</span>
              <p className="font-extrabold text-lg">{data.highlights.highestMarginProduct.name}</p>
              <p className="text-xs text-tint font-semibold">{data.highlights.highestMarginProduct.marginPercent}% margin</p>
            </div>
            <div>
              <span className="text-xs text-text-secondary block mb-1">Busiest day</span>
              <p className="font-extrabold text-lg">{data.trend.busiestDay}</p>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function MonthlyTab() {
  const [data, setData] = useState<MonthlyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.monthly()
      .then(res => { if (res.success && res.data) setData(res.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load monthly analytics." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Total revenue" value={<Money amount={data.summary.totalRevenue} />} valueColor="var(--color-ok)" />
        <StatCard label="Total profit" value={<Money amount={data.summary.totalProfit} />} valueColor="var(--color-ok)" />
        <StatCard label="Sales count" value={data.summary.totalSalesCount} />
        <StatCard label="New customers" value={data.summary.newCustomers} valueColor="var(--color-warn)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassPanel radius="lg" className="md:col-span-2">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Revenue & profit by week</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend.revenueByWeek}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any, name: any) => [fmtCurrency(val), name === 'revenue' ? 'Revenue' : 'Profit']} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="profit" fill="var(--color-ok)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel radius="lg">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Top categories</h3>
          <div className="flex flex-col gap-4">
            {data.highlights.topCategories.map(cat => (
              <div key={cat.categoryName} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-sm">{cat.categoryName}</span>
                  <span className="text-xs text-text-secondary block">{cat.percentageOfTotal}% of total</span>
                </div>
                <Money amount={cat.revenue} className="text-sm font-extrabold text-ok" />
              </div>
            ))}
          </div>

          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mt-7 mb-3">Top spender</h3>
          <div>
            <p className="font-extrabold text-lg">{getDisplayName(data.highlights.topSpender)}</p>
            <p className="text-xs text-text-secondary font-semibold">{data.highlights.topSpender.orderCount} orders · <span className="text-tint">{fmtCurrency(data.highlights.topSpender.totalSpent)}</span></p>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function CustomTab() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<CustomAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(false);
    setHasSearched(true);

    api.adminDashboard.analytics.custom(startDate, endDate)
      .then(res => { if (res.success && res.data) setData(res.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel radius="lg">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3.5 items-end">
          <div className="flex-1 w-full">
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Start date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
              className="w-full glass-chip border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-tint transition-colors" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">End date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required
              className="w-full glass-chip border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-tint transition-colors" />
          </div>
          <button type="submit" disabled={loading} className="w-full md:w-auto whitespace-nowrap px-5 py-2.5 rounded-xl border-none bg-tint-dark text-white text-sm font-bold cursor-pointer hover:bg-tint disabled:opacity-50 transition-colors">
            {loading ? 'Analyzing…' : 'Generate insights'}
          </button>
        </form>
      </GlassPanel>

      {!hasSearched && !loading && (
        <div className="py-16 text-center text-text-secondary text-sm">Select a date range to generate custom insights.</div>
      )}

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message="Failed to load custom analytics." />}

      {data && !loading && (
        <div className="flex flex-col gap-7">
          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Financials & wallet health</h2>
            <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <StatCard label="Total revenue" value={<Money amount={data.financials.totalRevenue} />} valueColor="var(--color-ok)" />
              <StatCard label="Gross profit" value={<Money amount={data.financials.grossProfit} />} valueColor="var(--color-ok)" />
              <StatCard label="Profit margin" value={`${data.financials.profitMarginPercent}%`} valueColor="var(--color-ok)" />
              <StatCard label="Avg order value" value={<Money amount={data.financials.averageOrderValue} />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <GlassPanel radius="lg" className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Outstanding liability</h3>
                  <p className="text-xs text-text-secondary">Money sitting in user wallets</p>
                </div>
                <Money amount={data.financials.walletHealth.totalOutstandingLiability} className="text-xl font-extrabold text-err" />
              </GlassPanel>

              <GlassPanel radius="lg" className="flex items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Payments by method</h3>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-tint" /> Wallet</span><Money amount={data.financials.paymentsByMethod.wallet} className="font-bold" /></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-ok)' }} /> Cash</span><Money amount={data.financials.paymentsByMethod.cash} className="font-bold" /></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-warn)' }} /> Card</span><Money amount={data.financials.paymentsByMethod.card} className="font-bold" /></div>
                  </div>
                </div>
                <div className="w-24 h-24 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Wallet', value: data.financials.paymentsByMethod.wallet },
                          { name: 'Cash', value: data.financials.paymentsByMethod.cash },
                          { name: 'Card', value: data.financials.paymentsByMethod.card },
                        ]}
                        innerRadius={25} outerRadius={40} dataKey="value" stroke="none"
                      >
                        <Cell fill="var(--color-tint)" />
                        <Cell fill="var(--color-ok)" />
                        <Cell fill="var(--color-warn)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassPanel>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <GlassPanel radius="lg">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Busiest hours</h2>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.operations.busiestHours}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="orderCount" fill="var(--color-tint)" radius={[2, 2, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel radius="lg">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Busiest days</h2>
              <div className="flex flex-col gap-2.5">
                {data.operations.busiestDays.map(d => (
                  <div key={d.day} className="flex justify-between items-center p-3 rounded-xl bg-tint-a">
                    <span className="font-bold">{d.day}</span>
                    <Money amount={d.revenue} className="font-extrabold text-ok" />
                  </div>
                ))}
              </div>
            </GlassPanel>
          </section>

          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Product intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <GlassPanel radius="lg">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3.5">Frequently bought together</h3>
                <div className="flex flex-col gap-3.5">
                  {data.products.frequentlyBoughtTogether.map((pair, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-border last:border-0 pb-3 last:pb-0">
                      <span className="font-bold text-sm">{pair.pair.join(' + ')}</span>
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>{pair.timesBoughtTogether} times</span>
                        <Money amount={pair.pairRevenue} className="text-ok font-semibold" />
                      </div>
                    </div>
                  ))}
                  {data.products.frequentlyBoughtTogether.length === 0 && <span className="text-xs text-text-secondary">Not enough data.</span>}
                </div>
              </GlassPanel>

              <GlassPanel radius="lg">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3.5">Highest margin products</h3>
                <div className="flex flex-col gap-3">
                  {data.products.highestMarginProducts.map(p => (
                    <div key={p.name} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-[10px] text-text-secondary">{p.quantitySold} sold</span>
                      </div>
                      <span className="text-sm font-extrabold text-tint">{p.marginPercent}%</span>
                    </div>
                  ))}
                  {data.products.highestMarginProducts.length === 0 && <span className="text-xs text-text-secondary">Not enough data.</span>}
                </div>
              </GlassPanel>

              <GlassPanel radius="lg" className="border-error-val/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <h3 className="text-xs font-bold text-err uppercase tracking-wider mb-3.5">Dead stock warning</h3>
                <div className="flex flex-col gap-3">
                  {data.products.deadStock.map(p => (
                    <div key={p.name} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-[10px] text-text-secondary">Current stock: {p.currentStock}</span>
                      </div>
                      <span className="text-xs font-bold text-err">{p.daysSinceLastSale} days inactive</span>
                    </div>
                  ))}
                  {data.products.deadStock.length === 0 && <span className="text-xs text-text-secondary">No dead stock detected.</span>}
                </div>
              </GlassPanel>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Customer retention</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-3.5">
              <StatCard label="Total active" value={data.customers.totalActive} />
              <StatCard label="Avg visits/customer" value={data.customers.retentionMetrics.averageVisitsPerCustomer} />
              <StatCard label="Customer LTV" value={<Money amount={data.customers.retentionMetrics.customerLifetimeValueAvg} />} valueColor="var(--color-ok)" />
              <GlassPanel radius="lg" className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <span className="text-xl font-extrabold text-ok block">{data.customers.newVsReturning.newCustomers}</span>
                  <span className="text-[10px] uppercase font-bold text-text-secondary">New</span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-extrabold text-tint block">{data.customers.newVsReturning.returningCustomers}</span>
                  <span className="text-[10px] uppercase font-bold text-text-secondary">Returning</span>
                </div>
              </GlassPanel>
            </div>

            <GlassPanel radius="lg">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3.5">Top spenders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.customers.topSpenders.map((c, i) => (
                  <div key={c.userId} className="flex items-center gap-3 p-3 rounded-xl bg-tint-a">
                    <div className="w-8 h-8 rounded-full bg-tint-b text-tint flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{getDisplayName(c)}</p>
                      <p className="text-xs text-text-secondary">{c.orderCount} orders</p>
                    </div>
                    <Money amount={c.totalSpent} className="font-extrabold text-ok flex-shrink-0" />
                  </div>
                ))}
              </div>
            </GlassPanel>
          </section>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const location = useLocation();
  const defaultTab = (location.state as any)?.tab || 'daily';
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1>
        <p className="text-text-secondary text-xs mt-1">
          Sales patterns, customer behaviour, profit margins and deep operational insights.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['daily', 'weekly', 'monthly', 'custom'] as TabType[]).map((tab) => (
          <PillButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} className="capitalize">
            {tab}
          </PillButton>
        ))}
      </div>

      {activeTab === 'daily' && <DailyTab />}
      {activeTab === 'weekly' && <WeeklyTab />}
      {activeTab === 'monthly' && <MonthlyTab />}
      {activeTab === 'custom' && <CustomTab />}
    </div>
  );
}
