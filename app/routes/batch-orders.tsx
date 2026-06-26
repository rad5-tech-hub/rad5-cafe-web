import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';

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

export function meta() {
  return [
    { title: 'Batch Orders - RAD5 Café' },
  ];
}

export default function BatchOrders() {
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
    // Validate
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
        // Reset valid rows, keep invalid rows? Actually just reset all to a single blank row
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
    <div className="flex flex-col gap-6 select-none pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main">Batch Cash Orders</h1>
          <p className="text-sm text-text-secondary mt-1">
            Quickly bulk-process cash orders directly at the POS.
          </p>
        </div>
        <Button variant="primary" onClick={handleSaveBatch} disabled={saving || loading}>
          {saving ? 'Processing...' : 'Save Batch Orders'}
        </Button>
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
                        <select
                          className="flex-1 bg-bg-element border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:border-tint focus:ring-1 focus:ring-tint outline-none"
                          onChange={(e) => {
                            addItemToOrder(order.id, e.target.value);
                            e.target.value = ''; // Reset select after adding
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>+ Add product to order</option>
                          {products.filter(p => p.inStock).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ₦{p.price.toLocaleString()}
                            </option>
                          ))}
                        </select>
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
    </div>
  );
}
