import React, { useState } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { ActionSheetModal, SheetField, SheetPresets } from '../ui/action-sheet-modal';
import { PinConfirmModal } from '../ui/pin-confirm-modal';

const presetAmounts = [1000, 2000, 5000, 10000];

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
  onPinNotSet,
}) => {
  const { showToast } = useToast();
  const [recipientWalletId, setRecipientWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [awaitingPin, setAwaitingPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseInt(amount, 10) || 0;

  const resetForm = () => {
    setRecipientWalletId('');
    setAmount('');
    setDescription('');
    setError(null);
    setAwaitingPin(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientWalletId || !numericAmount) return;
    setError(null);
    setAwaitingPin(true);
  };

  const handleTransfer = async (pin: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.wallet.transfer({
        recipientWalletId,
        amount: numericAmount,
        description,
        pin,
      });

      if (res.success) {
        showToast('Transfer successful!', 'success');
        onSuccess();
        handleClose();
      } else {
        if (res.message && res.message.includes('PIN is not set up')) {
          handleClose();
          onPinNotSet();
        } else {
          setAwaitingPin(false);
          setError(res.message || 'Transfer failed.');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('PIN is not set up')) {
        handleClose();
        onPinNotSet();
      } else {
        setAwaitingPin(false);
        setError(err.message || 'An error occurred during transfer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ActionSheetModal
        isOpen={isOpen && !awaitingPin}
        onClose={handleClose}
        title="Transfer to another user"
        subtitle="Send wallet balance to any RAD5 Café account. Confirmed with your PIN."
        onSubmit={handleSubmitDetails}
        submitLabel="Continue"
        submitDisabled={!recipientWalletId || !numericAmount}
        error={error}
      >
        <SheetField
          label="Recipient wallet ID"
          value={recipientWalletId}
          onChange={(v) => setRecipientWalletId(v.toUpperCase())}
          placeholder="e.g. WLT-JOHN"
          autoFocus
          required
        />
        <SheetField
          label="Amount (NGN)"
          value={amount}
          onChange={setAmount}
          type="number"
          inputMode="numeric"
          mono
          placeholder="Min. ₦100"
          required
        />
        <SheetPresets values={presetAmounts} active={numericAmount} onPick={(v) => setAmount(String(v))} />
        <SheetField
          label="Description (optional)"
          value={description}
          onChange={setDescription}
          placeholder="e.g. Lunch"
        />
      </ActionSheetModal>

      <PinConfirmModal
        isOpen={isOpen && awaitingPin}
        onClose={() => setAwaitingPin(false)}
        onConfirm={handleTransfer}
        title={`Send to ${recipientWalletId || 'recipient'}`}
        amount={numericAmount}
        loading={loading}
        error={error}
      />
    </>
  );
};
