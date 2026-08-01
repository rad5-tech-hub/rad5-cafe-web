import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PillButton } from '~/components/ui/pill-button';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
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

const actionLabels: Record<string, { label: string; tone: string }> = {
  wallet_transaction: { label: 'Wallet Tx', tone: 'text-ok' },
  payment_finalized: { label: 'Payment Finalized', tone: 'text-ok' },
  wallet_transfer: { label: 'Wallet Transfer', tone: 'text-tint' },
  order_placed: { label: 'Order Placed', tone: 'text-tint' },
  order_cancelled: { label: 'Order Cancelled', tone: 'text-err' },
  issue_order: { label: 'Issue Order', tone: 'text-tint' },
  adjust_sale: { label: 'Adjust Sale', tone: 'text-warn' },
  product_added: { label: 'Product Added', tone: 'text-tint' },
  product_updated: { label: 'Product Updated', tone: 'text-tint' },
  product_restocked: { label: 'Product Restocked', tone: 'text-tint' },
  restock_product: { label: 'Restock Product', tone: 'text-tint' },
  user_status_toggled: { label: 'User Status', tone: 'text-warn' },
  user_created: { label: 'User Created', tone: 'text-tint' },
  pin_changed: { label: 'PIN Changed', tone: 'text-warn' },
  admin_login: { label: 'Admin Login', tone: 'text-text-secondary' },
  category_created: { label: 'Category Created', tone: 'text-tint' },
  category_updated: { label: 'Category Updated', tone: 'text-tint' },
  category_deleted: { label: 'Category Deleted', tone: 'text-err' },
  alert_acknowledged: { label: 'Alert Ack', tone: 'text-text-secondary' },
  refund_processed: { label: 'Refund', tone: 'text-err' },
  webhook_received: { label: 'Webhook Received', tone: 'text-text-secondary' },
};

function formatActionLabel(action: string): string {
  return actionLabels[action]?.label ?? action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ActionChip({ action }: { action: string }) {
  const config = actionLabels[action] ?? { label: formatActionLabel(action), tone: 'text-tint' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-tint-a ${config.tone}`}>{config.label}</span>;
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
          const normalized = data.map((item: any) => ({ ...item, createdAt: parseCreatedAt(item.createdAt) }));
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
    const dynamic = allActions.map((action) => ({ label: formatActionLabel(action), action }));
    return [{ label: 'All', action: '' }, ...dynamic];
  }, [allActions]);

  const filteredLogs = activeTab === 'All' ? logs : logs.filter((log) => formatActionLabel(log.action) === activeTab);

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

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'action', header: 'Action', width: '1.3fr',
      render: (log) => (
        <div className="flex flex-col gap-1 items-start">
          <ActionChip action={log.action} />
          <span className="text-[10px] text-text-secondary">{log.resource}{log.resourceId && ` · ${log.resourceId}`}</span>
        </div>
      ),
    },
    {
      key: 'details', header: 'Details', width: '2fr',
      render: (log) => <span className="text-[12.5px] font-semibold break-words">{formatDetails(log.details) || '—'}</span>,
    },
    { key: 'user', header: 'User', render: (log) => <span className="text-[11.5px] text-text-secondary truncate block">{log.userId}</span> },
    {
      key: 'when', header: 'When', align: 'right',
      render: (log) => <span className="text-[11.5px] text-text-secondary">{new Date(log.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Audit logs</h1>
          <p className="text-text-secondary text-xs mt-1">{total} log entries · Page {page} of {totalPages}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <PillButton key={tab.label} active={activeTab === tab.label} onClick={() => setActiveTab(tab.label)}>
            {tab.label}
          </PillButton>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filteredLogs}
        keyExtractor={(log) => log.id}
        loading={loading}
        emptyMessage="No audit logs found."
        minWidth={760}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PillButton>
        </div>
      )}
    </div>
  );
}
