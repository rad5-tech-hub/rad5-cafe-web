import React, { useEffect, useState } from 'react';
import { useToast } from '~/context/toast-context';
import { Select } from '../ui/select';
import { ActionSheetModal, SheetField, SheetTabs } from '../ui/action-sheet-modal';
import { PinConfirmModal } from '../ui/pin-confirm-modal';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onRestock: (productId: string, qty: number, newCost: number | undefined, pin: string) => Promise<boolean>;
  onRemoveStock?: (productId: string, qty: number, reason: string, pin: string) => Promise<boolean>;
  /** Pre-select a product (e.g. from a per-row "Restock" action) instead of showing the picker empty. */
  initialProductId?: string;
}

/**
 * RestockModal — thin wrapper around the shared ActionSheetModal + PinConfirmModal
 * for the Inventory row "Restock" action. Supports both adding stock and
 * logging a removal (miscount/damage/expiry), matching the existing API contract.
 */
export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  products,
  onRestock,
  onRemoveStock,
  initialProductId,
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [reason, setReason] = useState('');
  const [awaitingPin, setAwaitingPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = products.find((p) => p.id === selectedProduct);
  const numericQty = parseInt(quantity, 10);

  useEffect(() => {
    if (isOpen && initialProductId) {
      setSelectedProduct(initialProductId);
    }
  }, [isOpen, initialProductId]);

  const resetForm = () => {
    setMode('add');
    setSelectedProduct('');
    setQuantity('');
    setNewCostPrice('');
    setReason('');
    setAwaitingPin(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) {
      showToast('Please select a product.', 'warning');
      return;
    }
    if (isNaN(numericQty) || numericQty <= 0) {
      showToast('Please enter a valid quantity.', 'warning');
      return;
    }
    if (mode === 'remove' && !reason.trim()) {
      showToast('Reason is required for removing stock.', 'warning');
      return;
    }
    setError(null);
    setAwaitingPin(true);
  };

  const handleConfirmPin = async (pin: string) => {
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      let success = false;
      if (mode === 'add') {
        success = await onRestock(product.id, numericQty, newCostPrice ? parseInt(newCostPrice, 10) : undefined, pin);
      } else if (onRemoveStock) {
        success = await onRemoveStock(product.id, numericQty, reason.trim(), pin);
      }

      if (success) {
        showToast(
          mode === 'add' ? `Restocked ${numericQty} units of ${product.name}!` : `Removed ${numericQty} units of ${product.name}!`,
          'success',
        );
        handleClose();
      } else {
        setAwaitingPin(false);
        setError('Action failed. Check your PIN and try again.');
      }
    } catch (err: any) {
      setAwaitingPin(false);
      setError(err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ActionSheetModal
        isOpen={isOpen && !awaitingPin}
        onClose={handleClose}
        title={mode === 'add' ? `Restock ${product ? product.name : 'product'}` : `Remove stock — ${product ? product.name : 'product'}`}
        subtitle={
          mode === 'add'
            ? 'Adds units to available stock and writes a stock-history entry.'
            : 'Logs a stock reduction due to miscount, damage or expiry.'
        }
        onSubmit={handleSubmitDetails}
        submitLabel="Continue"
        submitVariant={mode === 'remove' ? 'danger' : 'tint'}
        submitDisabled={!product || isNaN(numericQty) || numericQty <= 0}
      >
        <SheetTabs
          value={mode}
          onChange={(v) => setMode(v as 'add' | 'remove')}
          options={[
            { value: 'add', label: 'Add stock' },
            { value: 'remove', label: 'Remove stock' },
          ]}
        />

        <div className="mt-3.5">
          <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Product</label>
          <Select
            value={selectedProduct}
            onChange={(val) => {
              setSelectedProduct(val);
              setQuantity('');
            }}
            placeholder="Select a product..."
            options={products.map((p) => ({ label: `${p.name} (${p.stock} units)`, value: p.id }))}
            className="w-full"
          />
        </div>

        <SheetField
          label={mode === 'add' ? 'Units received' : 'Units to remove'}
          value={quantity}
          onChange={setQuantity}
          type="number"
          inputMode="numeric"
          mono
          placeholder={mode === 'add' ? 'e.g. 10' : 'e.g. 5'}
          required
        />

        {mode === 'add' && (
          <SheetField
            label="New cost price (optional)"
            value={newCostPrice}
            onChange={setNewCostPrice}
            type="number"
            inputMode="numeric"
            mono
            placeholder="Leave blank to keep current"
          />
        )}

        {mode === 'remove' && (
          <SheetField
            label="Reason for removal"
            value={reason}
            onChange={setReason}
            placeholder="e.g. Miscount, Expired, Damaged"
            required
          />
        )}
      </ActionSheetModal>

      <PinConfirmModal
        isOpen={isOpen && awaitingPin}
        onClose={() => setAwaitingPin(false)}
        onConfirm={handleConfirmPin}
        title={mode === 'add' ? 'Confirm restock' : 'Confirm stock removal'}
        loading={loading}
        error={error}
      />
    </>
  );
};
