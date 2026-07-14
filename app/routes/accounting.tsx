import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { api } from '~/lib/api';
import type { DailyAnalyticsResponse, WeeklyAnalyticsResponse, MonthlyAnalyticsResponse } from '~/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TabType = 'day' | 'week' | 'month' | 'products' | 'customers';

export function meta() {
  return [
    { title: "Accounting Analytics - RAD5 Café" },
    { name: "description", content: "Accounting view per day, week, month, product, and customer." },
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
  if (!name || name.toLowerCase() === 'unknown' || name.toLowerCase() === 'unkwun customer') {
    return user.email || 'Unknown Customer';
  }
  return name;
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
    <div className="group flex flex-row items-center gap-4 p-5 select-none hover:bg-bg-selected/30 transition-colors duration-300 w-full cursor-default border-border border rounded-xl bg-card">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${getColors()}`}>
        <Icon name={icon} size={22} />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-xs font-semibold text-text-secondary">{label}</span>
        <span className="text-xl font-extrabold text-text-main tabular-nums mt-0.5">{value}</span>
      </div>
    </div>
  );
}

function DayTab() {
  const [data, setData] = useState<DailyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.daily()
      .then(res => { if (res.success && res.data) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin text-tint" size={32} /></div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Daily Revenue" value={fmtCurrency(data.summary.totalRevenue)} icon="dollar" variant="success" />
        <StatCard label="Daily Profit" value={fmtCurrency(data.summary.totalProfit)} icon="trending-up" variant="success" />
        <StatCard label="Sales Today" value={`${data.summary.totalSalesCount}`} icon="cart" />
        <StatCard label="New Customers" value={`${data.summary.newCustomers}`} icon="user" variant="warning" />
      </div>
      <Card className="p-6">
        <h3 className="font-bold text-text-secondary uppercase text-xs mb-4">Revenue Trend (Today)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend.revenueByHour}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val: any) => [fmtCurrency(val), 'Revenue']} contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function WeekTab() {
  const [data, setData] = useState<WeeklyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.weekly()
      .then(res => { if (res.success && res.data) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin text-tint" size={32} /></div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Weekly Revenue" value={fmtCurrency(data.summary.totalRevenue)} icon="dollar" variant="success" />
        <StatCard label="Weekly Profit" value={fmtCurrency(data.summary.totalProfit)} icon="trending-up" variant="success" />
        <StatCard label="Sales This Week" value={`${data.summary.totalSalesCount}`} icon="cart" />
        <StatCard label="New Customers" value={`${data.summary.newCustomers}`} icon="user" variant="warning" />
      </div>
      <Card className="p-6">
        <h3 className="font-bold text-text-secondary uppercase text-xs mb-4">Revenue Trend (Last 7 Days)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-NG', { weekday: 'short' })} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val: any) => [fmtCurrency(val), 'Revenue']} contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function MonthTab() {
  const [data, setData] = useState<MonthlyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.monthly()
      .then(res => { if (res.success && res.data) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin text-tint" size={32} /></div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Monthly Revenue" value={fmtCurrency(data.summary.totalRevenue)} icon="dollar" variant="success" />
        <StatCard label="Monthly Profit" value={fmtCurrency(data.summary.totalProfit)} icon="trending-up" variant="success" />
        <StatCard label="Sales This Month" value={`${data.summary.totalSalesCount}`} icon="cart" />
        <StatCard label="New Customers" value={`${data.summary.newCustomers}`} icon="user" variant="warning" />
      </div>
      <Card className="p-6">
        <h3 className="font-bold text-text-secondary uppercase text-xs mb-4">Revenue & Profit By Week</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend.revenueByWeek}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val: any, name: any) => [fmtCurrency(val), name === 'revenue' ? 'Revenue' : 'Profit']} contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }} />
              <Bar dataKey="revenue" fill="var(--color-tint)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="profit" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function ProductsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.accounting()
      .then(res => { if (res.success && res.data) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin text-tint" size={32} /></div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-text-secondary uppercase text-xs">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-element border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-text-secondary">Product</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Qty Added</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Expected Rev</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Rev</th>
                <th className="px-4 py-3 font-semibold text-text-secondary text-right">Actual Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.details.map((item: any) => (
                <tr key={item.productId} className="hover:bg-bg-element/50">
                  <td className="px-4 py-3 font-medium text-text-main">{item.productName}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{item.quantityAdded}</td>
                  <td className="px-4 py-3 text-right text-tint">{fmtCurrency(item.expectedRevenue)}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmtCurrency(item.actualizedRevenue)}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmtCurrency(item.actualizedProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CustomersTab() {
  const [data, setData] = useState<DailyAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-using daily since it contains top spender / customers today
  // Alternatively we could fetch custom over a large range. We'll use weekly to get some data.
  const [weekly, setWeekly] = useState<WeeklyAnalyticsResponse | null>(null);

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.weekly()
      .then(res => { if (res.success && res.data) setWeekly(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center"><Icon name="sync" className="animate-spin text-tint" size={32} /></div>;
  if (!weekly) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <Card className="p-6">
        <h3 className="font-bold text-text-secondary uppercase text-xs mb-4">Customer Insights (This Week)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bg-element p-5 rounded-xl">
            <span className="text-text-secondary text-xs uppercase font-bold">New Customers</span>
            <p className="text-2xl font-extrabold mt-2">{weekly.summary.newCustomers}</p>
          </div>
          <div className="bg-bg-element p-5 rounded-xl">
            <span className="text-text-secondary text-xs uppercase font-bold">Total Sales</span>
            <p className="text-2xl font-extrabold mt-2">{weekly.summary.totalSalesCount}</p>
          </div>
        </div>
        
        <h3 className="font-bold text-text-secondary uppercase text-xs mt-8 mb-4">Notable Customers</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-bg-element/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-tint/20 text-tint flex items-center justify-center font-bold">1</div>
            <div className="flex-1">
              <p className="font-semibold text-text-main text-sm">Top Spender: {getDisplayName(weekly.highlights.topSpender)}</p>
              <p className="text-xs text-text-secondary">Highest spender this week</p>
            </div>
            <span className="font-extrabold text-success">{fmtCurrency(weekly.highlights.topSpender.totalSpent)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Accounting() {
  const [activeTab, setActiveTab] = useState<TabType>('day');

  return (
    <div className="flex flex-col gap-6 select-none max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Accounting Analytics</h1>
        <p className="text-text-secondary text-xs mt-1">
          Detailed accounting insights by day, week, month, product, and customer.
        </p>
      </div>

      <div className="flex gap-1 bg-bg-element rounded-lg p-1 w-max overflow-x-auto max-w-full border border-border">
        {(['day', 'week', 'month', 'products', 'customers'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-sm font-bold rounded-md transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-tint text-white shadow-xs'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'day' && <DayTab />}
      {activeTab === 'week' && <WeekTab />}
      {activeTab === 'month' && <MonthTab />}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'customers' && <CustomersTab />}
    </div>
  );
}
