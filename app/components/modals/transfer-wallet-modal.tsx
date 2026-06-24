import React, { useState } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Icon } from '../ui/icon';

interface TransferWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onPinNotSet: () => void;
}

export const TransferWalletModal: React.FC<TransferWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onPinNotSet
}) => {
  const { showToast } = useToast();
  const [recipientWalletId, setRecipientWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientWalletId || !amount || !pin) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.wallet.transfer({
        recipientWalletId,
        amount: Number(amount),
        description,
        pin
      });

      if (res.success) {
        showToast('Transfer successful!', 'success');
        onSuccess();
        resetForm();
      } else {
        if (res.message && res.message.includes('PIN is not set up')) {
          onClose();
          onPinNotSet();
          resetForm();
        } else {
          setError(res.message || 'Transfer failed.');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('PIN is not set up')) {
        onClose();
        onPinNotSet();
        resetForm();
      } else {
        setError(err.message || 'An error occurred during transfer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientWalletId('');
    setAmount('');
    setDescription('');
    setPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={() => { resetForm(); onClose(); }} />
      <Card
        padded={true}
        className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-5 shadow-2xl animate-scale-up"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tint/10 flex items-center justify-center text-tint">
              <Icon name="arrow-up" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main leading-tight">Send Funds</h3>
              <p className="text-xs text-text-secondary font-medium">Wallet to Wallet Transfer</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-element hover:bg-bg-selected text-text-secondary transition-colors cursor-pointer"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <Input
              label="Recipient Wallet ID"
              placeholder="e.g. WLT-JOHN"
              value={recipientWalletId}
              onChange={(e) => setRecipientWalletId(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="Amount (₦)"
              type="number"
              min="100"
              placeholder="Min. ₦100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              label="Description (Optional)"
              placeholder="e.g. Lunch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Transaction PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          {error && (
            <div className="text-xs text-error-val bg-error-val/10 px-3 py-2 rounded-lg font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth={true}
            disabled={loading || !recipientWalletId || !amount || pin.length !== 4}
            className="mt-2"
          >
            {loading ? 'Processing...' : 'Send Funds'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
