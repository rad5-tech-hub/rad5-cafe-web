import React, { useEffect, useState, useCallback } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';

type LimboOrder = {
  id: string;
  receiptNumber: string;
  customerName: string;
  total: number;
  items: any[];
  createdAt: { _seconds: number; _nanoseconds: number } | string;
};

type User = {
  id: string;
  fullName: string;
  email: string;
};

export function meta() {
  return [
    { title: 'Reconcile Limbo Orders - RAD5 Café' },
  ];
}

export default function LimboOrders() {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [orders, setOrders] = useState<LimboOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<LimboOrder | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

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
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReconcile = async () => {
    if (!selectedOrder || !selectedUserId) {
      showToast('Please select a user to map this order to.', 'warning');
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    const confirmed = await showConfirm({
      title: 'Confirm Reconciliation',
      message: `Are you sure you want to map order ${selectedOrder.receiptNumber} to ${user.fullName} (${user.email})?`,
      confirmLabel: 'Reconcile Order',
    });

    if (!confirmed) return;

    setReconcilingId(selectedOrder.id);
    try {
      const res = await api.adminDashboard.orders.reconcile(selectedOrder.id, selectedUserId);
      if (res.success) {
        showToast('Order reconciled successfully', 'success');
        setSelectedOrder(null);
        setSelectedUserId('');
        fetchData(); // Refresh the list
      } else {
        showToast(res.message || 'Failed to reconcile order', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred during reconciliation', 'error');
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

  return (
    <div className="flex flex-col gap-6 select-none pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main">Limbo Orders</h1>
          <p className="text-sm text-text-secondary mt-1">
            Map cash orders created without an account to actual registered users.
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <Icon name="sync" size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-element text-text-secondary font-semibold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-text-secondary">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-text-secondary">
                    No limbo orders found. All caught up!
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-bg-element/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-main">
                      {order.receiptNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-text-main">
                      {order.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-tint">
                      ₦{order.total?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        disabled={reconcilingId === order.id}
                      >
                        {reconcilingId === order.id ? 'Processing...' : 'Map User'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-extrabold text-lg text-text-main">Reconcile Order</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-text-secondary hover:bg-bg-selected rounded-full transition-colors"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-bg-element p-4 rounded-xl border border-border">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-secondary">Receipt</span>
                  <span className="text-sm font-bold text-text-main">{selectedOrder.receiptNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-secondary">Walk-in Name</span>
                  <span className="text-sm font-bold text-text-main">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Order Total</span>
                  <span className="text-sm font-extrabold text-tint">₦{selectedOrder.total?.toLocaleString() ?? 0}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Select Registered User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-bg-element border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:border-tint focus:ring-1 focus:ring-tint outline-none transition-all"
                >
                  <option value="" disabled>Choose a user to credit...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-secondary mt-1">
                  The order amount will be added to the system and deducted from their wallet.
                </p>
              </div>
            </div>
            <div className="p-6 bg-bg-element/50 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleReconcile}
                disabled={!selectedUserId || reconcilingId === selectedOrder.id}
              >
                Confirm Reconciliation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
