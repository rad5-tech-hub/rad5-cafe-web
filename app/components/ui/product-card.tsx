import React from 'react';

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
      className={`relative w-full flex flex-col bg-bg-element border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 select-none ${
        !inStock ? 'opacity-65 grayscale-[30%]' : ''
      }`}
      style={{
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Product Image Section */}
      <div className="relative aspect-square w-full bg-bg-selected overflow-hidden border-b border-border">
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
          className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${onImageClick ? 'cursor-pointer' : 'pointer-events-none'}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&h=200&fit=crop';
          }}
        />
        
        {/* Sold Out Overlay Tag */}
        {!inStock && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-error-val text-white px-2 py-0.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="flex flex-col p-3.5 flex-1 justify-between gap-3 bg-bg-element">
        {/* Product Name */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs sm:text-sm font-extrabold text-text-main truncate max-w-full leading-tight">
            {item.name}
          </span>
          {children}
        </div>

        {/* Pricing and Action Button Row */}
        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-xs sm:text-sm font-black text-tint whitespace-nowrap">
            ₦{item.price.toLocaleString()}
          </span>

          {/* Quantity Controls */}
          <div className="flex-shrink-0">
            {!inStock ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Out
              </span>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-1.5 bg-bg-selected rounded-lg p-0.5 border border-border">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-tint hover:bg-tint-dark text-white font-black text-xs cursor-pointer transition-colors active:scale-95"
                >
                  −
                </button>
                <span className="text-text-main font-bold text-xs min-w-[14px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(item);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-tint hover:bg-tint-dark text-white font-black text-xs cursor-pointer transition-colors active:scale-95"
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
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-tint hover:bg-tint-dark text-white font-bold text-base leading-none cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow-tint/20"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
