import React from 'react';
import { ProductRow } from '~/components/ui/product-row';

export type FrequentItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  inStock: boolean;
};

type FrequentItemsProps = {
  items: FrequentItem[];
  loading: boolean;
  getQuantity: (id: string) => number;
  onAdd: (item: { id: string; name: string; price: number; image: string }) => void;
  onRemove: (id: string) => void;
  onOpen: (index: number) => void;
};

/** FrequentItems — the "You order these often" product row grid on the dashboard. */
export const FrequentItems: React.FC<FrequentItemsProps> = ({ items, loading, getQuantity, onAdd, onRemove, onOpen }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shimmer h-[86px] rounded-[18px]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm glass-surface rounded-2xl border-dashed">
        No products available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {items.map((item, idx) => (
        <ProductRow
          key={item.id}
          name={item.name}
          sub={item.category}
          price={item.price}
          image={item.image}
          inStock={item.inStock}
          quantity={getQuantity(item.id)}
          onOpen={() => onOpen(idx)}
          onAdd={() => onAdd(item)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </div>
  );
};
