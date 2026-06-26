import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '~/context/toast-context';
import { Select } from '../ui/select';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onRestock: (productId: string, qty: number, newCost: number | undefined, pin: string) => Promise<boolean>;
  onRemoveStock?: (productId: string, qty: number, reason: string, pin: string) => Promise<boolean>;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  products,
  onRestock,
  onRemoveStock,
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const product = products.find((p) => p.id === selectedProduct);
  const numericQty = parseInt(quantity, 10);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) {
      showToast('Please select a product.', 'warning');
      return;
    }
    if (isNaN(numericQty) || numericQty === 0) {
      showToast('Please enter a valid quantity.', 'warning');
      return;
    }
    if (!pin) {
      showToast('Transaction PIN is required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      let success = false;
      if (mode === 'add') {
        success = await onRestock(
          product.id,
          numericQty,
          newCostPrice ? parseInt(newCostPrice, 10) : undefined,
          pin
        );
      } else {
        if (!reason.trim()) {
          showToast('Reason is required for removing stock.', 'warning');
          setLoading(false);
          return;
        }
        if (onRemoveStock) {
          success = await onRemoveStock(product.id, numericQty, reason.trim(), pin);
        }
      }
      
      if (success) {
        showToast(mode === 'add' ? `Restocked ${numericQty} units of ${product.name}!` : `Removed ${numericQty} units of ${product.name}!`, 'success');
        setQuantity('');
        setNewCostPrice('');
        setReason('');
        setPin('');
        setSelectedProduct('');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <Card
        padded={true}
        className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-5 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-text-main">{mode === 'add' ? 'Restock Product' : 'Remove Stock'}</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-main font-bold p-1 rounded-full hover:bg-bg-selected cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-text-secondary text-xs">
            {mode === 'add' ? 'Increase stock for cafe inventory items.' : 'Log stock reduction due to miscount, damage, or expiry.'}
          </p>
        </div>

        <div className="flex bg-bg-element p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode('add')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${mode === 'add' ? 'bg-card shadow-sm text-text-main' : 'text-text-secondary hover:text-text-main'}`}
          >
            Add Stock
          </button>
          <button
            type="button"
            onClick={() => setMode('remove')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${mode === 'remove' ? 'bg-card shadow-sm text-text-main' : 'text-text-secondary hover:text-text-main'}`}
          >
            Remove Stock
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main select-none">Product</label>
          <Select
            value={selectedProduct}
            onChange={(val) => setSelectedProduct(val)}
            placeholder="Select a product..."
            options={products.map((p) => ({
              label: `${p.name} (${p.stock} units)`,
              value: p.id
            }))}
            className="w-full"
          />
        </div>

        {product && (
          <div className="flex flex-col gap-1 text-xs text-text-secondary border-l-2 border-tint pl-2">
            <span>Selected: <strong className="text-text-main">{product.name}</strong></span>
            <span>Current Stock: <strong className="text-text-main">{product.stock} units</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Quantity"
            placeholder={mode === 'add' ? "e.g. 10" : "e.g. 5"}
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            autoFocus
          />

          {mode === 'add' && (
            <Input
              label="New Cost Price (optional)"
              placeholder="Leave blank to keep current"
              type="number"
              value={newCostPrice}
              onChange={(e) => setNewCostPrice(e.target.value)}
            />
          )}

          {mode === 'remove' && (
            <Input
              label="Reason for Removal"
              placeholder="e.g. Miscount, Expired, Damaged"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={mode === 'remove'}
            />
          )}

          <div className="border-t border-border pt-3.5 mt-1 flex flex-col gap-3">
            <Input
              label="Admin Transaction PIN"
              placeholder="4-digit PIN"
              type="password"
              maxLength={4}
              pattern="\d{4}"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required
              className="border-tint/30 focus:border-tint"
            />

            <Button
              type="submit"
              variant={mode === 'add' ? 'primary' : 'secondary'}
              size="lg"
              fullWidth={true}
              disabled={!product || isNaN(numericQty) || numericQty <= 0 || !pin || loading}
              className={mode === 'remove' ? 'bg-error-val hover:bg-error-val/90 text-white' : ''}
            >
              {loading ? 'Processing...' : (mode === 'add' ? `Restock ${numericQty || '0'} units` : `Remove ${numericQty || '0'} units`)}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
