import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { RestockModal } from '~/components/modals/restock-modal';
import { EditProductModal } from '~/components/modals/edit-product-modal';
import { api } from '~/lib/api';

type InventoryProduct = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  totalAdded: number;
  totalSold: number;
};

const initialInventory: InventoryProduct[] = [];

export function meta() {
  return [
    { title: "Inventory Database - RAD5 Café" },
    { name: "description", content: "Manage stock levels, units, cost, and selling prices." },
  ];
}

export default function Inventory() {
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showRestock, setShowRestock] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInventoryData = () => {
    setLoading(true);
    Promise.all([
      api.adminDashboard.inventoryTracking(1, 100),
      api.categories.list()
    ]).then(([prodRes, catRes]) => {
      if (prodRes.success && Array.isArray(prodRes.data)) {
        const mapped = prodRes.data.map((p: any) => ({
          ...p,
          stock: p.currentStock ?? p.quantity ?? 0,
          quantity: p.currentStock ?? p.quantity ?? 0,
        }));
        setInventoryList(mapped);
      } else {
        setInventoryList([]);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategoriesList(catRes.data);
      }
    }).catch((err) => {
      console.warn('Failed to load live inventory.', err);
      setInventoryList([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const getCategoryName = (product: any) => {
    if (product.category) return product.category;
    const cat = categoriesList.find(c => c.id === product.categoryId || c._id === product.categoryId);
    return cat ? cat.name : 'Others';
  };

  const categories = ['All', ...Array.from(new Set([
    ...categoriesList.map(c => c.name),
    ...inventoryList.map(p => getCategoryName(p)).filter(Boolean)
  ]))];

  const filtered = selectedCategory === 'All'
    ? inventoryList
    : inventoryList.filter((p) => getCategoryName(p).toLowerCase() === selectedCategory.toLowerCase());



  const handleRestockProduct = async (productId: string, qty: number, newCost: number | undefined, pin: string): Promise<boolean> => {
    try {
      const res = await api.adminDashboard.products.restock(productId, {
        quantity: qty,
        newCostPrice: newCost,
        pin: pin,
      });
      if (res.success) {
        fetchInventoryData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleEditProduct = async (productId: string, data: Record<string, any>): Promise<boolean> => {
    try {
      const res = await api.products.update(productId, data);
      if (res.success) {
        fetchInventoryData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const mappedProductsForRestock = inventoryList.map(p => ({
    id: p.id ?? p._id,
    name: p.name,
    stock: p.quantity ?? p.stock ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6 select-none max-w-2xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Inventory Manager</h1>
          <p className="text-text-secondary text-xs mt-1">
            Track cost profit margins, total quantities, and stocks.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products/add">
            <Button variant="primary" size="sm">
              + Add Product
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowRestock(true)}>
            Restock
          </Button>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-tint text-white border-tint'
                : 'bg-bg-element text-text-secondary border-border hover:bg-bg-selected hover:text-text-main'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inventory Listings */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-secondary text-sm">
          No inventory products found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((product) => {
            const pid = product.id ?? product._id;
            const cost = product.costPrice ?? 0;
            const selling = product.sellingPrice ?? 0;
            const profit = selling - cost;
            const stock = product.quantity ?? product.stock ?? 0;
            const stockStatus = stock === 0 ? 'error' : stock < 10 ? 'warning' : 'success';
            const stockLabel = stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock';
            const totalAdded = product.totalAdded ?? stock;
            const totalSold = product.totalSold ?? 0;

            return (
              <Card key={pid} className="flex flex-col gap-4 shadow-xs">
                {/* Card Title & Tag */}
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-bg-page flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h3 className="text-base font-bold text-text-main leading-tight truncate">{product.name}</h3>
                      <span className="text-xs text-text-secondary font-semibold">{getCategoryName(product)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge label={stockLabel} variant={stockStatus} />
                    <button
                      type="button"
                      onClick={() => setEditProduct(product)}
                      className="text-text-secondary hover:text-tint transition-colors cursor-pointer"
                      title="Edit product"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                </div>

                {/* Data Margins Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-border text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-secondary font-semibold">Cost Price</span>
                    <span className="text-sm font-bold text-text-main select-all">₦{cost.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-secondary font-semibold">Selling Price</span>
                    <span className="text-sm font-bold text-text-main select-all">₦{selling.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-secondary font-semibold">Profit / Unit</span>
                    <span className="text-sm font-extrabold text-success select-all">₦{profit.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-secondary font-semibold">Current Stock</span>
                    <span className={`text-sm font-extrabold ${stock === 0 ? 'text-error-val' : stock < 10 ? 'text-warning' : 'text-text-main'}`}>
                      {stock} units
                    </span>
                  </div>
                </div>

                {/* Stock Bar Metrics */}
                <div className="text-xs text-text-secondary font-semibold">
                  Stock Summary: Added {totalAdded} units | Sold {totalSold} units | Remaining {stock} units
                </div>
              </Card>
            );
          })}
        </div>
      )}



      <RestockModal
        isOpen={showRestock}
        onClose={() => setShowRestock(false)}
        products={mappedProductsForRestock}
        onRestock={handleRestockProduct}
      />

      <EditProductModal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        product={editProduct}
        categories={categoriesList}
        onUpdate={handleEditProduct}
      />
    </div>
  );
}
