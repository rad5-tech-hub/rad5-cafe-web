import React, { useRef, useState } from 'react';
import { useCart, type CartItem } from '~/context/cart-context';
import { useNotifications } from '~/context/notification-context';
import { useToast } from '~/context/toast-context';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { api } from '~/lib/api';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced?: (newBalance: number) => void;
}

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
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    setPin(['', '', '', '']);
    setError(null);
  };

  const handlePinChange = (val: string, index: number) => {
    setError(null);
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal.length > 1) return;

    const newPin = [...pin];
    newPin[index] = cleanVal;
    setPin(newPin);

    if (cleanVal && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        pinRefs.current[index - 1]?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length !== 4) return;

    setLoading(true);
    setError(null);
    try {
      const orderItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const res = await api.orders.place(orderItems, fullPin);
      if (!res.success || !res.data) {
        setError(res.message || 'Order execution failed.');
        return;
      }

      const { order, receipt, balance } = res.data as {
        order: any;
        receipt: any;
        balance: number;
      };

      setOrderResult({
        orderId: order.id,
        receiptNumber: receipt.receiptNumber,
        total: order.total,
        items: receipt.items ?? order.items,
      });

      onOrderPlaced?.(balance);
      clearCart();
      setStep('receipt');

      // Trigger Web notification
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

  const handleDownload = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!orderResult) return;
    const shareText = `RAD5 Café Receipt: ${orderResult.receiptNumber} for ₦${orderResult.total.toLocaleString()}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RAD5 Café Receipt',
          text: shareText,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Receipt details copied to clipboard!', 'success');
    }
  };

  const pinComplete = pin.every((digit) => digit.length === 1);
  const dateStr = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={handleDone} />

      <div
        className="relative bg-card border border-border w-full md:max-w-lg rounded-t-2xl md:rounded-2xl flex flex-col shadow-2xl transition-all duration-300 max-h-[85vh]"
        style={{
          borderRadius: step === 'receipt' ? 'var(--radius-xl)' : 'var(--radius-lg)',
        }}
      >
        {/* Handle for mobile viewports */}
        <div className="flex md:hidden justify-center py-2 select-none">
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-text-main leading-tight">
            {step === 'cart' && 'Your Shopping Cart'}
            {step === 'checkout' && 'Checkout Authorization'}
            {step === 'receipt' && 'Digital Receipt'}
          </h3>
          <button
            onClick={handleDone}
            className="p-1.5 rounded-full hover:bg-bg-selected text-text-secondary hover:text-text-main transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'cart' && (
            <div className="flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <Icon name="cart" size={48} className="text-text-secondary" />
                  <span className="font-bold text-lg text-text-main">Your cart is empty</span>
                  <span className="text-text-secondary text-xs">
                    Browse the menu and add items to place your order.
                  </span>
                  <Button variant="primary" size="md" className="mt-2" onClick={onClose}>
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 max-h-[30vh] overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 bg-bg-element border border-border rounded-xl"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-semibold text-sm text-text-main truncate">
                            {item.name}
                          </span>
                          <span className="text-xs text-text-secondary">
                            ₦{item.price.toLocaleString()} × {item.quantity}
                          </span>
                          <span className="font-bold text-sm text-tint">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 border border-border bg-bg-element rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-selected text-text-main font-bold cursor-pointer"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-selected text-text-main font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Box */}
                  <div className="flex flex-col gap-2.5 p-4 border border-border rounded-xl bg-bg-element mt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Subtotal:</span>
                      <span className="font-semibold text-text-main">₦{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Service Fee:</span>
                      <span className="font-semibold text-text-main">₦0.00</span>
                    </div>
                    <div className="h-px bg-border my-1" />
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-text-main">Total Order Value:</span>
                      <span className="text-tint">₦{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button variant="primary" size="lg" fullWidth={true} onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 'checkout' && (
            <form onSubmit={handlePay} className="flex flex-col gap-6">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="self-start text-xs font-bold text-tint hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Back to Cart
              </button>

              <div className="text-center flex flex-col gap-1">
                <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold">Total Amount Due</span>
                <span className="text-3xl font-extrabold text-text-main">₦{cartTotal.toLocaleString()}</span>
              </div>

              <div className="flex flex-col items-center gap-4">
                <span className="text-sm font-semibold text-text-main">Enter Transaction PIN</span>
                <div className="flex justify-center gap-3">
                  {pin.map((digit, i) => (
                    <input
                      key={i}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      ref={(el) => {
                        pinRefs.current[i] = el;
                      }}
                      value={digit}
                      onChange={(e) => handlePinChange(e.target.value, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      className="w-12 h-14 text-center text-2xl font-extrabold text-text-main bg-bg-element border-2 border-border rounded-xl outline-none focus:outline-none focus:border-tint transition-all"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-center text-xs font-semibold text-error-val">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth={true}
                disabled={!pinComplete || loading}
              >
                {loading ? 'Processing Transaction...' : `Pay ₦${cartTotal.toLocaleString()}`}
              </Button>
            </form>
          )}

          {step === 'receipt' && orderResult && (
            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center text-white">
                <Icon name="check" size={32} color="#FFFFFF" />
              </div>
              <h2 className="text-xl font-bold text-text-main text-center">Payment Successful!</h2>

              {/* Receipt Body */}
              <div className="w-full border border-border rounded-xl bg-bg-element p-5 flex flex-col gap-4 text-xs font-medium text-text-main border-dashed select-all">
                <div className="text-center flex flex-col">
                  <span className="font-extrabold text-base">RAD5 Café</span>
                  <span className="text-text-secondary uppercase tracking-widest text-[9px] font-bold">Digital Receipt</span>
                </div>
                <div className="h-px bg-border border-dashed" />
                <div className="flex justify-between">
                  <span className="text-text-secondary">Receipt No:</span>
                  <span className="font-bold">{orderResult.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Date:</span>
                  <span className="font-bold">{dateStr}</span>
                </div>
                <div className="h-px bg-border border-dashed" />
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
                <div className="h-px bg-border border-dashed" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Paid:</span>
                  <span className="text-tint">₦{orderResult.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <Button variant="outline" fullWidth={true} onClick={handleShare}>
                  Share Receipt
                </Button>
                <Button variant="outline" fullWidth={true} onClick={handleDownload}>
                  Print Receipt
                </Button>
              </div>

              <Button variant="ghost" fullWidth={true} onClick={handleDone}>
                Back to Café
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
