import React, { useEffect, useState } from 'react';
import { useCart } from '~/context/cart-context';
import { api } from '~/lib/api';
import { ProductCard } from '~/components/ui/product-card';
import { ProductGalleryModal } from '~/components/ui/product-gallery-modal';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';


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
  const { cart, addToCart, removeFromCart, getItemQuantity, cartCount, cartTotal } = useCart();
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
    <div className="flex flex-col gap-6 pb-20 min-w-0">
      {/* Featured Header Banner */}
      <div
        className="relative w-full h-56 md:h-72 overflow-hidden bg-gray-950 flex flex-col justify-end p-6 md:p-8"
        style={{
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <img
          src="https://www.africanrecipes.com.ng/wp-content/uploads/2025/07/meat-pie-featured-nigerian-snack.png.webp"
          alt="Nigeria meat pies layout"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-1 text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-rounded)' }}>
            RAD5 Café Menu
          </h1>
          <p className="text-white/80 text-xs md:text-sm font-medium">
            Hot coffee, fresh Nigerian snacks, pastries, and smart orders.
          </p>
        </div>
      </div>

      {/* Sticky Categories Bar + Search Box */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card border border-border p-4 rounded-xl shadow-xs">
        {/* Horizontal Scroll Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none min-w-0 flex-1 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-tint text-white'
                  : 'bg-bg-selected/50 text-text-secondary hover:bg-bg-selected hover:text-text-main'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search catalog items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 text-xs font-semibold bg-bg-element border border-border rounded-xl text-text-main placeholder:text-text-secondary/60 outline-none transition-all duration-200 focus:border-tint focus:ring-2 focus:ring-tint/10 focus:shadow-md cursor-pointer"
          />
          <div className="absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary/70 pointer-events-none flex items-center justify-center">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-text-secondary hover:bg-bg-selected/80 hover:text-text-main transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shimmer h-44 rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-text-secondary bg-card border border-border rounded-xl flex flex-col items-center justify-center gap-3">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span className="font-bold text-base text-text-main">No Products Found</span>
          <span className="text-xs">Try adjusting your category filter or search queries.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
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
