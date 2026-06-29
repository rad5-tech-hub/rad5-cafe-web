import React, { useEffect, useState, useCallback } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';
import { Select } from '~/components/ui/select';
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
  
  // Modal state
  const [selectedOrdersForReconciliation, setSelectedOrdersForReconciliation] = useState<LimboOrder[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
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
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReconcile = async () => {
    if (selectedOrdersForReconciliation.length === 0 || !selectedUserId) {
      showToast('Please select a user to map these orders to.', 'warning');
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    const confirmed = await showConfirm({
      title: 'Confirm Reconciliation',
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
        if (res.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      if (errorCount === 0) {
         showToast(`${successCount} order(s) reconciled successfully`, 'success');
      } else {
         showToast(`${successCount} reconciled, ${errorCount} failed`, 'warning');
      }
      
      setSelectedOrdersForReconciliation([]);
      setSelectedUserId('');
      setCheckedOrderIds([]);
      fetchData(); // Refresh the list
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-text-main">Cash Orders</h2>
          <p className="text-sm text-text-secondary mt-1">
            Review cash orders in limbo and reconcile them with registered user accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <Button variant="outline" onClick={fetchData} disabled={loading} title="Refresh" className="w-10 h-10 p-0 flex-shrink-0">
            <Icon name="sync" size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              if (checkedOrderIds.length === 0) {
                showToast('Please select at least one order to reconcile.', 'warning');
                return;
              }
              const selected = orders.filter(o => checkedOrderIds.includes(o.id));
              setSelectedOrdersForReconciliation(selected);
            }}
            className="flex-1 md:flex-none"
          >
            <Icon name="check" size={16} className="mr-2 hidden sm:inline" />
            Reconcile
          </Button>
          <Button variant="outline" onClick={onViewHistory} className="flex-1 md:flex-none">
            <Icon name="clock" size={16} className="mr-2 hidden sm:inline" />
            History
          </Button>
          <Button variant="primary" onClick={onNewCashOrder} className="w-full md:w-auto mt-2 md:mt-0">
            <Icon name="plus" size={16} className="mr-2" />
            New Cash Order
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-element text-text-secondary font-semibold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="accent-tint w-4 h-4 cursor-pointer"
                    checked={orders.length > 0 && checkedOrderIds.length === orders.length}
                    onChange={(e) => {
                      if (e.target.checked) setCheckedOrderIds(orders.map(o => o.id));
                      else setCheckedOrderIds([]);
                    }}
                  />
                </th>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-text-secondary">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-text-secondary">
                    No limbo orders found. All caught up!
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className={`transition-colors cursor-pointer ${checkedOrderIds.includes(order.id) ? 'bg-tint/10' : 'hover:bg-bg-element/50'}`}
                    onClick={() => {
                      if (checkedOrderIds.includes(order.id)) {
                        setCheckedOrderIds(checkedOrderIds.filter(id => id !== order.id));
                      } else {
                        setCheckedOrderIds([...checkedOrderIds, order.id]);
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={checkedOrderIds.includes(order.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setCheckedOrderIds([...checkedOrderIds, order.id]);
                          else setCheckedOrderIds(checkedOrderIds.filter(id => id !== order.id));
                        }} 
                        className="accent-tint w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-text-main">
                      {order.receiptNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-text-main">
                      {order.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {order.items && order.items.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {order.items.map((item: any, idx: number) => (
                            <span key={idx} className="line-clamp-1" title={item.productName || item.name}>
                              {item.quantity}x {item.productName || item.name || 'Product'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>No items</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-tint">
                      ₦{order.total?.toLocaleString() ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Modal */}
      {selectedOrdersForReconciliation.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-extrabold text-lg text-text-main">Reconcile {selectedOrdersForReconciliation.length > 1 ? 'Orders' : 'Order'}</h3>
              <button
                onClick={() => setSelectedOrdersForReconciliation([])}
                className="p-2 text-text-secondary hover:bg-bg-selected rounded-full transition-colors"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-bg-element p-4 rounded-xl border border-border">
                {selectedOrdersForReconciliation.length === 1 ? (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-text-secondary">Receipt</span>
                      <span className="text-sm font-bold text-text-main">{selectedOrdersForReconciliation[0].receiptNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-text-secondary">Walk-in Name</span>
                      <span className="text-sm font-bold text-text-main">{selectedOrdersForReconciliation[0].customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Order Total</span>
                      <span className="text-sm font-extrabold text-tint">₦{selectedOrdersForReconciliation[0].total?.toLocaleString() ?? 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-text-secondary">Selected Orders</span>
                      <span className="text-sm font-bold text-text-main">{selectedOrdersForReconciliation.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Total Amount</span>
                      <span className="text-sm font-extrabold text-tint">
                        ₦{selectedOrdersForReconciliation.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Select Registered User
                </label>
                <Select
                  value={selectedUserId}
                  onChange={(val) => setSelectedUserId(val)}
                  placeholder="Choose a user to credit..."
                  options={users.map(u => ({
                    label: `${u.fullName} (${u.email})`,
                    value: u.id
                  }))}
                  className="w-full"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  The order amount will be added to the system and deducted from their wallet.
                </p>
              </div>
            </div>
            <div className="p-6 bg-bg-element/50 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedOrdersForReconciliation([])}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleReconcile}
                disabled={!selectedUserId || reconcilingId === 'processing'}
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
