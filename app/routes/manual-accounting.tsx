import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';

export function meta() {
  return [
    { title: "Manage Manual Quantities - RAD5 Café" },
    { name: "description", content: "Override online product stock quantities for custom profit calculations." },
  ];
}

export default function ManualAccounting() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState('');
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    api.adminDashboard.analytics.accounting()
      .then(res => {
        if (res.success && res.data?.details) {
          setProducts(res.data.details);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    const saved = localStorage.getItem('manual_product_quantities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const stringified: Record<string, string> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          stringified[key] = String(val);
        });
        setDraftQuantities(stringified);
      } catch (e) {
        console.error('Error loading manual quantities:', e);
      }
    }
  }, []);

  const handleQuantityChange = (productId: string, val: string) => {
    // Only allow positive integers or empty string
    if (val === '' || /^\d+$/.test(val)) {
      setDraftQuantities(prev => ({
        ...prev,
        [productId]: val,
      }));
    }
  };

  const handleIncrement = (productId: string, onlineQty: number) => {
    const currentValStr = draftQuantities[productId];
    const currentVal = currentValStr !== undefined && currentValStr !== '' 
      ? parseInt(currentValStr, 10) 
      : onlineQty;
    
    setDraftQuantities(prev => ({
      ...prev,
      [productId]: String(currentVal + 1),
    }));
  };

  const handleDecrement = (productId: string, onlineQty: number) => {
    const currentValStr = draftQuantities[productId];
    const currentVal = currentValStr !== undefined && currentValStr !== '' 
      ? parseInt(currentValStr, 10) 
      : onlineQty;
    
    if (currentVal <= 0) return;

    setDraftQuantities(prev => ({
      ...prev,
      [productId]: String(currentVal - 1),
    }));
  };

  const handleResetProduct = (productId: string) => {
    setDraftQuantities(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleClearAll = () => {
    setDraftQuantities({});
    showToast('Draft overrides cleared. Click Save to persist.', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOverrides: Record<string, number> = {};

    Object.entries(draftQuantities).forEach(([productId, valStr]) => {
      if (valStr !== '') {
        const val = parseInt(valStr, 10);
        if (!isNaN(val)) {
          finalOverrides[productId] = val;
        }
      }
    });

    localStorage.setItem('manual_product_quantities', JSON.stringify(finalOverrides));
    showToast('Manual quantity overrides updated successfully!', 'success');
    navigate('/analytics', { state: { tab: 'accounting' } });
  };

  const handleCancel = () => {
    navigate('/analytics', { state: { tab: 'accounting' } });
  };

  // Filter products by name
  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Icon name="sync" className="animate-spin inline-block text-tint mx-auto" size={32} />
        <p className="text-text-secondary text-sm mt-3">Loading product inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-error-val/10 flex items-center justify-center text-error-val mx-auto mb-4">
          <Icon name="alert-triangle" size={24} />
        </div>
        <p className="text-error-val font-semibold">Failed to load product intelligence data.</p>
        <Button variant="primary" onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 select-none max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Manual Quantity Overrides</h1>
          <p className="text-text-secondary text-xs mt-1">
            Specify local overrides for stock quantities. Overridden products calculate expected revenues locally.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClearAll} className="h-10 hover:bg-error-val/10 hover:text-error-val hover:border-error-val/30">
            <Icon name="trash" size={14} className="mr-1.5" />
            Clear Overrides
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel} className="h-10">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="h-10 px-5 font-bold">
            <Icon name="check" size={14} className="mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card className="p-5 flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-text-secondary">
            <Icon name="search" size={18} />
          </div>
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-bg-element border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tint/40 focus:border-tint text-text-main transition-all placeholder:text-text-secondary/50"
          />
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-bg-element/20">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              No products found matching "{search}"
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const draftVal = draftQuantities[p.productId];
                const hasOverride = draftVal !== undefined && draftVal !== '';

                return (
                  <div key={p.productId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-bg-selected/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-text-main">{p.productName}</span>
                      <span className="text-xs text-text-secondary">
                        Online Qty Added: <strong className="text-text-main">{p.quantityAdded}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center bg-bg-element border border-border rounded-xl p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleDecrement(p.productId, p.quantityAdded)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-selected text-text-secondary hover:text-text-main active:scale-90 transition-all cursor-pointer"
                        >
                          <Icon name="minus" size={14} />
                        </button>
                        
                        <input
                          type="text"
                          value={draftVal !== undefined ? draftVal : ''}
                          placeholder={String(p.quantityAdded)}
                          onChange={e => handleQuantityChange(p.productId, e.target.value)}
                          className="w-16 text-center border-0 bg-transparent text-sm font-bold text-text-main focus:ring-0 focus:outline-none placeholder:text-text-secondary/30"
                        />

                        <button
                          type="button"
                          onClick={() => handleIncrement(p.productId, p.quantityAdded)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-selected text-text-secondary hover:text-text-main active:scale-90 transition-all cursor-pointer"
                        >
                          <Icon name="plus" size={14} />
                        </button>
                      </div>

                      {hasOverride && (
                        <button
                          type="button"
                          onClick={() => handleResetProduct(p.productId)}
                          className="p-2 rounded-lg border border-border/80 hover:border-error-val/30 hover:bg-error-val/10 text-text-secondary hover:text-error-val transition-all cursor-pointer"
                          title="Reset to Online Qty"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
