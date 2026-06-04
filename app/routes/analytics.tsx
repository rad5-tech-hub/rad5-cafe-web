import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { api } from '~/lib/api';



export function meta() {
  return [
    { title: "Analytics Overview - RAD5 Café" },
    { name: "description", content: "Review weekly revenues, top selling products and customers." },
  ];
}

export default function Analytics() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.adminDashboard.analytics.revenue('weekly', 7),
      api.adminDashboard.analytics.topProducts(5),
      api.adminDashboard.analytics.customers(5)
    ]).then(([revRes, prodRes, custRes]) => {
      if (revRes.success && Array.isArray(revRes.data)) {
        setRevenueData(revRes.data.map((r: any) => ({
          label: r.label ?? r.day ?? r.period ?? '',
          amount: r.revenue ?? r.amount ?? 0
        })));
      }
      if (prodRes.success && prodRes.data) {
        const list = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data.bestSelling || prodRes.data.highestProfit || [];
        setProductsList(list.map((p: any) => ({
          name: p.name ?? 'Product',
          sold: p.sold ?? p.totalSold ?? p.quantity ?? 0,
          revenue: p.revenue ?? p.totalRevenue ?? 0
        })));
      }
      if (custRes.success && custRes.data) {
        const list = Array.isArray(custRes.data)
          ? custRes.data
          : custRes.data.mostActive || custRes.data.highestSpending || [];
        setCustomersList(list.map((c: any) => ({
          name: c.fullName ?? c.name ?? c.email ?? 'Customer',
          total: c.totalSpent ?? c.total ?? 0,
          transactions: c.ordersCount ?? c.transactions ?? 0
        })));
      }
    }).catch((err) => {
      console.warn('Could not load live analytics, using fallback mock charts.', err);
    }).finally(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(...revenueData.map((d) => d.amount), 1);

  return (
    <div className="flex flex-col gap-6 select-none max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Analytics Dashboard</h1>
        <p className="text-text-secondary text-xs mt-1">
          Review sales patterns, customer transactions, and weekly charts.
        </p>
      </div>

      {/* Weekly Revenue Chart Card */}
      <Card className="flex flex-col gap-6">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider pl-1">Weekly Revenue</h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : revenueData.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-text-secondary text-xs">
            No weekly revenue data recorded yet.
          </div>
        ) : (
          /* Visual Bar Graph */
          <div className="flex items-end justify-between h-48 px-2 pt-6">
            {revenueData.map((day) => {
              const barHeight = (day.amount / maxRevenue) * 100;
              return (
                <div key={day.label} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[10px] font-bold text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-all">
                    ₦{(day.amount / 1000).toFixed(0)}k
                  </span>
                  <div
                    className="w-8 bg-tint rounded-t-md hover:opacity-90 transition-all duration-300 transform scale-y-0 animate-scale-up"
                    style={{
                      height: `${barHeight}%`,
                      transformOrigin: 'bottom',
                      animationFillMode: 'forwards',
                    }}
                  />
                  <span className="text-xs font-semibold text-text-secondary">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products Card */}
        <Card className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider pl-1">Top Selling Products</h3>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : productsList.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-xs">
              No product analytics available.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {productsList.map((p, index) => (
                <div key={p.name} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-tint/15 text-tint font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-text-main">{p.name}</span>
                      <span className="text-xs text-text-secondary">{p.sold} units sold</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-text-main select-all">
                    ₦{p.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Customers Card */}
        <Card className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider pl-1">Most Active Customers</h3>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : customersList.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-xs">
              No customer analytics available.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {customersList.map((c, index) => (
                <div key={c.name} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-success/15 text-success font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-text-main">{c.name}</span>
                      <span className="text-xs text-text-secondary">{c.transactions} purchases</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-text-main select-all">
                    ₦{c.total.toLocaleString()}
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
