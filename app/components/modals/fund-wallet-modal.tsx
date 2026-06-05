import React, { useState } from 'react';
import PaystackPop from '@paystack/inline-js';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onSuccess: (amount: number, reference: string) => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const numericAmount = parseInt(amount, 10) || 0;

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAmount) return;

    setLoading(true);
    try {
      // 1. Call backend API to initiate transaction reference
      const res = await api.payments.initiate(numericAmount);
      if (!res.success || !res.data) {
        showToast(res.message || 'Failed to initiate payment.', 'error');
        setLoading(false);
        return;
      }

      const { reference, publicKey } = res.data;

      // 2. Open Paystack Inline Popup inside the browser
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: publicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3f15831445c595a57f84bdc6e3523f8b10b981a',
        email: userEmail,
        amount: numericAmount * 100, // in kobo
        ref: reference,
        onSuccess: async (transaction: any) => {
          showToast('Payment successful! Crediting wallet...', 'info');
          try {
            await api.payments.verify(transaction.reference);
            onSuccess(numericAmount, transaction.reference);
            onClose();
          } catch (err: any) {
            showToast(err.message || 'Payment verification failed.', 'error');
          }
        },
        onCancel: () => {
          showToast('Payment canceled.', 'warning');
        },
      });
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to initialize payment gateway.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <Card
        padded={true}
        className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-6 shadow-2xl animate-scale-up"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-text-main">Fund Your Wallet</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-main font-bold p-1 rounded-full hover:bg-bg-selected"
            >
              ✕
            </button>
          </div>
          <p className="text-text-secondary text-sm">
            Select or enter an amount to credit your smart wallet.
          </p>
        </div>

        <form onSubmit={handleFund} className="flex flex-col gap-6">
          <div className="flex items-center gap-3 bg-bg-element border border-border px-4 py-2.5 rounded-xl">
            <span className="text-2xl font-bold text-text-main">₦</span>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => e.preventDefault()}
              className="w-full text-xl font-bold bg-transparent border-none outline-none text-text-main placeholder:text-text-secondary"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  numericAmount === amt
                    ? 'bg-tint text-white border-tint'
                    : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
                }`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth={true}
            disabled={!numericAmount || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ₦${numericAmount.toLocaleString()}`
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};
