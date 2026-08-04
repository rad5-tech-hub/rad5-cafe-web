import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PillButton } from '~/components/ui/pill-button';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { api } from '~/lib/api';

type AuditLog = {
  id: string;
  userId: string;
  actorName?: string;
  actorRole?: 'customer' | 'admin';
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ip: string;
  createdAt: string;
};

// Kept in sync with every `logAudit(...)` call site in cafe-api — see
// cafe-api/src/routes/{admin,adminDashboard}.ts, services/orders.ts,
// controllers/paymentsController.ts.
const actionLabels: Record<string, { label: string; tone: string }> = {
  admin_login: { label: 'Admin Login', tone: 'text-text-secondary' },
  order_placed: { label: 'Order Placed', tone: 'text-tint' },
  toggle_user_status: { label: 'User Status Toggled', tone: 'text-warn' },
  change_user_role: { label: 'User Role Changed', tone: 'text-warn' },
  add_admin_existing: { label: 'Promoted To Admin', tone: 'text-tint' },
  create_new_admin: { label: 'Admin Created', tone: 'text-tint' },
  reconcile_cash_order: { label: 'Cash Order Reconciled', tone: 'text-ok' },
  delete_cash_order: { label: 'Cash Order Deleted', tone: 'text-err' },
  approve_pin_change: { label: 'PIN Change Approved', tone: 'text-ok' },
  reject_pin_change: { label: 'PIN Change Rejected', tone: 'text-err' },
  add_product: { label: 'Product Added', tone: 'text-tint' },
  restock_product: { label: 'Product Restocked', tone: 'text-tint' },
  remove_stock: { label: 'Stock Removed', tone: 'text-warn' },
  create_category: { label: 'Category Created', tone: 'text-tint' },
  edit_category: { label: 'Category Edited', tone: 'text-tint' },
  delete_category: { label: 'Category Deleted', tone: 'text-err' },
  adjust_sale: { label: 'Sale Adjusted', tone: 'text-warn' },
  issue_order: { label: 'Order Issued', tone: 'text-ok' },
  wallet_transaction: { label: 'Wallet Adjustment', tone: 'text-ok' },
  add_expense: { label: 'Expense Added', tone: 'text-tint' },
  balance_out_stock: { label: 'Stock Balanced Out', tone: 'text-warn' },
  webhook_amount_mismatch: { label: 'Webhook Amount Mismatch', tone: 'text-err' },
  payment_finalized: { label: 'Payment Finalized', tone: 'text-ok' },
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
  const [activeAction, setActiveAction] = useState('');
  const [actorFilter, setActorFilter] = useState<{ userId: string; name: string } | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allActions, setAllActions] = useState<string[]>(Object.keys(actionLabels));

  const limit = 50;

  const fetchLogs = useCallback((pageNum: number) => {
    setLoading(true);
    api.notifications.auditLogs(pageNum, limit, {
      action: activeAction || undefined,
      userId: actorFilter?.userId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((res: any) => {
        if (res.success) {
          const data: any[] = res.logs ?? res.data ?? [];
          const normalized = data.map((item: any) => ({ ...item, createdAt: parseCreatedAt(item.createdAt) }));
          setLogs(normalized);
          setTotal(res.total ?? data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? data.length) / limit));

          const uniqueActions = Array.from(new Set(data.map((l: any) => l.action))) as string[];
          setAllActions((prev) => Array.from(new Set([...prev, ...uniqueActions])).sort());
        } else {
          setLogs([]);
        }
      })
      .catch((err: any) => {
        console.warn('Could not load audit logs:', err);
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [activeAction, actorFilter, startDate, endDate]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [fetchLogs]);

  useEffect(() => {
    if (page > 1) fetchLogs(page);
  }, [page]);

  const tabs = useMemo(() => {
    const dynamic = allActions.map((action) => ({ label: formatActionLabel(action), action }));
    return [{ label: 'All', action: '' }, ...dynamic];
  }, [allActions]);

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details || Object.keys(details).length === 0) return null;
    const entries = Object.entries(details);

    if (entries.length === 1 && entries[0][0] === 'reference') {
      return entries[0][1] as string;
    }

    return entries
      .filter(([key, val]) => key !== 'source' && key !== 'amountKobo' && key !== 'ip' && key !== 'timestamp' && val !== undefined)
      .map(([key, val]) => {
        if (key === 'amount') return `Amount: ₦${Number(val).toLocaleString()}`;
        if (key === 'total') return `Total: ₦${Number(val).toLocaleString()}`;
        if (key === 'quantity') return `Qty: ${val}`;
        if (key === 'oldStatus') return `From: ${val}`;
        if (key === 'newStatus') return `To: ${val}`;
        if (key === 'receiptNumber') return `Receipt: ${val}`;
        if (key === 'transactionId') return `Txn: ${val}`;
        if (key === 'eventType') return `Event: ${val}`;
        if (key === 'customerName') return `Customer: ${val}`;
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
    {
      key: 'user', header: 'Actor', width: '1.1fr',
      render: (log) => (
        <button
          onClick={() => setActorFilter({ userId: log.userId, name: log.actorName || log.userId })}
          className="text-left cursor-pointer group"
          title="Filter to this actor's activity"
        >
          <div className="text-[12px] font-semibold truncate group-hover:text-tint transition-colors">
            {log.actorName || log.userId}
          </div>
          {log.actorRole && (
            <div className="text-[10px] text-text-secondary capitalize">{log.actorRole}</div>
          )}
        </button>
      ),
    },
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

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-border bg-bg-element text-text-main text-xs outline-none focus:border-tint"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-border bg-bg-element text-text-main text-xs outline-none focus:border-tint"
          />
        </label>
        {actorFilter && (
          <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-tint-a text-xs font-semibold text-tint">
            Actor: {actorFilter.name}
            <button onClick={() => setActorFilter(null)} className="cursor-pointer hover:opacity-70" title="Clear actor filter">✕</button>
          </span>
        )}
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-xs font-bold text-text-secondary hover:text-tint cursor-pointer"
          >
            Clear dates
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <PillButton key={tab.label} active={activeAction === tab.action} onClick={() => setActiveAction(tab.action)}>
            {tab.label}
          </PillButton>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={logs}
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
