import React, { useState } from 'react';
import { Select } from '../ui/select';
import { ActionSheetModal, SheetField } from '../ui/action-sheet-modal';
import { PinConfirmModal } from '../ui/pin-confirm-modal';
import { Money } from '../ui/money';

type WriteOffProduct = {
  id: string;
  name: string;
  quantity: number;
  costPrice: number;
};

interface WriteOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WriteOffProduct[];
  totalProfit: number;
  submitting: boolean;
  onConfirm: (productId: string, quantity: number, note: string, pin: string) => void;
}

/**
 * WriteOffModal — thin wrapper around the shared ActionSheetModal + PinConfirmModal
 * for the Stock balance-out screen's "Balance out stock" flow. Mirrors the
 * `sheetCopy.writeoff` spec (reason field, red CTA, permanent-loss note, PIN required).
 */
export const WriteOffModal: React.FC<WriteOffModalProps> = ({
  isOpen,
  onClose,
  products,
  totalProfit,
  submitting,
  onConfirm,
}) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [awaitingPin, setAwaitingPin] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId) || null;
  const quantityNum = Number(quantity) || 0;
  const amountNum = selectedProduct ? quantityNum * selectedProduct.costPrice : 0;
  const resultingProfit = totalProfit - amountNum;
  const quantityValid = !!selectedProduct && quantity !== '' && quantityNum > 0 && quantityNum <= selectedProduct.quantity;

  const resetForm = () => {
    setProductId('');
    setQuantity('');
    setNote('');
    setAwaitingPin(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantityValid) return;
    setAwaitingPin(true);
  };

  const handleConfirmPin = (pin: string) => {
    onConfirm(productId, quantityNum, note, pin);
  };

  return (
    <>
      <ActionSheetModal
        isOpen={isOpen && !awaitingPin}
        onClose={handleClose}
        title="Balance out stock"
        subtitle="Writes off stock value as a recorded loss against lifetime profit. PIN required."
        onSubmit={handleSubmitDetails}
        submitLabel="Continue"
        submitVariant="danger"
        submitDisabled={!quantityValid}
        note="This is permanent and shows in the audit log."
      >
        <div>
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Product</label>
          <Select
            value={productId}
            onChange={(val) => {
              setProductId(val);
              setQuantity('');
            }}
            placeholder="Select a product..."
            options={products.map((p) => ({ label: `${p.name} (${p.quantity} in stock)`, value: p.id }))}
            className="w-full"
          />
        </div>

        <SheetField
          label="Quantity to write off"
          value={quantity}
          onChange={setQuantity}
          type="number"
          inputMode="numeric"
          mono
          placeholder={selectedProduct ? `Up to ${selectedProduct.quantity}` : 'Select a product first'}
          disabled={!selectedProduct}
          required
        />

        <SheetField label="Reason" value={note} onChange={setNote} placeholder="Expired pastries, spoilage" />

        {selectedProduct && (
          <div className="mt-3.5 rounded-xl border border-border divide-y divide-border text-[12.5px] overflow-hidden">
            <div className="flex justify-between px-3.5 py-2.5">
              <span className="text-text-secondary">Value to write off</span>
              <Money amount={amountNum} className="font-semibold" />
            </div>
            <div className="flex justify-between px-3.5 py-2.5">
              <span className="text-text-secondary">Current total profit</span>
              <Money amount={totalProfit} className="font-semibold" />
            </div>
            <div className="flex justify-between px-3.5 py-2.5">
              <span className="text-text-secondary">Net profit after this action</span>
              <Money amount={resultingProfit} className="font-semibold" />
            </div>
          </div>
        )}
      </ActionSheetModal>

      <PinConfirmModal
        isOpen={isOpen && awaitingPin}
        onClose={() => setAwaitingPin(false)}
        onConfirm={handleConfirmPin}
        title="Balance out stock"
        amount={amountNum}
        loading={submitting}
      />
    </>
  );
};
