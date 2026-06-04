import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Icon } from '~/components/ui/icon';
import { useToast } from '~/context/toast-context';
import { ProductImageUploader } from '~/components/ui/product-image-uploader';
import { api } from '~/lib/api';

export function meta() {
  return [
    { title: "Add New Product - RAD5 Café" },
    { name: "description", content: "Register a new café item into the smart database." },
  ];
}

export default function AddProduct() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    setCategoriesLoading(true);
    api.categories.list()
      .then((catRes) => {
        if (catRes.success && Array.isArray(catRes.data)) {
          setCategoriesList(catRes.data);
        }
      })
      .catch((err) => console.warn('Failed to load categories list:', err))
      .finally(() => setCategoriesLoading(false));
  }, []);

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
      const selectedCategoryName = category === '__new__' ? newCategoryName.trim() : category.trim();
      if (!selectedCategoryName) {
        showToast('Please select or enter a category.', 'warning');
        setLoading(false);
        return;
      }

      let catId = categoriesList.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())?._id ||
                  categoriesList.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())?.id;
      
      // Auto-create category if it does not exist
      if (!catId && selectedCategoryName) {
        const catRes = await api.adminDashboard.categories.create({
          name: selectedCategoryName,
          description: `Auto-created category for ${name.trim()}`
        });
        if (catRes.success && catRes.data) {
          catId = catRes.data.id || catRes.data._id;
        }
      }

      if (!catId && categoriesList.length > 0) {
        catId = categoriesList[0]._id || categoriesList[0].id;
      }

      const res = await api.adminDashboard.products.create({
        name: name.trim(),
        categoryId: catId || 'others',
        description: description.trim(),
        imageUrl: imageUrl,
        costPrice: cost,
        sellingPrice: selling,
        quantity: parseInt(quantity, 10) || 0,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        pin: pin,
      });

      if (res.success) {
        showToast('Product added to inventory successfully!', 'success');
        navigate('/inventory');
      } else {
        showToast(res.message || 'Failed to add product.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add product.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-md mx-auto">
      {/* Top Header Control */}
      <div className="flex items-center gap-3">
        <Link
          to="/inventory"
          className="p-2 rounded-full hover:bg-bg-selected text-text-secondary hover:text-text-main transition-colors border border-border cursor-pointer bg-card"
        >
          <Icon name="arrow-down" size={16} className="rotate-90" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-text-main tracking-tight">New Café Product</h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Register a new item into the smart database.
          </p>
        </div>
      </div>

      <Card
        padded={true}
        className="bg-card border border-border w-full rounded-2xl flex flex-col gap-4 shadow-xs"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Product Name"
            placeholder="e.g. Coca Cola"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
            autoFocus
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-text-main">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value === '__new__') {
                  setNewCategoryName('');
                }
              }}
              disabled={categoriesLoading}
              className="bg-bg-element border border-border text-text-main text-sm outline-none transition-colors duration-200 w-full p-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                borderWidth: '1.5px',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
              }}
            >
              {categoriesLoading ? (
                <option value="">Loading categories...</option>
              ) : (
                <>
                  <option value="">Select a category</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id || cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__new__">+ Create New Category...</option>
                </>
              )}
            </select>
          </div>

          {category === '__new__' && (
            <Input
              label="New Category Name"
              placeholder="e.g. Pastries"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
              autoComplete="off"
            />
          )}

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
              autoComplete="new-password"
              className="border-tint/30 focus:border-tint"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth={true}
                onClick={() => navigate('/inventory')}
                disabled={loading}
              >
                Cancel
              </Button>
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
          </div>
        </form>
      </Card>
    </div>
  );
}
