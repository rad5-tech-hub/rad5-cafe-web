import React, { useEffect, useState } from 'react';
import { useCart, type CartItem } from '~/context/cart-context';
import { useNotifications } from '~/context/notification-context';
import { useToast } from '~/context/toast-context';
import { Icon } from '../ui/icon';
import { Money } from '../ui/money';
import { PinPad } from '../ui/pin-pad';
import { api } from '~/lib/api';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced?: (newBalance: number) => void;
}

type StockInfo = {
  productId: string;
  name: string;
  inStock: boolean;
  quantity: number;
  lowStockThreshold: number;
};

type OrderResult = {
  orderId: string;
  receiptNumber: string;
  total: number;
  items: Array<{ productName: string; quantity: number; unitPrice: number; totalPrice: number }>;
};

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onOrderPlaced }) => {
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const { notify } = useNotifications();
  const { showToast } = useToast();

  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [stockMap, setStockMap] = useState<Record<string, StockInfo>>({});
  const [checkingStock, setCheckingStock] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || step !== 'cart' || cart.length === 0) {
      setStockMap({});
      return;
    }

    let cancelled = false;
    const checkStock = async () => {
      setCheckingStock(true);
      try {
        const items = cart.map((item) => ({ productId: item.id, quantity: item.quantity }));
        const res = await api.products.checkStock(items);
        if (cancelled) return;
        if (res.success && res.data) {
          const map: Record<string, StockInfo> = {};
          for (const info of res.data) map[info.productId] = info;
          setStockMap(map);
        }
      } catch (err) {
        console.error('Stock check failed:', err);
      } finally {
        if (!cancelled) setCheckingStock(false);
      }
    };
    checkStock();
    return () => {
      cancelled = true;
    };
  }, [isOpen, step, cart]);

  useEffect(() => {
    if (!isOpen) return;
    api.wallet.balance().then((res) => {
      if (res.success && res.data) setWalletBalance(res.data.balance);
    }).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const updateQuantity = (item: CartItem, delta: number) => {
    if (delta > 0) {
      addToCart({ id: item.id, name: item.name, price: item.price, image: item.image });
    } else {
      removeFromCart(item.id);
    }
  };

  const handleCheckout = () => {
    setStep('checkout');
    setPin('');
    setError(null);
  };

  const handlePay = async () => {
    if (pin.length !== 4) return;

    setLoading(true);
    setError(null);
    try {
      const orderItems = cart.map((item) => ({ productId: item.id, quantity: item.quantity }));
      const res = await api.orders.place(orderItems, pin);
      if (!res.success || !res.data) {
        setError(res.message || 'Order execution failed.');
        return;
      }

      const { order, receipt, balance } = res.data as { order: any; receipt: any; balance: number };

      setOrderResult({
        orderId: order.id,
        receiptNumber: receipt.receiptNumber,
        total: order.total,
        items: receipt.items ?? order.items,
      });

      onOrderPlaced?.(balance);
      clearCart();
      setStep('receipt');

      void notify({
        title: 'Order Placed Successful!',
        body: `Order ${receipt.receiptNumber} for ₦${order.total.toLocaleString()} was successful.`,
        categoryId: 'orders',
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Payment execution failed. Please verify your PIN and balance.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setStep('cart');
    onClose();
  };

  const handleDownload = () => window.print();

  const handleShare = async () => {
    if (!orderResult) return;
    const shareText = `RAD5 Café Receipt: ${orderResult.receiptNumber} for ₦${orderResult.total.toLocaleString()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'RAD5 Café Receipt', text: shareText, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Receipt details copied to clipboard!', 'success');
    }
  };

  const dateStr = new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const outOfStockItems = Object.values(stockMap).filter((s) => !s.inStock);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={handleDone}
      className="fixed inset-0 z-40 flex justify-end"
      style={{ background: 'rgba(17,24,39,0.35)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={stop}
        className="w-full h-full flex flex-col p-6 glass-sheet border-l border-glass-border animate-rad5-pop"
        style={{ maxWidth: 400, borderRadius: 0 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-[19px] font-extrabold tracking-tight">
            {step === 'cart' && 'Your cart'}
            {step === 'checkout' && 'Confirm with PIN'}
            {step === 'receipt' && 'Digital receipt'}
          </h2>
          <button
            onClick={handleDone}
            className="ml-auto w-8 h-8 rounded-[9px] border border-border bg-card grid place-items-center text-text-secondary hover:text-text-main cursor-pointer"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 mt-4">
          {step === 'cart' && (
            <div className="flex flex-col gap-2.5">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-text-secondary text-[13.5px]">
                  Nothing here yet. Add something from the menu.
                </div>
              ) : (
                <>
                  {checkingStock && <div className="text-xs text-text-secondary text-center py-1">Checking stock availability...</div>}

                  {outOfStockItems.length > 0 && (
                    <div className="p-3 rounded-xl text-xs flex flex-col gap-2 border border-error-val/30 bg-error-val/10 text-error-val">
                      <span className="font-semibold">
                        {outOfStockItems.length} item{outOfStockItems.length > 1 ? 's' : ''} out of stock:
                      </span>
                      {outOfStockItems.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between">
                          <span className="truncate max-w-[60%]">{item.name}</span>
                          <button
                            onClick={() => {
                              removeFromCart(item.productId);
                              setStockMap((prev) => {
                                const next = { ...prev };
                                delete next[item.productId];
                                return next;
                              });
                            }}
                            className="text-xs font-bold underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.map((item) => {
                    const stock = stockMap[item.id];
                    const isOutOfStock = stock && !stock.inStock;
                    const isLowStock = stock && stock.inStock && stock.quantity <= stock.lowStockThreshold;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3.5 rounded-[14px] border ${
                          isOutOfStock ? 'border-error-val/40 bg-error-val/5' : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-semibold truncate">{item.name}</div>
                          <div className="text-[11.5px] text-text-secondary">
                            <Money amount={item.price} /> each
                          </div>
                          {isOutOfStock && <span className="text-[11px] font-semibold text-error-val">Out of stock</span>}
                          {isLowStock && <span className="text-[11px] font-semibold text-warning">Only {stock.quantity} left</span>}
                        </div>
                        {isOutOfStock ? (
                          <button
                            onClick={() => {
                              removeFromCart(item.id);
                              setStockMap((prev) => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });
                            }}
                            className="text-xs font-bold text-error-val px-3 py-1.5 border border-error-val/30 rounded-lg cursor-pointer"
                          >
                            Remove
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => updateQuantity(item, -1)}
                              className="w-7 h-7 rounded-lg border border-border bg-card cursor-pointer hover:border-tint hover:text-tint"
                            >
                              −
                            </button>
                            <span className="font-money text-[13px] w-[18px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item, 1)}
                              className="w-7 h-7 rounded-lg border-none bg-tint-dark text-white cursor-pointer hover:bg-tint"
                            >
                              +
                            </button>
                            <Money amount={item.price * item.quantity} className="font-semibold text-[13px] w-[74px] text-right flex-shrink-0" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {step === 'checkout' && (
            <div className="flex flex-col items-center pt-2 w-full">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="self-start text-xs font-bold text-tint hover:underline flex items-center gap-1 cursor-pointer mb-4"
              >
                ← Back to cart
              </button>
              <div className="text-center mb-2">
                <span className="text-[11.5px] font-bold tracking-wider text-text-secondary uppercase">Total amount due</span>
                <Money amount={cartTotal} className="block text-[26px] font-semibold tracking-tight mt-1" />
              </div>
              <PinPad value={pin} onChange={setPin} onConfirm={handlePay} error={error} disabled={loading} />
              <button
                onClick={handlePay}
                disabled={pin.length !== 4 || loading}
                className="w-full mt-5 py-3.5 rounded-xl border-none bg-tint-dark text-white text-[14.5px] font-bold cursor-pointer hover:bg-tint disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing transaction…' : `Pay ₦ ${cartTotal.toLocaleString()}`}
              </button>
            </div>
          )}

          {step === 'receipt' && orderResult && (
            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-ok/15 grid place-items-center text-ok">
                <Icon name="check" size={30} color="currentColor" />
              </div>
              <h2 className="text-xl font-bold text-center">Payment successful!</h2>

              <div className="w-full rounded-xl border border-dashed border-border bg-card p-5 flex flex-col gap-3.5 text-xs font-medium select-all">
                <div className="text-center flex flex-col items-center">
                  <img src="/RAD5 Cafe.svg" alt="RAD5 Café" className="w-12 h-12 mb-1" />
                  <span className="font-extrabold text-base">RAD5 Café</span>
                  <span className="text-text-secondary uppercase tracking-widest text-[9px] font-bold">Digital receipt</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-text-secondary">Receipt No:</span>
                  <span className="font-bold">{orderResult.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Date:</span>
                  <span className="font-bold">{dateStr}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-2.5">
                  {orderResult.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.productName}</span>
                        <span className="text-[10px] text-text-secondary">
                          ₦{item.unitPrice.toLocaleString()} × {item.quantity}
                        </span>
                      </div>
                      <span className="font-semibold">₦{item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total paid:</span>
                  <Money amount={orderResult.total} className="text-tint" />
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <button onClick={handleShare} className="flex-1 py-2.5 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer hover:border-tint hover:text-tint">
                  Share receipt
                </button>
                <button onClick={handleDownload} className="flex-1 py-2.5 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer hover:border-tint hover:text-tint">
                  Print receipt
                </button>
              </div>
              <button onClick={handleDone} className="w-full py-2.5 text-xs font-bold text-text-secondary hover:text-text-main cursor-pointer">
                Back to café
              </button>
            </div>
          )}
        </div>

        {step === 'cart' && cart.length > 0 && (
          <div className="border-t border-border pt-4 mt-2">
            <div className="flex justify-between text-[13px] text-text-secondary">
              <span>Wallet balance</span>
              <Money amount={walletBalance ?? 0} className="font-money" />
            </div>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-sm font-bold">Total</span>
              <Money amount={cartTotal} className="text-[22px] font-semibold tracking-tight" />
            </div>
            <button
              onClick={handleCheckout}
              className="w-full mt-4 py-3.5 rounded-xl border-none bg-tint-dark text-white text-[14.5px] font-bold cursor-pointer hover:bg-tint transition-colors"
            >
              Proceed to checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
