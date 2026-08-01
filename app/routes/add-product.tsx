import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { GlassPanel } from '~/components/ui/glass-panel';
import { Icon } from '~/components/ui/icon';
import { Select } from '~/components/ui/select';
import { SheetField } from '~/components/ui/action-sheet-modal';
import { Money } from '~/components/ui/money';
import { useToast } from '~/context/toast-context';
import { ProductImageUploader } from '~/components/ui/product-image-uploader';
import { api } from '~/lib/api';

export function meta() {
  return [
    { title: "Add Product - RAD5 Café" },
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
      showToast({ type: 'warning', title: 'Name, selling price and transaction PIN are required.' });
      return;
    }

    setLoading(true);
    try {
      const selectedCategoryName = category === '__new__' ? newCategoryName.trim() : category.trim();
      if (!selectedCategoryName) {
        showToast({ type: 'warning', title: 'Please select or enter a category.' });
        setLoading(false);
        return;
      }

      let catId = categoriesList.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())?._id ||
                  categoriesList.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase())?.id;

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
        showToast({ type: 'success', title: 'Product added to inventory' });
        navigate('/inventory');
      } else {
        showToast({ type: 'error', title: 'Failed to add product', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to add product', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="flex items-center gap-3">
        <Link to="/inventory" className="w-10 h-10 rounded-xl glass-surface grid place-items-center cursor-pointer hover:border-tint hover:text-tint transition-colors flex-shrink-0">
          <Icon name="chevron-left" size={17} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Add product</h1>
          <p className="text-text-secondary text-xs mt-0.5">Register a new item into the smart database.</p>
        </div>
      </div>

      <GlassPanel radius="lg">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <SheetField label="Product name" value={name} onChange={setName} placeholder="e.g. Coca Cola" required autoFocus />

          <div className="mt-3.5">
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Category</label>
            <Select
              value={category}
              onChange={(val) => {
                setCategory(val);
                if (val === '__new__') setNewCategoryName('');
              }}
              disabled={categoriesLoading}
              placeholder={categoriesLoading ? 'Loading categories...' : 'Select a category'}
              options={
                categoriesLoading
                  ? []
                  : [
                      ...categoriesList.map((cat) => ({ label: cat.name, value: cat.name })),
                      { label: '+ Create new category...', value: '__new__' }
                    ]
              }
              className="w-full"
            />
          </div>

          {category === '__new__' && (
            <SheetField label="New category name" value={newCategoryName} onChange={setNewCategoryName} placeholder="e.g. Pastries" required />
          )}

          <div className="mt-3.5">
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Description</label>
            <textarea
              placeholder="Brief product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[11px] border border-border bg-card text-[14px] outline-none transition-all focus:border-tint focus:shadow-[0_0_0_3px_var(--tint-b)] resize-none h-20 placeholder:text-text-secondary"
            />
          </div>

          <div className="mt-3.5">
            <ProductImageUploader value={imageUrl} onChange={setImageUrl} productName={name} />
          </div>

          <div className="grid grid-cols-2 gap-x-3 mt-1">
            <SheetField label="Cost price (₦)" value={costPrice} onChange={setCostPrice} type="number" mono placeholder="0" />
            <SheetField label="Selling price (₦)" value={sellingPrice} onChange={setSellingPrice} type="number" mono placeholder="0" required />
          </div>

          <div className="grid grid-cols-2 gap-x-3">
            <SheetField label="Initial stock" value={quantity} onChange={setQuantity} type="number" mono placeholder="0" />
            <SheetField label="Low stock alert" value={lowStockThreshold} onChange={setLowStockThreshold} type="number" mono placeholder="10" />
          </div>

          {sellingPrice && costPrice && (
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-tint-a mt-3.5 text-sm">
              <span className="text-text-secondary font-semibold">Calculated profit/unit</span>
              <Money amount={profitPerUnit} className={`font-bold ${profitPerUnit >= 0 ? 'text-ok' : 'text-err'}`} />
            </div>
          )}

          <div className="border-t border-border pt-3.5 mt-3.5 flex flex-col gap-3">
            <SheetField label="Admin transaction PIN" value={pin} onChange={(v) => setPin(v.replace(/\D/g, ''))} type="password" mono maxLength={4} placeholder="4-digit PIN" required />

            <div className="flex gap-2.5 mt-1">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-border bg-card text-sm font-semibold cursor-pointer hover:border-tint hover:text-tint disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name || !sellingPrice || !pin || loading}
                className="flex-[1.5] py-3 rounded-xl border-none bg-tint-dark text-white text-sm font-bold cursor-pointer hover:bg-tint disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Adding product…' : 'Add product'}
              </button>
            </div>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
