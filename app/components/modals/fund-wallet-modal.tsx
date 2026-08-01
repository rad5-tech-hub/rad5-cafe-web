import React, { useState } from 'react';
import PaystackPop from '@paystack/inline-js';
import { ActionSheetModal, SheetField, SheetPresets } from '../ui/action-sheet-modal';
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

  const numericAmount = parseInt(amount, 10) || 0;

  const resetForm = () => setAmount('');

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
            resetForm();
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
    <ActionSheetModal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Fund your wallet"
      subtitle="Paystack handles the card or bank transfer. Funds land instantly."
      onSubmit={handleFund}
      submitLabel={numericAmount ? `Pay ${'₦' + numericAmount.toLocaleString()}` : 'Continue to Paystack'}
      submitDisabled={!numericAmount}
      loading={loading}
      loadingLabel="Processing…"
      note="Secured by Paystack · card, transfer or USSD."
    >
      <SheetField
        label="Amount (NGN)"
        value={amount}
        onChange={setAmount}
        type="number"
        inputMode="numeric"
        mono
        placeholder="0.00"
        autoFocus
        required
      />
      <SheetPresets values={quickAmounts} active={numericAmount} onPick={(v) => setAmount(String(v))} />
    </ActionSheetModal>
  );
};
