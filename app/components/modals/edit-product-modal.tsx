import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '~/context/toast-context';
import { ProductImageUploader } from '../ui/product-image-uploader';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  categories: any[];
  onUpdate: (productId: string, data: Record<string, any>) => Promise<boolean>;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  onUpdate,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategoryId(product.categoryId || '');
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      setCostPrice(product.costPrice != null ? String(product.costPrice) : '');
      setSellingPrice(product.sellingPrice != null ? String(product.sellingPrice) : '');
      setLowStockThreshold(product.lowStockThreshold != null ? String(product.lowStockThreshold) : '');
      setIsActive(product.isActive !== false);
      setPin('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const pid = product.id ?? product._id ?? product.productId;
  const cost = parseInt(costPrice, 10) || 0;
  const selling = parseInt(sellingPrice, 10) || 0;
  const lowStockThresholdNum = parseInt(lowStockThreshold, 10) || 0;
  const profitPerUnit = selling - cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice || !pin) {
      showToast('Name, Selling Price, and Transaction PIN are required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const updateData: Record<string, any> = {};
      if (name.trim() !== product.name) updateData.name = name.trim();
      if (categoryId !== product.categoryId) updateData.categoryId = categoryId || undefined;
      if (description.trim() !== (product.description || '')) updateData.description = description.trim();
      if (imageUrl !== product.imageUrl) updateData.imageUrl = imageUrl;
      if (cost !== product.costPrice) updateData.costPrice = cost;
      if (selling !== product.sellingPrice) updateData.sellingPrice = selling;
      if (lowStockThresholdNum !== (product.lowStockThreshold || 0)) updateData.lowStockThreshold = lowStockThresholdNum;
      if (isActive !== (product.isActive !== false)) updateData.isActive = isActive;

      if (Object.keys(updateData).length === 0) {
        showToast('No changes detected.', 'warning');
        setLoading(false);
        return;
      }

      const success = await onUpdate(pid, { ...updateData, pin });

      if (success) {
        showToast('Product updated successfully!', 'success');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update product.', 'error');
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
            <h3 className="text-xl font-bold text-text-main">Edit Product</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-main font-bold p-1 rounded-full hover:bg-bg-selected cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-text-secondary text-xs">
            Update product details and pricing.
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

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-text-main">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-bg-element border border-border text-text-main text-sm outline-none transition-colors duration-200 w-full px-3 py-2.5"
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <option value="">Select a category</option>
              {categories.map((cat: any) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

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

          <Input
            label="Low Stock Alert"
            placeholder="10"
            type="number"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
          />

          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-element border border-border">
            <label className="text-sm font-semibold text-text-main cursor-pointer select-none" htmlFor="edit-isActive">
              Active
            </label>
            <button
              id="edit-isActive"
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                isActive ? 'bg-success' : 'bg-bg-selected'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs text-text-secondary">{isActive ? 'Product is visible' : 'Product is hidden'}</span>
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
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
