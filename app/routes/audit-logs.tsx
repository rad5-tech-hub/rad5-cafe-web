import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  issue_order: { label: 'Issue Order', variant: 'info' },
  adjust_sale: { label: 'Adjust Sale', variant: 'warning' },
  product_added: { label: 'Product Added', variant: 'info' },
  product_updated: { label: 'Product Updated', variant: 'info' },
  product_restocked: { label: 'Product Restocked', variant: 'info' },
  restock_product: { label: 'Restock Product', variant: 'info' },
  user_status_toggled: { label: 'User Status', variant: 'warning' },
  user_created: { label: 'User Created', variant: 'info' },
  pin_changed: { label: 'PIN Changed', variant: 'warning' },
  admin_login: { label: 'Admin Login', variant: 'default' },
  category_created: { label: 'Category Created', variant: 'info' },
  category_updated: { label: 'Category Updated', variant: 'info' },
  category_deleted: { label: 'Category Deleted', variant: 'error' },
  alert_acknowledged: { label: 'Alert Ack', variant: 'default' },
  refund_processed: { label: 'Refund', variant: 'error' },
  webhook_received: { label: 'Webhook Received', variant: 'default' },
};

function formatActionLabel(action: string): string {
  return actionLabels[action]?.label ?? action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionBadge(action: string) {
  const config = actionLabels[action] ?? { label: formatActionLabel(action), variant: 'default' as const };
  return <Badge label={config.label} variant={config.variant} />;
}

function parseCreatedAt(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  if (val._seconds !== undefined) return new Date(val._seconds * 1000).toISOString();
  if (val.seconds !== undefined) return new Date(val.seconds * 1000).toISOString();
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  return new Date(val).toISOString();
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
  const [allActions, setAllActions] = useState<string[]>([]);

  const limit = 50;

  const fetchLogs = useCallback((pageNum: number) => {
    setLoading(true);
    api.notifications.auditLogs(pageNum, limit)
      .then((res: any) => {
        if (res.success) {
          const data: any[] = res.logs ?? res.data ?? [];
          const normalized = data.map((item: any) => ({
            ...item,
            createdAt: parseCreatedAt(item.createdAt),
          }));
          setLogs(normalized);
          setTotal(res.total ?? data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? data.length) / limit));

          const uniqueActions = Array.from(new Set(data.map((l: any) => l.action))) as string[];
          setAllActions((prev) => {
            const merged = new Set([...prev, ...uniqueActions]);
            return Array.from(merged).sort();
          });
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

  const tabs = useMemo(() => {
    const dynamic: { label: string; action: string }[] = allActions.map((action) => ({
      label: formatActionLabel(action),
      action,
    }));
    return [
      { label: 'All', action: '' },
      ...dynamic,
    ];
  }, [allActions]);

  const filteredLogs = activeTab === 'All'
    ? logs
    : logs.filter((log) => formatActionLabel(log.action) === activeTab);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
  };

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details || Object.keys(details).length === 0) return null;
    const entries = Object.entries(details);

    if (entries.length === 1 && entries[0][0] === 'reference') {
      return entries[0][1] as string;
    }

    return entries
      .filter(([key]) => key !== 'source' && key !== 'amountKobo' && key !== 'ip' && key !== 'timestamp')
      .map(([key, val]) => {
        if (key === 'amount') return `Amount: ₦${Number(val).toLocaleString()}`;
        if (key === 'total') return `Total: ₦${Number(val).toLocaleString()}`;
        if (key === 'quantity') return `Qty: ${val}`;
        if (key === 'oldStatus') return `From: ${val}`;
        if (key === 'newStatus') return `To: ${val}`;
        if (key === 'receiptNumber') return `Receipt: ${val}`;
        if (key === 'transactionId') return `Txn: ${val}`;
        if (key === 'eventType') return `Event: ${val}`;
        return `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`;
      })
      .filter(Boolean)
      .join(' · ');
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

      {/* Dynamic Action Tabs */}
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
