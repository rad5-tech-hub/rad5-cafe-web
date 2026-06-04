import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '~/context/toast-context';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onRestock: (productId: string, qty: number, newCost: number | undefined, pin: string) => Promise<boolean>;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  products,
  onRestock,
}) => {
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const product = products.find((p) => p.id === selectedProduct) || products[0];
  const numericQty = parseInt(quantity, 10) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !numericQty || !pin) {
      showToast('Quantity and Transaction PIN are required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const success = await onRestock(
        product.id,
        numericQty,
        newCostPrice ? parseInt(newCostPrice, 10) : undefined,
        pin
      );
      if (success) {
        showToast(`Restocked ${numericQty} units of ${product.name}!`, 'success');
        // Reset
        setQuantity('');
        setNewCostPrice('');
        setPin('');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Restocking failed.', 'error');
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
            <h3 className="text-xl font-bold text-text-main">Restock Product</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-main font-bold p-1 rounded-full hover:bg-bg-selected cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-text-secondary text-xs">
            Increase current stock for cafe inventory items.
          </p>
        </div>

        {/* Product Picker Grid */}
        <div className="flex flex-wrap gap-2 max-h-[20vh] overflow-y-auto p-1 bg-bg-element border border-border rounded-xl">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProduct(p.id)}
              className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                selectedProduct === p.id
                  ? 'bg-tint text-white border-tint'
                  : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
              }`}
            >
              {p.name} ({p.stock})
            </button>
          ))}
        </div>

        {product && (
          <div className="flex flex-col gap-1 text-xs text-text-secondary border-l-2 border-tint pl-2">
            <span>Selected Product: <strong className="text-text-main">{product.name}</strong></span>
            <span>Current Inventory Stock: <strong className="text-text-main">{product.stock} units</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Quantity Added"
            placeholder="0"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="New Cost Price (optional)"
            placeholder="Leave blank to keep current"
            type="number"
            value={newCostPrice}
            onChange={(e) => setNewCostPrice(e.target.value)}
          />

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
              variant="primary"
              size="lg"
              fullWidth={true}
              disabled={!numericQty || !pin || loading}
            >
              {loading ? 'Restocking...' : `Add ${numericQty || '0'} units`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
