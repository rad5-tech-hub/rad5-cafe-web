import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { api } from '~/lib/api';

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ip: string;
  createdAt: string;
};

const actionLabels: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  wallet_transaction: { label: 'Wallet Tx', variant: 'success' },
  payment_finalized: { label: 'Payment Finalized', variant: 'success' },
  wallet_transfer: { label: 'Wallet Transfer', variant: 'info' },
  order_placed: { label: 'Order Placed', variant: 'info' },
  order_cancelled: { label: 'Order Cancelled', variant: 'error' },
  product_added: { label: 'Product Added', variant: 'info' },
  product_updated: { label: 'Product Updated', variant: 'info' },
  product_restocked: { label: 'Product Restocked', variant: 'info' },
  user_status_toggled: { label: 'User Status', variant: 'warning' },
  user_created: { label: 'User Created', variant: 'info' },
  pin_changed: { label: 'PIN Changed', variant: 'warning' },
  admin_login: { label: 'Admin Login', variant: 'default' },
  category_created: { label: 'Category Created', variant: 'info' },
  category_updated: { label: 'Category Updated', variant: 'info' },
  category_deleted: { label: 'Category Deleted', variant: 'error' },
  alert_acknowledged: { label: 'Alert Ack', variant: 'default' },
  refund_processed: { label: 'Refund', variant: 'error' },
};

const tabs: { label: string; actions: string[] }[] = [
  { label: 'All', actions: [] },
  { label: 'Wallet', actions: ['wallet_transaction', 'wallet_transfer', 'payment_finalized', 'refund_processed'] },
  { label: 'Orders', actions: ['order_placed', 'order_cancelled'] },
  { label: 'Products', actions: ['product_added', 'product_updated', 'product_restocked'] },
  { label: 'Users', actions: ['user_status_toggled', 'user_created', 'pin_changed'] },
  { label: 'Categories', actions: ['category_created', 'category_updated', 'category_deleted'] },
  { label: 'System', actions: ['admin_login', 'alert_acknowledged'] },
];

function getActionBadge(action: string) {
  const config = actionLabels[action] ?? { label: action.replace(/_/g, ' '), variant: 'default' as const };
  return <Badge label={config.label} variant={config.variant} />;
}

export function meta() {
  return [
    { title: "Audit Logs - RAD5 Café" },
    { name: "description", content: "Review all system activity, admin actions, and transaction logs." },
  ];
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const limit = 50;

  const fetchLogs = useCallback((pageNum: number) => {
    setLoading(true);
    api.notifications.auditLogs(pageNum, limit)
      .then((res: any) => {
        if (res.success) {
          const data = res.logs ?? res.data ?? [];
          setLogs(Array.isArray(data) ? data : []);
          setTotal(res.total ?? data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? data.length) / limit));
        } else {
          setLogs([]);
        }
      })
      .catch((err: any) => {
        console.warn('Could not load audit logs:', err);
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [activeTab, fetchLogs]);

  useEffect(() => {
    if (page > 1) fetchLogs(page);
  }, [page, fetchLogs]);

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details || Object.keys(details).length === 0) return null;
    const entries = Object.entries(details);
    if (entries.length === 1 && entries[0][0] === 'reference') {
      return entries[0][1] as string;
    }
    return entries
      .filter(([key]) => key !== 'source')
      .map(([key, val]) => {
        if (key === 'amount') return `₦${Number(val).toLocaleString()}`;
        if (key === 'amountKobo') return null;
        return `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`;
      })
      .filter(Boolean)
      .join(' · ');
  };

  const activeTabConfig = tabs.find((t) => t.label === activeTab) ?? tabs[0];
  const filteredLogs = activeTabConfig.actions.length === 0
    ? logs
    : logs.filter((log) => activeTabConfig.actions.includes(log.action));

  const changeTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Audit Logs</h1>
          <p className="text-text-secondary text-xs mt-1">
            {total} log entries · Page {page} of {totalPages}
          </p>
        </div>
        <Badge label={`${total} total`} variant="info" />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => changeTab(tab.label)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.label
                ? 'bg-tint text-white border-tint shadow-xs'
                : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card padded={false} className="overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm">
            No audit logs found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log) => {
              const details = formatDetails(log.details);
              return (
                <div key={log.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-4 hover:bg-bg-selected/10 transition-colors gap-3">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="text-[10px] text-text-secondary font-semibold">
                        {log.resource}
                        {log.resourceId && <span className="text-text-tertiary"> · {log.resourceId}</span>}
                      </span>
                    </div>
                    {details && (
                      <span className="text-xs text-text-main font-semibold select-all break-all">
                        {details}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-text-secondary flex-wrap">
                      <span>User: {log.userId}</span>
                      <span>{new Date(log.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs font-bold cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs font-bold text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs font-bold cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
