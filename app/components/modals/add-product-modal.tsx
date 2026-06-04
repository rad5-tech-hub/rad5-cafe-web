import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '~/context/toast-context';
import { ProductImageUploader } from '../ui/product-image-uploader';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: any) => Promise<boolean>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cost = parseInt(costPrice, 10) || 0;
  const selling = parseInt(sellingPrice, 10) || 0;
  const profitPerUnit = selling - cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice || !pin) {
      showToast('Name, Selling Price, and Transaction PIN are required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const success = await onAdd({
        name: name.trim(),
        category: category.trim() || 'Others',
        description: description.trim(),
        imageUrl: imageUrl,
        costPrice: cost,
        sellingPrice: selling,
        stock: parseInt(quantity, 10) || 0,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        pin: pin,
      });

      if (success) {
        showToast('Product added to inventory successfully!', 'success');
        // Reset form
        setName('');
        setCategory('');
        setDescription('');
        setImageUrl('');
        setCostPrice('');
        setSellingPrice('');
        setQuantity('');
        setLowStockThreshold('10');
        setPin('');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add product.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <Card
        padded={true}
        className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-text-main">Add New Product</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-main font-bold p-1 rounded-full hover:bg-bg-selected cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-text-secondary text-xs">
            Add a new product to the café smart database.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Product Name"
            placeholder="e.g. Coca Cola"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Category"
            placeholder="e.g. Drinks"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-text-main">Description</label>
            <textarea
              placeholder="Brief product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-bg-element border border-border text-text-main text-sm outline-none transition-colors duration-200 w-full placeholder:text-text-secondary p-3 resize-none h-20"
              style={{ borderRadius: 'var(--radius-md)' }}
            />
          </div>

          {/* Product Image Uploader */}
          <ProductImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            productName={name}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cost Price (₦)"
              placeholder="0"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
            <Input
              label="Selling Price (₦)"
              placeholder="0"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Stock"
              placeholder="0"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              label="Low Stock Alert"
              placeholder="10"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
            />
          </div>

          {sellingPrice && costPrice && (
            <div className="flex justify-between items-center p-3 rounded-xl bg-bg-element border border-border text-sm">
              <span className="text-text-secondary font-semibold">Calculated Profit/Unit:</span>
              <span
                className={`font-bold ${
                  profitPerUnit >= 0 ? 'text-success' : 'text-error-val'
                }`}
              >
                ₦{profitPerUnit.toLocaleString()}
              </span>
            </div>
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
              variant="primary"
              size="lg"
              fullWidth={true}
              disabled={!name || !sellingPrice || !pin || loading}
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
