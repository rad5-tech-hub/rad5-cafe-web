import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { api } from '~/lib/api';
import type { DailyAnalyticsResponse, WeeklyAnalyticsResponse, MonthlyAnalyticsResponse, CustomAnalyticsResponse } from '~/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';

type TabType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'accounting';

export function meta() {
  return [
    { title: "Advanced Analytics - RAD5 Café" },
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

function DailyTab() {
  const [data, setData] = useState<DailyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.daily()
      .then(res => {
        if (res.success && res.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} /></div>;
  if (error || !data) return <div className="py-20 text-center text-error-val font-semibold">Failed to load daily analytics.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
        <StatCard label="Total Revenue" value={fmtCurrency(data.summary.totalRevenue)} icon="dollar" variant="success" />
        <StatCard label="Total Profit" value={fmtCurrency(data.summary.totalProfit)} icon="trending-up" variant="success" />
        <StatCard label="Sales Count" value={`${data.summary.totalSalesCount}`} icon="cart" />
        <StatCard label="New Customers" value={`${data.summary.newCustomers}`} icon="user" variant="warning" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <div className="p-5 border-b border-border mb-4">
            <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider">Revenue Trend (Today)</h3>
          </div>
          <div className="px-4 pb-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend.revenueByHour}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any) => [fmtCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <div className="flex flex-col gap-6">
          <Card className="flex-1 flex flex-col justify-center p-6">
            <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Highlights</h3>
            <div className="flex flex-col gap-5">
              {data.highlights.topSellingProduct ? (
                <div>
                  <span className="text-xs text-text-secondary block mb-1">Top Selling Product</span>
                  <p className="font-extrabold text-text-main text-lg">{data.highlights.topSellingProduct.name}</p>
                  <p className="text-xs text-success font-semibold">{data.highlights.topSellingProduct.quantitySold} units sold ({fmtCurrency(data.highlights.topSellingProduct.revenue)})</p>
                </div>
              ) : null}
              {data.highlights.highestMarginProduct ? (
                <div>
                  <span className="text-xs text-text-secondary block mb-1">Highest Margin Product</span>
                  <p className="font-extrabold text-text-main text-lg">{data.highlights.highestMarginProduct.name}</p>
                  <p className="text-xs text-tint font-semibold">{data.highlights.highestMarginProduct.marginPercent.toFixed(1)}% margin</p>
                </div>
              ) : null}
              <div>
                <span className="text-xs text-text-secondary block mb-1">Busiest Hour</span>
                <p className="font-extrabold text-text-main text-lg">{data.trend.busiestHour || 'N/A'}</p>
              </div>
            </div>
          </Card>
        </div>
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
      .then(res => {
        if (res.success && res.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} /></div>;
  if (error || !data) return <div className="py-20 text-center text-error-val font-semibold">Failed to load weekly analytics.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <StatCard label="Total Revenue" value={fmtCurrency(data.summary.totalRevenue)} icon="dollar" variant="success" />
        <StatCard label="Total Profit" value={fmtCurrency(data.summary.totalProfit)} icon="trending-up" variant="success" />
        <StatCard label="Sales Count" value={`${data.summary.totalSalesCount}`} icon="cart" />
        <StatCard label="New Customers" value={`${data.summary.newCustomers}`} icon="user" variant="warning" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <div className="p-5 border-b border-border mb-4">
            <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider">Revenue Trend (Last 7 Days)</h3>
          </div>
          <div className="px-4 pb-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-NG', { weekday: 'short' })} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any) => [fmtCurrency(val), 'Revenue']}
                  labelFormatter={d => new Date(d).toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}
                  contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <div className="flex flex-col gap-6">
          <Card className="flex-1 flex flex-col justify-center p-6">
            <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Highlights</h3>
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-xs text-text-secondary block mb-1">Top Selling Product</span>
                <p className="font-extrabold text-text-main text-lg">{data.highlights.topSellingProduct.name}</p>
                <p className="text-xs text-success font-semibold">{data.highlights.topSellingProduct.quantitySold} units sold ({fmtCurrency(data.highlights.topSellingProduct.revenue)})</p>
              </div>
              <div>
                <span className="text-xs text-text-secondary block mb-1">Highest Margin Product</span>
                <p className="font-extrabold text-text-main text-lg">{data.highlights.highestMarginProduct.name}</p>
                <p className="text-xs text-tint font-semibold">{data.highlights.highestMarginProduct.marginPercent}% margin</p>
              </div>
              <div>
                <span className="text-xs text-text-secondary block mb-1">Busiest Day</span>
                <p className="font-extrabold text-text-main text-lg">{data.trend.busiestDay}</p>
              </div>
            </div>
          </Card>
        </div>
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
      .then(res => {
        if (res.success && res.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} /></div>;
  if (error || !data) return <div className="py-20 text-center text-error-val font-semibold">Failed to load monthly analytics.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <StatCard label="Total Revenue" value={fmtCurrency(data.summary.totalRevenue)} icon="dollar" variant="success" />
        <StatCard label="Total Profit" value={fmtCurrency(data.summary.totalProfit)} icon="trending-up" variant="success" />
        <StatCard label="Sales Count" value={`${data.summary.totalSalesCount}`} icon="cart" />
        <StatCard label="New Customers" value={`${data.summary.newCustomers}`} icon="user" variant="warning" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <div className="p-5 border-b border-border mb-4">
            <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider">Revenue & Profit By Week</h3>
          </div>
          <div className="px-4 pb-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend.revenueByWeek}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any, name: any) => [fmtCurrency(val), name === 'revenue' ? 'Revenue' : 'Profit']}
                  contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="profit" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex-1 p-6">
            <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Top Categories</h3>
            <div className="flex flex-col gap-4">
              {data.highlights.topCategories.map(cat => (
                <div key={cat.categoryName} className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-sm text-text-main">{cat.categoryName}</span>
                    <span className="text-xs text-text-secondary block">{cat.percentageOfTotal}% of total</span>
                  </div>
                  <span className="text-sm font-extrabold text-success">{fmtCurrency(cat.revenue)}</span>
                </div>
              ))}
            </div>
            
            <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mt-8 mb-4">Top Spender</h3>
            <div>
              <p className="font-extrabold text-text-main text-lg">{getDisplayName(data.highlights.topSpender)}</p>
              <p className="text-xs text-text-secondary font-semibold">{data.highlights.topSpender.orderCount} orders · <span className="text-tint">{fmtCurrency(data.highlights.topSpender.totalSpent)}</span></p>
            </div>
          </Card>
        </div>
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
      .then(res => {
        if (res.success && res.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="p-5">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="flex-1" />
          <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="flex-1" />
          <Button type="submit" disabled={loading} className="w-full md:w-auto whitespace-nowrap h-11">
            {loading ? 'Analyzing...' : 'Generate Deep Insights'}
          </Button>
        </form>
      </Card>

      {!hasSearched && !loading && (
        <div className="py-20 text-center text-text-secondary text-sm">
          Select a date range to generate deep custom insights.
        </div>
      )}

      {loading && <div className="py-20 text-center"><Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} /></div>}
      
      {error && !loading && <div className="py-10 text-center text-error-val font-semibold">Failed to load custom analytics.</div>}

      {data && !loading && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
          {/* Financials */}
          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Financials & Wallet Health</h2>
            <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <StatCard label="Total Revenue" value={fmtCurrency(data.financials.totalRevenue)} icon="dollar" variant="success" />
              <StatCard label="Gross Profit" value={fmtCurrency(data.financials.grossProfit)} icon="trending-up" variant="success" />
              <StatCard label="Profit Margin" value={`${data.financials.profitMarginPercent}%`} icon="chart-bar" variant="success" />
              <StatCard label="Avg Order Value" value={fmtCurrency(data.financials.averageOrderValue)} icon="cart" />
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Outstanding Liability</h3>
                  <p className="text-xs text-text-secondary">Money sitting in user wallets</p>
                </div>
                <span className="text-2xl font-extrabold text-error-val tabular-nums">{fmtCurrency(data.financials.walletHealth.totalOutstandingLiability)}</span>
              </Card>

              <Card className="p-5 flex items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Payments By Method</h3>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-text-main flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tint" /> Wallet</span> <span className="font-bold text-text-main">{fmtCurrency(data.financials.paymentsByMethod.wallet)}</span></div>
                    <div className="flex justify-between"><span className="text-text-main flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success" /> Cash</span> <span className="font-bold text-text-main">{fmtCurrency(data.financials.paymentsByMethod.cash)}</span></div>
                    <div className="flex justify-between"><span className="text-text-main flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning" /> Card</span> <span className="font-bold text-text-main">{fmtCurrency(data.financials.paymentsByMethod.card)}</span></div>
                  </div>
                </div>
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Wallet', value: data.financials.paymentsByMethod.wallet },
                          { name: 'Cash', value: data.financials.paymentsByMethod.cash },
                          { name: 'Card', value: data.financials.paymentsByMethod.card },
                        ]}
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="var(--color-tint)" />
                        <Cell fill="var(--color-success)" />
                        <Cell fill="var(--color-warning)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* Operations */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Busiest Hours</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.operations.busiestHours}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 12 }} />
                    <Bar dataKey="orderCount" fill="var(--color-tint)" radius={[2, 2, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Busiest Days</h2>
              <div className="flex flex-col gap-3">
                {data.operations.busiestDays.map(d => (
                  <div key={d.day} className="flex justify-between items-center p-3 bg-bg-element rounded-lg">
                    <span className="font-bold text-text-main">{d.day}</span>
                    <span className="text-success font-extrabold tabular-nums">{fmtCurrency(d.revenue)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Products */}
          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Product Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Frequently Bought Together</h3>
                <div className="flex flex-col gap-4">
                  {data.products.frequentlyBoughtTogether.map((pair, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-border last:border-0 pb-3 last:pb-0">
                      <span className="font-bold text-sm text-text-main">{pair.pair.join(' + ')}</span>
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>{pair.timesBoughtTogether} times</span>
                        <span className="text-success font-semibold">{fmtCurrency(pair.pairRevenue)}</span>
                      </div>
                    </div>
                  ))}
                  {data.products.frequentlyBoughtTogether.length === 0 && (
                    <span className="text-xs text-text-secondary">Not enough data.</span>
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Highest Margin Products</h3>
                <div className="flex flex-col gap-3">
                  {data.products.highestMarginProducts.map(p => (
                    <div key={p.name} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-text-main">{p.name}</span>
                        <span className="text-[10px] text-text-secondary">{p.quantitySold} sold</span>
                      </div>
                      <span className="text-sm font-extrabold text-tint">{p.marginPercent}%</span>
                    </div>
                  ))}
                  {data.products.highestMarginProducts.length === 0 && (
                    <span className="text-xs text-text-secondary">Not enough data.</span>
                  )}
                </div>
              </Card>

              <Card className="p-5 bg-error-val/5 border-error-val/20">
                <h3 className="text-xs font-bold text-error-val uppercase tracking-wider mb-4">Dead Stock Warning</h3>
                <div className="flex flex-col gap-3">
                  {data.products.deadStock.map(p => (
                    <div key={p.name} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-text-main">{p.name}</span>
                        <span className="text-[10px] text-text-secondary">Current Stock: {p.currentStock}</span>
                      </div>
                      <span className="text-xs font-bold text-error-val">{p.daysSinceLastSale} days inactive</span>
                    </div>
                  ))}
                  {data.products.deadStock.length === 0 && (
                    <span className="text-xs text-text-secondary">No dead stock detected.</span>
                  )}
                </div>
              </Card>
            </div>
          </section>

          {/* Customers */}
          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Customer Retention</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatCard label="Total Active" value={`${data.customers.totalActive}`} icon="account-group" />
              <StatCard label="Avg Visits/Customer" value={`${data.customers.retentionMetrics.averageVisitsPerCustomer}`} icon="sync" />
              <StatCard label="Customer LTV" value={fmtCurrency(data.customers.retentionMetrics.customerLifetimeValueAvg)} icon="dollar" variant="success" />
              <Card className="p-5 flex items-center justify-center gap-4 shadow-xs">
                <div className="text-center">
                  <span className="text-xl font-extrabold text-success block">{data.customers.newVsReturning.newCustomers}</span>
                  <span className="text-[10px] uppercase font-bold text-text-secondary">New</span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-extrabold text-tint block">{data.customers.newVsReturning.returningCustomers}</span>
                  <span className="text-[10px] uppercase font-bold text-text-secondary">Returning</span>
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Top Spenders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.customers.topSpenders.map((c, i) => (
                  <div key={c.userId} className="flex items-center gap-3 p-3 bg-bg-element rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-tint/20 text-tint flex items-center justify-center font-bold text-xs">{i+1}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-text-main">{getDisplayName(c)}</p>
                      <p className="text-xs text-text-secondary">{c.orderCount} orders</p>
                    </div>
                    <span className="font-extrabold text-success">{fmtCurrency(c.totalSpent)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

        </div>
      )}
    </div>
  );
}

function AccountingTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.accounting()
      .then(res => {
        if (res.success && res.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} /></div>;
  if (error || !data) return <div className="py-20 text-center text-error-val font-semibold">Failed to load accounting analytics.</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card padded={false} className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <StatCard label="Total Expected Rev" value={fmtCurrency(data.totals.expectedRevenue)} icon="dollar" variant="success" />
        <StatCard label="Total Actual Rev" value={fmtCurrency(data.totals.actualizedRevenue)} icon="trending-up" variant="success" />
        <StatCard label="Limbo Amount" value={fmtCurrency(data.totals.limboAmount)} icon="alert-circle" variant="warning" />
        <StatCard label="Actual Profit" value={fmtCurrency(data.totals.actualizedProfit)} icon="cash" />
      </Card>
      
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-element border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-text-secondary sticky left-0 bg-bg-element z-10">Product</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Qty Added</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Rev</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Profit</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Rev</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Profit</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Limbo Qty</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Limbo Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.details.map((item: any) => (
                <tr key={item.productId} className="hover:bg-bg-element/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-main sticky left-0 bg-card z-10">{item.productName}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{item.quantityAdded}</td>
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
        </div>
      </Card>
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Analytics Dashboard</h1>
        <p className="text-text-secondary text-xs mt-1">
          Review sales patterns, customer transactions, profit margins, and deep operational insights.
        </p>
      </div>

      <div className="flex gap-1 bg-bg-element rounded-lg p-1 w-max overflow-x-auto max-w-full">
        {(['daily', 'weekly', 'monthly', 'custom', 'accounting'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-tint text-white shadow-xs'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {tab} Analytics
          </button>
        ))}
      </div>

      {activeTab === 'daily' && <DailyTab />}
      {activeTab === 'weekly' && <WeeklyTab />}
      {activeTab === 'monthly' && <MonthlyTab />}
      {activeTab === 'custom' && <CustomTab />}
      {activeTab === 'accounting' && <AccountingTab />}
    </div>
  );
}
