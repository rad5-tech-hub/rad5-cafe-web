import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { PillButton } from '~/components/ui/pill-button';
import { IconButton } from '~/components/ui/icon-button';
import { StatCard } from '~/components/ui/stat-card';
import { Money } from '~/components/ui/money';
import { Icon } from '~/components/ui/icon';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { RestockModal } from '~/components/modals/restock-modal';
import { EditProductModal } from '~/components/modals/edit-product-modal';
import { ProductInfoModal } from '~/components/modals/product-info-modal';
import { api } from '~/lib/api';

export function meta() {
  return [
    { title: "Inventory - RAD5 Café" },
    { name: "description", content: "Track cost, profit margins, quantities and stock levels." },
  ];
}

export default function Inventory() {
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Hidden'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [restockProductId, setRestockProductId] = useState<string | undefined>(undefined);
  const [showRestock, setShowRestock] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [infoProduct, setInfoProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  const fetchInventoryData = (pageNum: number) => {
    setLoading(true);
    Promise.all([
      api.adminDashboard.inventoryTracking(pageNum, limit),
      api.categories.list()
    ]).then(([prodRes, catRes]) => {
      if (prodRes.success && Array.isArray(prodRes.data)) {
        const mapped = prodRes.data.map((p: any) => ({
          ...p,
          stock: p.currentStock ?? p.quantity ?? 0,
          quantity: p.currentStock ?? p.quantity ?? 0,
        }));
        setInventoryList(mapped);
        setTotalPages(prodRes.totalPages ?? Math.ceil((prodRes.total ?? mapped.length) / limit));
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
    fetchInventoryData(1);
  }, []);

  useEffect(() => {
    if (page > 1) fetchInventoryData(page);
  }, [page]);

  const getCategoryName = (product: any) => {
    if (product.category) return product.category;
    const cat = categoriesList.find(c => c.id === product.categoryId || c._id === product.categoryId);
    return cat ? cat.name : 'Others';
  };

  const categories = ['All', ...Array.from(new Set([
    ...categoriesList.map(c => c.name),
    ...inventoryList.map(p => getCategoryName(p)).filter(Boolean)
  ]))];

  const filtered = inventoryList.filter((p) => {
    const matchesCategory = selectedCategory === 'All'
      || getCategoryName(p).toLowerCase() === selectedCategory.toLowerCase();
    const isHidden = p.isActive === false;
    const matchesStatus = statusFilter === 'All'
      || (statusFilter === 'Active' && !isHidden)
      || (statusFilter === 'Hidden' && isHidden);
    const matchesSearch = !searchQuery
      || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const updateLocalItem = (productId: string, updated: any) => {
    setInventoryList(prev => prev.map(p => {
      const pid = p.id ?? p._id;
      if (pid === productId) {
        return {
          ...p,
          ...updated,
          stock: updated.currentStock ?? updated.quantity ?? updated.stock ?? p.stock,
          quantity: updated.currentStock ?? updated.quantity ?? updated.stock ?? p.quantity
        };
      }
      return p;
    }));
  };

  const refreshSingleItem = async (productId: string, fallbackData?: any) => {
    if (fallbackData) {
      updateLocalItem(productId, fallbackData);
    } else {
      try {
        const res = await api.products.get(productId);
        if (res.success && res.data) {
          updateLocalItem(productId, res.data);
        }
      } catch (err) {
        console.error('Failed to refresh item', err);
      }
    }
  };

  const handleRestockProduct = async (productId: string, qty: number, newCost: number | undefined, pin: string): Promise<boolean> => {
    try {
      const res = await api.adminDashboard.products.restock(productId, {
        quantity: qty,
        newCostPrice: newCost,
        pin: pin,
      });
      if (res.success) {
        refreshSingleItem(productId, res.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleRemoveStockProduct = async (productId: string, qty: number, reason: string, pin: string): Promise<boolean> => {
    try {
      const res = await api.adminDashboard.products.removeStock(productId, {
        quantity: qty,
        reason: reason,
        pin: pin,
      });
      if (res.success) {
        refreshSingleItem(productId, res.data);
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
        refreshSingleItem(productId, res.data);
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

  const totalProducts = inventoryList.length;
  const stockValue = inventoryList.reduce((sum, p) => sum + (p.costPrice ?? 0) * (p.quantity ?? p.stock ?? 0), 0);
  const lowStockItems = inventoryList.filter(p => (p.quantity ?? p.stock ?? 0) > 0 && (p.quantity ?? p.stock ?? 0) < 10);
  const outOfStockCount = inventoryList.filter(p => (p.quantity ?? p.stock ?? 0) === 0).length;

  const columns: DataTableColumn<any>[] = [
    {
      key: 'name', header: 'Product', width: '1.7fr',
      render: (p) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-border bg-tint-a grid place-items-center">
            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Icon name="package-variant-closed" size={14} className="text-text-secondary" />}
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold truncate">{p.name}</div>
            <div className="text-[11px] text-text-secondary truncate">{getCategoryName(p)}{p.isActive === false ? ' · Hidden' : ''}</div>
          </div>
        </div>
      ),
    },
    { key: 'cost', header: 'Cost', render: (p) => <Money amount={p.costPrice ?? 0} className="text-[13px] text-text-secondary" /> },
    { key: 'selling', header: 'Selling', render: (p) => <Money amount={p.sellingPrice ?? 0} className="text-[13px]" /> },
    { key: 'profit', header: 'Profit/unit', render: (p) => <Money amount={(p.sellingPrice ?? 0) - (p.costPrice ?? 0)} className="text-[13px] font-semibold text-ok" /> },
    {
      key: 'stock', header: 'Stock', render: (p) => {
        const s = p.quantity ?? p.stock ?? 0;
        const color = s === 0 ? 'var(--color-err)' : s < 10 ? 'var(--color-warn)' : undefined;
        return <span className="text-[13px] font-semibold" style={color ? { color } : undefined}>{s} units</span>;
      },
    },
    {
      key: 'actions', header: '', width: '0.9fr', align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <IconButton icon="package-variant-closed" size={36} iconSize={14} title="Restock" onClick={() => { setRestockProductId(p.id ?? p._id); setShowRestock(true); }} />
          <IconButton icon="edit" size={36} iconSize={14} title="Edit product" onClick={() => setEditProduct(p)} />
          <IconButton icon="search" size={36} iconSize={14} title="Product info" onClick={() => setInfoProduct(p)} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Inventory</h1>
          <p className="text-text-secondary text-xs mt-1">
            Track cost, profit margins, quantities and stock levels.
          </p>
        </div>
        <Link
          to="/admin/products/add"
          className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-[13.5px] font-bold cursor-pointer hover:bg-tint transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Icon name="plus" size={15} />
          Add product
        </Link>
      </div>

      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 px-4.5 py-3.5 rounded-2xl border" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.28)' }}>
          <Icon name="alert-triangle" size={18} className="flex-shrink-0 text-warn" />
          <span className="text-[13px] font-semibold">
            {lowStockItems.length} product{lowStockItems.length === 1 ? '' : 's'} running low on stock — restock soon to avoid going out of stock.
          </span>
        </div>
      )}

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Total products" value={totalProducts} sub="active listings" />
        <StatCard label="Stock value" value={<Money amount={stockValue} />} sub="at cost price" />
        <StatCard label="Low stock" value={lowStockItems.length} sub="below 10 units" valueColor={lowStockItems.length ? 'var(--color-warn)' : undefined} />
        <StatCard label="Out of stock" value={outOfStockCount} sub="unavailable to order" valueColor={outOfStockCount ? 'var(--color-err)' : undefined} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-chip text-sm pl-9 pr-4 py-2.5 rounded-full outline-none focus:border-tint placeholder:text-text-secondary transition-colors border"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(['All', 'Active', 'Hidden'] as const).map((s) => (
            <PillButton key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</PillButton>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <PillButton key={cat} active={selectedCategory === cat} onClick={() => { setSelectedCategory(cat); setPage(1); }}>
            {cat}
          </PillButton>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        keyExtractor={(p) => p.id ?? p._id}
        loading={loading}
        emptyMessage="No inventory products found."
        minWidth={720}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PillButton>
        </div>
      )}

      <RestockModal
        isOpen={showRestock}
        onClose={() => { setShowRestock(false); setRestockProductId(undefined); }}
        products={mappedProductsForRestock}
        initialProductId={restockProductId}
        onRestock={handleRestockProduct}
        onRemoveStock={handleRemoveStockProduct}
      />

      <EditProductModal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        product={editProduct}
        categories={categoriesList}
        onUpdate={handleEditProduct}
      />

      <ProductInfoModal
        isOpen={!!infoProduct}
        onClose={() => setInfoProduct(null)}
        productId={infoProduct?.id ?? infoProduct?._id ?? ''}
        productName={infoProduct?.name ?? ''}
      />
    </div>
  );
}
