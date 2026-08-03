import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { Icon } from '~/components/ui/icon';
import { Select } from '~/components/ui/select';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import type { Product, BatchOrder, BatchItem } from './types';

export function CreateCashOrdersView({ onBack }: { onBack: () => void }) {
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
        showToast({ type: 'error', title: 'Failed to load products' });
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
        return { ...o, items: o.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)) };
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
      showToast({ type: 'error', title: 'Please enter at least one valid order with a customer name and items.' });
      return;
    }

    const payload = validOrders.map((o) => ({
      customerName: o.customerName.trim(),
      paymentMethod: 'cash' as const,
      items: o.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    }));

    const confirmed = await showConfirm({
      title: 'Submit batch orders',
      message: `Are you sure you want to submit ${validOrders.length} cash order(s)?`,
      confirmLabel: 'Submit batch',
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const res = await api.orders.batch(payload);
      if (res.success) {
        showToast({ type: 'success', title: 'Batch processed successfully' });
        if (res.data?.errors && res.data.errors.length > 0) {
          showToast({ type: 'warning', title: 'Some orders failed', message: res.data.errors.map((e: any) => e.message).join(', ') });
        }
        setOrders([{ id: Date.now().toString(), customerName: '', items: [] }]);
      } else {
        showToast({ type: 'error', title: 'Batch processing failed', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error saving batch orders', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const calculateOrderTotal = (items: BatchItem[]) => items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const columns: DataTableColumn<BatchOrder>[] = [
    {
      key: 'customer', header: 'Customer name', width: '1.3fr',
      render: (order) => (
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg-element text-text-main text-sm outline-none focus:border-tint transition-colors placeholder:text-text-secondary"
          placeholder="Enter customer name..."
          value={order.customerName}
          onChange={(e) => updateCustomerName(order.id, e.target.value)}
        />
      ),
    },
    {
      key: 'items', header: 'Order items', width: '2.4fr',
      render: (order) => (
        <div className="flex flex-col gap-2 py-1">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-2 bg-tint-a px-2.5 py-1.5 rounded-lg text-xs">
              <span className="flex-1 font-semibold truncate" title={item.productName}>{item.productName}</span>
              <Money amount={item.unitPrice} className="text-text-secondary" />
              <div className="flex items-center gap-1 bg-card rounded-md border border-border px-1">
                <button className="w-5 h-5 grid place-items-center text-text-secondary hover:text-tint transition-colors cursor-pointer" onClick={() => updateItemQuantity(order.id, item.productId, item.quantity - 1)}>−</button>
                <span className="w-4 text-center font-bold text-text-main">{item.quantity}</span>
                <button className="w-5 h-5 grid place-items-center text-text-secondary hover:text-tint transition-colors cursor-pointer" onClick={() => updateItemQuantity(order.id, item.productId, item.quantity + 1)}>+</button>
              </div>
              <button className="w-6 h-6 grid place-items-center text-error-val hover:bg-error-val/10 rounded-md transition-colors cursor-pointer" onClick={() => removeItemFromOrder(order.id, item.productId)}>
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
          <Select
            value=""
            onChange={(val) => addItemToOrder(order.id, val)}
            placeholder="+ Add product to order"
            options={products.filter(p => p.inStock).map(p => ({ label: `${p.name} - ₦${p.price.toLocaleString()}`, value: p.id }))}
            className="w-full"
          />
        </div>
      ),
    },
    { key: 'total', header: 'Total', width: '0.9fr', align: 'right', render: (order) => <Money amount={calculateOrderTotal(order.items)} className="text-[13px] font-extrabold text-tint" /> },
    {
      key: 'actions', header: '', width: '0.5fr', align: 'right',
      render: (order) => orders.length > 1 ? (
        <button className="p-2 text-text-secondary hover:text-error-val hover:bg-error-val/10 rounded-lg transition-colors cursor-pointer" onClick={() => removeOrderRow(order.id)} title="Remove order">
          <Icon name="trash" size={16} />
        </button>
      ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Batch cash orders</h1>
          <p className="text-text-secondary text-xs mt-1">Quickly bulk-process cash orders directly at the POS.</p>
        </div>
        <button onClick={onBack} className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors flex items-center gap-1.5 self-start">
          <Icon name="chevron-left" size={14} />
          Back to orders
        </button>
      </div>

      <DataTable columns={columns} rows={orders} keyExtractor={(o) => o.id} minWidth={820} />

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <button onClick={addOrderRow} className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors flex items-center gap-1.5 self-start">
          <Icon name="plus" size={14} />
          Add another order
        </button>
        <button onClick={handleSaveBatch} disabled={saving || loading} className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-xs font-bold cursor-pointer hover:bg-tint disabled:opacity-50 transition-colors">
          {saving ? 'Processing…' : 'Save batch orders'}
        </button>
      </div>
    </div>
  );
}
