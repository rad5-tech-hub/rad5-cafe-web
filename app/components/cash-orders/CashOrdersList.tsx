import React, { useEffect, useState, useCallback } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { Icon } from '~/components/ui/icon';
import { IconButton } from '~/components/ui/icon-button';
import { Select } from '~/components/ui/select';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { ActionSheetModal } from '~/components/ui/action-sheet-modal';
import type { LimboOrder, User } from './types';

export function CashOrdersList({
  onNewCashOrder,
  onViewHistory
}: {
  onNewCashOrder: () => void;
  onViewHistory: () => void;
}) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [orders, setOrders] = useState<LimboOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const [selectedOrdersForReconciliation, setSelectedOrdersForReconciliation] = useState<LimboOrder[]>([]);
  const [selectedOrdersForDeletion, setSelectedOrdersForDeletion] = useState<LimboOrder[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deletePin, setDeletePin] = useState<string>('');
  const [checkedOrderIds, setCheckedOrderIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes] = await Promise.all([
        api.adminDashboard.orders.limbo(1, 100),
        api.admin.users.list(1, 1000)
      ]);

      if (ordersRes.success && ordersRes.orders) {
        setOrders(ordersRes.orders);
      } else {
        setOrders([]);
      }

      if (usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrdersForReconciliation.length === 0 || !selectedUserId) {
      showToast({ type: 'warning', title: 'Please select a user to map these orders to.' });
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    const confirmed = await showConfirm({
      title: 'Confirm reconciliation',
      message: `Are you sure you want to map ${selectedOrdersForReconciliation.length === 1 ? `order ${selectedOrdersForReconciliation[0].receiptNumber}` : `${selectedOrdersForReconciliation.length} orders`} to ${user.fullName} (${user.email})?`,
      confirmLabel: 'Reconcile',
    });
    if (!confirmed) return;

    setReconcilingId('processing');
    try {
      let successCount = 0;
      let errorCount = 0;
      for (const order of selectedOrdersForReconciliation) {
        const res = await api.adminDashboard.orders.reconcile(order.id, selectedUserId);
        if (res.success) successCount++; else errorCount++;
      }

      if (errorCount === 0) {
        showToast({ type: 'success', title: `${successCount} order(s) reconciled successfully` });
      } else {
        showToast({ type: 'warning', title: `${successCount} reconciled, ${errorCount} failed` });
      }

      setSelectedOrdersForReconciliation([]);
      setSelectedUserId('');
      setCheckedOrderIds([]);
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Reconciliation error', message: err.message });
    } finally {
      setReconcilingId(null);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrdersForDeletion.length === 0 || !deleteReason || !deletePin) {
      showToast({ type: 'warning', title: 'Please provide a reason and your PIN.' });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Confirm deletion',
      message: `Are you sure you want to delete ${selectedOrdersForDeletion.length === 1 ? `order ${selectedOrdersForDeletion[0].receiptNumber}` : `${selectedOrdersForDeletion.length} orders`}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    setReconcilingId('processing');
    try {
      let successCount = 0;
      let errorCount = 0;
      for (const order of selectedOrdersForDeletion) {
        const res = await api.adminDashboard.orders.delete(order.id, { reason: deleteReason, pin: deletePin });
        if (res.success) successCount++; else errorCount++;
      }

      if (errorCount === 0) {
        showToast({ type: 'success', title: `${successCount} order(s) deleted successfully` });
      } else {
        showToast({ type: 'warning', title: `${successCount} deleted, ${errorCount} failed` });
      }

      setSelectedOrdersForDeletion([]);
      setDeleteReason('');
      setDeletePin('');
      setCheckedOrderIds([]);
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Deletion error', message: err.message });
    } finally {
      setReconcilingId(null);
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return 'N/A';
    if (typeof dateObj === 'string') return new Date(dateObj).toLocaleString();
    if (dateObj._seconds) return new Date(dateObj._seconds * 1000).toLocaleString();
    return 'Unknown date';
  };

  const toggleOrder = (id: string) => {
    setCheckedOrderIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const columns: DataTableColumn<LimboOrder>[] = [
    {
      key: 'select', header: '', width: '0.4fr',
      render: (o) => (
        <input
          type="checkbox"
          checked={checkedOrderIds.includes(o.id)}
          onChange={() => toggleOrder(o.id)}
          className="accent-tint w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      key: 'receipt', header: 'Order', width: '1.3fr',
      render: (o) => (
        <div>
          <div className="text-[13px] font-bold">{o.receiptNumber}</div>
          <div className="text-[11px] text-text-secondary">{formatDate(o.createdAt)}</div>
        </div>
      ),
    },
    { key: 'customer', header: 'Customer', render: (o) => <span className="text-[12.5px]">{o.customerName || 'Walk-in customer'}</span> },
    { key: 'enteredBy', header: 'Entered by', render: (o) => <span className="text-[12.5px] text-text-secondary">{o.userName || 'Unknown'}</span> },
    {
      key: 'items', header: 'Products', width: '2fr',
      render: (o) => (
        <div className="flex flex-col gap-1 py-1">
          {o.items && o.items.length > 0 ? o.items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 bg-bg-element/70 border border-border/80 px-2 py-1 rounded-lg text-xs font-medium text-text-main"
            >
              <span className="truncate">{item.productName || item.name || 'Product'}</span>
              <span className="font-extrabold text-[11px] text-tint bg-tint-a px-1.5 py-0.5 rounded-md whitespace-nowrap">
                x{item.quantity}
              </span>
            </div>
          )) : <span className="text-[11.5px] text-text-secondary">No items</span>}
        </div>
      ),
    },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <Money amount={o.total ?? 0} className="text-[13px] font-bold text-tint" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Cash orders</h1>
          <p className="text-text-secondary text-xs mt-1">Review cash orders in limbo and reconcile them with registered user accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IconButton icon="sync" title="Refresh" onClick={fetchData} disabled={loading} iconSize={15} className={loading ? '[&_svg]:animate-spin' : ''} />
          <button
            onClick={() => {
              if (checkedOrderIds.length === 0) { showToast({ type: 'warning', title: 'Please select at least one order to reconcile.' }); return; }
              setSelectedOrdersForReconciliation(orders.filter(o => checkedOrderIds.includes(o.id)));
            }}
            className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors flex items-center gap-1.5"
          >
            <Icon name="check" size={14} />
            Reconcile
          </button>
          <button
            onClick={() => {
              if (checkedOrderIds.length === 0) { showToast({ type: 'warning', title: 'Please select at least one order to delete.' }); return; }
              setSelectedOrdersForDeletion(orders.filter(o => checkedOrderIds.includes(o.id)));
            }}
            className="px-3.5 py-2.5 rounded-xl border border-error-val/30 bg-card text-xs font-bold text-error-val cursor-pointer hover:bg-error-val/10 transition-colors flex items-center gap-1.5"
          >
            <Icon name="trash" size={14} />
            Delete
          </button>
          <button onClick={onViewHistory} className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors flex items-center gap-1.5">
            <Icon name="clock" size={14} />
            History
          </button>
          <button onClick={onNewCashOrder} className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-xs font-bold cursor-pointer hover:bg-tint transition-colors flex items-center gap-1.5">
            <Icon name="plus" size={14} />
            New cash order
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        keyExtractor={(o) => o.id}
        loading={loading && orders.length === 0}
        emptyMessage="No limbo orders found. All caught up!"
        minWidth={820}
      />

      <ActionSheetModal
        isOpen={selectedOrdersForReconciliation.length > 0}
        onClose={() => setSelectedOrdersForReconciliation([])}
        title={`Reconcile ${selectedOrdersForReconciliation.length > 1 ? 'orders' : 'order'}`}
        onSubmit={handleReconcile}
        submitLabel="Confirm reconciliation"
        submitDisabled={!selectedUserId || reconcilingId === 'processing'}
        loading={reconcilingId === 'processing'}
      >
        <div className="bg-tint-a p-4 rounded-xl mb-1">
          {selectedOrdersForReconciliation.length === 1 ? (
            <>
              <div className="flex justify-between mb-2"><span className="text-sm text-text-secondary">Receipt</span><span className="text-sm font-bold">{selectedOrdersForReconciliation[0]?.receiptNumber}</span></div>
              <div className="flex justify-between mb-2"><span className="text-sm text-text-secondary">Walk-in name</span><span className="text-sm font-bold">{selectedOrdersForReconciliation[0]?.customerName}</span></div>
              <div className="flex justify-between"><span className="text-sm text-text-secondary">Order total</span><Money amount={selectedOrdersForReconciliation[0]?.total ?? 0} className="text-sm font-extrabold text-tint" /></div>
            </>
          ) : (
            <>
              <div className="flex justify-between mb-2"><span className="text-sm text-text-secondary">Selected orders</span><span className="text-sm font-bold">{selectedOrdersForReconciliation.length}</span></div>
              <div className="flex justify-between"><span className="text-sm text-text-secondary">Total amount</span><Money amount={selectedOrdersForReconciliation.reduce((sum, o) => sum + (o.total || 0), 0)} className="text-sm font-extrabold text-tint" /></div>
            </>
          )}
        </div>

        <div className="mt-3.5">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Select registered user</label>
          <Select
            value={selectedUserId}
            onChange={(val) => setSelectedUserId(val)}
            placeholder="Choose a user to credit..."
            options={users.map(u => ({ label: `${u.fullName} (${u.email})`, value: u.id }))}
            className="w-full"
          />
          <p className="text-[11px] text-text-secondary mt-1.5">The order amount will be added to the system and deducted from their wallet.</p>
        </div>
      </ActionSheetModal>

      <ActionSheetModal
        isOpen={selectedOrdersForDeletion.length > 0}
        onClose={() => { setSelectedOrdersForDeletion([]); setDeleteReason(''); setDeletePin(''); }}
        title={`Delete ${selectedOrdersForDeletion.length > 1 ? 'orders' : 'order'}`}
        onSubmit={handleDelete}
        submitLabel="Confirm deletion"
        submitVariant="danger"
        submitDisabled={!deleteReason || !deletePin || reconcilingId === 'processing'}
        loading={reconcilingId === 'processing'}
      >
        <div className="bg-tint-a p-4 rounded-xl mb-1">
          {selectedOrdersForDeletion.length === 1 ? (
            <>
              <div className="flex justify-between mb-2"><span className="text-sm text-text-secondary">Receipt</span><span className="text-sm font-bold">{selectedOrdersForDeletion[0]?.receiptNumber}</span></div>
              <div className="flex justify-between"><span className="text-sm text-text-secondary">Order total</span><Money amount={selectedOrdersForDeletion[0]?.total ?? 0} className="text-sm font-extrabold text-tint" /></div>
            </>
          ) : (
            <>
              <div className="flex justify-between mb-2"><span className="text-sm text-text-secondary">Selected orders</span><span className="text-sm font-bold">{selectedOrdersForDeletion.length}</span></div>
              <div className="flex justify-between"><span className="text-sm text-text-secondary">Total amount</span><Money amount={selectedOrdersForDeletion.reduce((sum, o) => sum + (o.total || 0), 0)} className="text-sm font-extrabold text-tint" /></div>
            </>
          )}
        </div>

        <div className="mt-3.5">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Reason for deletion</label>
          <input
            type="text"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="E.g. Duplicate order, mistake..."
            autoComplete="off"
            className="w-full px-3.5 py-3 rounded-[11px] border border-border bg-card text-[15px] text-text-main outline-none transition-all focus:border-tint focus:shadow-[0_0_0_3px_var(--tint-b)] placeholder:text-text-secondary"
          />
        </div>

        <div className="mt-3.5">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Admin PIN</label>
          <input
            type="password"
            value={deletePin}
            onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 4-digit PIN"
            maxLength={4}
            autoComplete="new-password"
            className="w-full px-3.5 py-3 rounded-[11px] border border-border bg-card text-[15px] text-text-main font-money outline-none transition-all focus:border-tint focus:shadow-[0_0_0_3px_var(--tint-b)] placeholder:text-text-secondary"
          />
          <p className="text-[11px] text-text-secondary mt-1.5">This action is permanent. The order will be marked as cancelled.</p>
        </div>
      </ActionSheetModal>
    </div>
  );
}
