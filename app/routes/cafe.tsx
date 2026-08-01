import React, { useEffect, useState } from 'react';
import { useCart } from '~/context/cart-context';
import { api } from '~/lib/api';
import { ProductCard } from '~/components/ui/product-card';
import { ProductGalleryModal } from '~/components/ui/product-gallery-modal';
import { PillButton } from '~/components/ui/pill-button';
import { Icon } from '~/components/ui/icon';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  inStock: boolean;
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&h=200&fit=crop';

export function meta() {
  return [
    { title: "Café Catalog - RAD5 Café" },
    { name: "description", content: "Explore hot coffee, snacks, pastries, and meals at RAD5 Café." },
  ];
}

export default function Cafe() {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.products.list(),
      api.categories.list(),
    ])
      .then(([prodRes, catRes]: any) => {
        let catMap: Record<string, string> = {};
        if (catRes.success && Array.isArray(catRes.data)) {
          const catNames = catRes.data.map((c: any) => c.name).filter(Boolean);
          setCategories(['All', ...catNames]);
          catRes.data.forEach((c: any) => {
            const cid = c.id || c._id;
            if (cid) catMap[cid] = c.name;
          });
        }

        const prodArray = prodRes.products || prodRes.data;
        if (prodRes.success && Array.isArray(prodArray)) {
          const parsed = prodArray.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            category: catMap[item.categoryId] || item.category || 'Others',
            price: item.sellingPrice ?? item.price ?? 0,
            image: item.imageUrl || DEFAULT_IMAGE,
            inStock: (item.quantity ?? item.currentStock ?? item.stock ?? 0) > 0,
          }));
          setProductsList(parsed);
        } else {
          setProductsList([]);
        }
      })
      .catch(() => {
        setProductsList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = productsList.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5 pb-16 min-w-0">
      {/* Search + Category chips */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search the menu"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm font-medium glass-chip rounded-xl text-text-main placeholder:text-text-secondary/70 outline-none transition-all focus:border-tint"
          />
          <div className="absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary/70 pointer-events-none">
            <Icon name="search" size={16} />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-text-secondary hover:bg-bg-selected/80 hover:text-text-main transition-colors cursor-pointer"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <PillButton key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>
              {cat}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shimmer h-64 rounded-2xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 glass-surface rounded-2xl flex flex-col items-center justify-center gap-3">
          <Icon name="package-variant-closed" size={40} className="text-text-secondary" />
          <span className="font-bold text-base">No Products Found</span>
          <span className="text-xs text-text-secondary">Try adjusting your category filter or search queries.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-1">
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={product.id}
              item={product}
              quantity={getItemQuantity(product.id)}
              inStock={product.inStock}
              onAdd={addToCart}
              onRemove={removeFromCart}
              onImageClick={() => {
                setGalleryIndex(idx);
                setGalleryOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <ProductGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        items={filteredProducts}
        initialIndex={galleryIndex}
        onAddToCart={addToCart}
      />
    </div>
  );
}
