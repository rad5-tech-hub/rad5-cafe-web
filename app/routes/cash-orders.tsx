import React, { useEffect, useState, useCallback } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';
import { Select } from '~/components/ui/select';

// --- Types for Batch/Cash Orders ---
type Product = {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
};

type BatchItem = {
  productId: string;
  quantity: number;
  productName: string;
  unitPrice: number;
};

type BatchOrder = {
  id: string;
  customerName: string;
  items: BatchItem[];
};

// --- Types for Limbo Orders ---
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
    { title: 'Cash Orders - RAD5 Café' },
  ];
}

export default function CashOrders() {
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');

  return (
    <div className="flex flex-col gap-6 select-none pb-20">
      {activeView === 'list' ? (
        <CashOrdersList onNewCashOrder={() => setActiveView('create')} />
      ) : (
        <CreateCashOrdersView onBack={() => setActiveView('list')} />
      )}
    </div>
  );
}

function CreateCashOrdersView({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<BatchOrder[]>([
    { id: Date.now().toString(), customerName: '', items: [] },
  ]);

  useEffect(() => {
    setLoading(true);
    api.products.list()
      .then((res: any) => {
        const prodArray = res.products || res.data || [];
        const parsed = prodArray.map((item: any) => ({
          id: item._id || item.id,
          name: item.name,
          price: item.sellingPrice ?? item.price ?? 0,
          inStock: (item.quantity ?? item.currentStock ?? item.stock ?? 0) > 0,
        }));
        setProducts(parsed);
      })
      .catch(() => {
        showToast('Failed to load products', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const addOrderRow = () => {
    setOrders([...orders, { id: Date.now().toString(), customerName: '', items: [] }]);
  };

  const removeOrderRow = (id: string) => {
    setOrders(orders.filter((o) => o.id !== id));
  };

  const updateCustomerName = (id: string, name: string) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, customerName: name } : o)));
  };

  const addItemToOrder = (orderId: string, productId: string) => {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setOrders(orders.map((o) => {
      if (o.id === orderId) {
        const existingItem = o.items.find((i) => i.productId === productId);
        if (existingItem) {
          return {
            ...o,
            items: o.items.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return {
          ...o,
          items: [...o.items, { productId, quantity: 1, productName: product.name, unitPrice: product.price }],
        };
      }
      return o;
    }));
  };

  const updateItemQuantity = (orderId: string, productId: string, qty: number) => {
    if (qty < 1) return;
    setOrders(orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
        };
      }
      return o;
    }));
  };

  const removeItemFromOrder = (orderId: string, productId: string) => {
    setOrders(orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, items: o.items.filter((i) => i.productId !== productId) };
      }
      return o;
    }));
  };

  const handleSaveBatch = async () => {
    const validOrders = orders.filter((o) => o.customerName.trim() !== '' && o.items.length > 0);
    if (validOrders.length === 0) {
      showToast('Please enter at least one valid order with a customer name and items.', 'error');
      return;
    }

    const payload = validOrders.map((o) => ({
      customerName: o.customerName.trim(),
      paymentMethod: 'cash' as const,
      items: o.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    }));

    const confirmed = await showConfirm({
      title: 'Submit Batch Orders',
      message: `Are you sure you want to submit ${validOrders.length} cash order(s)?`,
      confirmLabel: 'Submit Batch',
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const res = await api.orders.batch(payload);
      if (res.success) {
        showToast('Batch processed successfully.', 'success');
        if (res.data?.errors && res.data.errors.length > 0) {
          showToast(`Some orders failed: ${res.data.errors.map((e: any) => e.message).join(', ')}`, 'warning');
        }
        setOrders([{ id: Date.now().toString(), customerName: '', items: [] }]);
      } else {
        showToast(res.message || 'Batch processing failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving batch orders.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const calculateOrderTotal = (items: BatchItem[]) => {
    return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-main">Batch Cash Orders</h2>
          <p className="text-sm text-text-secondary mt-1">
            Quickly bulk-process cash orders directly at the POS.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <Icon name="arrow-down" size={16} className="mr-2 rotate-90" />
            Back to Orders
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-element text-text-secondary font-semibold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 w-64">Customer Name</th>
                <th className="px-4 py-3">Order Items</th>
                <th className="px-4 py-3 w-32 text-right">Total</th>
                <th className="px-4 py-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order, index) => (
                <tr key={order.id} className="hover:bg-bg-element/50 transition-colors">
                  <td className="px-4 py-3 text-center text-text-secondary font-medium">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="text"
                      className="w-full bg-bg-element border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary/50 focus:border-tint focus:ring-1 focus:ring-tint outline-none"
                      placeholder="Enter customer name..."
                      value={order.customerName}
                      onChange={(e) => updateCustomerName(order.id, e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      {order.items.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {order.items.map((item) => (
                            <div key={item.productId} className="flex items-center gap-2 bg-bg-element border border-border px-2 py-1.5 rounded-lg text-xs">
                              <span className="flex-1 font-semibold text-text-main line-clamp-1" title={item.productName}>
                                {item.productName}
                              </span>
                              <span className="text-text-secondary">₦{item.unitPrice.toLocaleString()}</span>
                              <div className="flex items-center gap-1 bg-card rounded-md border border-border px-1">
                                <button
                                  className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-main transition-colors"
                                  onClick={() => updateItemQuantity(order.id, item.productId, item.quantity - 1)}
                                >
                                  -
                                </button>
                                <span className="w-4 text-center text-text-main font-bold">{item.quantity}</span>
                                <button
                                  className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-main transition-colors"
                                  onClick={() => updateItemQuantity(order.id, item.productId, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                className="w-6 h-6 flex items-center justify-center text-error-val hover:bg-error-val/10 rounded-md transition-colors"
                                onClick={() => removeItemFromOrder(order.id, item.productId)}
                              >
                                <Icon name="x" size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2 mt-1">
                        <Select
                          value=""
                          onChange={(val) => {
                            addItemToOrder(order.id, val);
                          }}
                          placeholder="+ Add product to order"
                          options={products.filter(p => p.inStock).map(p => ({
                            label: `${p.name} - ₦${p.price.toLocaleString()}`,
                            value: p.id
                          }))}
                          className="flex-1 w-full"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-right font-extrabold text-tint">
                    ₦{calculateOrderTotal(order.items).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 align-top text-center">
                    {orders.length > 1 && (
                      <button
                        className="p-2 text-text-secondary hover:text-error-val hover:bg-error-val/10 rounded-lg transition-colors"
                        onClick={() => removeOrderRow(order.id)}
                        title="Remove Order"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border bg-bg-element/30">
          <Button variant="outline" size="sm" onClick={addOrderRow} className="w-full md:w-auto">
            <Icon name="plus" size={16} className="mr-2" />
            Add Another Order
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSaveBatch} disabled={saving || loading}>
          {saving ? 'Processing...' : 'Save Batch Orders'}
        </Button>
      </div>
    </div>
  );
}

function CashOrdersList({ onNewCashOrder }: { onNewCashOrder: () => void }) {
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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading} title="Refresh">
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
          >
            <Icon name="check" size={16} className="mr-2" />
            Reconcile
          </Button>
          <Button variant="primary" onClick={onNewCashOrder}>
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
                <th className="px-4 py-3 text-right">Total</th>
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
