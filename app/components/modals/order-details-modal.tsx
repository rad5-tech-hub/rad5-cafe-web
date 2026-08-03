import React from 'react';
import { GlassSheet } from '../ui/glass-panel';
import { Icon } from '../ui/icon';
import { Money } from '../ui/money';

export type OrderDetailsItem = {
  productId?: string;
  productName?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
};

export type OrderDetails = {
  id?: string;
  receiptNumber?: string;
  customerName?: string;
  userName?: string;
  createdAt?: any;
  date?: any;
  total?: number;
  revenue?: number;
  items?: OrderDetailsItem[];
  status?: string;
  reconciliationStatus?: string;
};

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetails | null;
}

function parseOrderDate(val: any): string {
  if (!val) return 'N/A';
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof val === 'number') return new Date(val).toLocaleString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') return val.toDate().toLocaleString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toLocaleString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return 'N/A';
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const items = order.items || [];
  const totalAmount = order.revenue ?? order.total ?? items.reduce((acc, i) => acc + (i.totalPrice ?? ((i.unitPrice ?? i.price ?? 0) * i.quantity)), 0);
  const dateStr = parseOrderDate(order.date ?? order.createdAt);
  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <GlassSheet onClick={stop} className="w-full max-w-lg max-h-[85vh] flex flex-col animate-rad5-pop overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-text-main">
                {order.receiptNumber || 'Order Details'}
              </h2>
              {order.status && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tint-a text-tint capitalize">
                  {order.status}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Customer: <span className="font-semibold text-text-main">{order.customerName || 'Walk-in customer'}</span>
              {order.userName ? ` · Entered by ${order.userName}` : ''}
              {` · ${dateStr}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center border border-border bg-card text-text-secondary hover:text-text-main hover:border-tint transition-colors cursor-pointer flex-shrink-0"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Order Summary Stats */}
        <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-tint-a">
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">Total Items</span>
            <span className="text-sm font-bold text-text-main">{items.length} product{items.length !== 1 ? 's' : ''} ({totalQuantity} unit{totalQuantity !== 1 ? 's' : ''})</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">Order Total</span>
            <Money amount={totalAmount} className="text-base font-extrabold text-tint" />
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Items Ordered</span>
          {items.map((item, idx) => {
            const name = item.productName || item.name || 'Product';
            const unitPrice = item.unitPrice ?? item.price ?? 0;
            const lineTotal = item.totalPrice ?? (unitPrice * item.quantity);

            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-element border border-border/80 hover:border-tint/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-main truncate" title={name}>
                    {name}
                  </div>
                  {unitPrice > 0 && (
                    <div className="text-xs text-text-secondary mt-0.5">
                      ₦{unitPrice.toLocaleString()} each
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-tint-a text-tint text-xs font-extrabold">
                    x{item.quantity}
                  </span>
                  {lineTotal > 0 && (
                    <Money amount={lineTotal} className="text-sm font-bold text-text-main text-right min-w-[60px]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors"
          >
            Close
          </button>
        </div>
      </GlassSheet>
    </div>
  );
};
