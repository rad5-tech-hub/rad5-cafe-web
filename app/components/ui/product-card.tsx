import React from 'react';
import { Money } from './money';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type ProductCardProps = {
  item: Omit<CartItem, 'quantity'>;
  quantity: number;
  inStock?: boolean;
  onAdd: (item: Omit<CartItem, 'quantity'>) => void;
  onRemove: (itemId: string) => void;
  onImageClick?: () => void;
  renderImage?: (uri: string) => React.ReactNode;
  children?: React.ReactNode;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  quantity,
  inStock = true,
  onAdd,
  onRemove,
  onImageClick,
  children,
}) => {
  return (
    <div
      className={`relative w-full flex flex-col rounded-[20px] overflow-hidden glass-sheen transition-all duration-200 hover:-translate-y-1 hover:border-tint-c select-none ${
        !inStock ? 'opacity-70 grayscale-[25%]' : ''
      }`}
    >
      {/* Product Image Section */}
      <div className="relative aspect-square w-full bg-cover bg-center border-b border-glass-border overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onClick={(e) => {
            if (onImageClick) {
              e.stopPropagation();
              onImageClick();
            }
          }}
          className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${onImageClick ? 'cursor-zoom-in' : 'pointer-events-none'}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&h=200&fit=crop';
          }}
        />

        {!inStock && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-error-val text-white px-2 py-0.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="flex flex-col p-3.5 flex-1 justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[14.5px] font-bold tracking-tight text-text-main truncate max-w-full leading-tight">
            {item.name}
          </span>
          {children}
        </div>

        <div className="flex items-center justify-between mt-auto gap-2">
          <Money amount={item.price} className="text-sm font-semibold" />

          <div className="flex-shrink-0">
            {!inStock ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Out</span>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="w-8 h-8 rounded-lg border border-border bg-card text-base cursor-pointer transition-colors hover:border-tint hover:text-tint"
                >
                  −
                </button>
                <span className="font-money text-text-main font-semibold text-sm min-w-[16px] text-center">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(item);
                  }}
                  className="w-8 h-8 rounded-lg border-none bg-tint-dark text-white text-base cursor-pointer transition-colors hover:bg-tint"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(item);
                }}
                className="px-3.5 py-2 rounded-[11px] bg-tint-dark hover:bg-tint text-white text-xs font-bold cursor-pointer transition-all"
              >
                Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
