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
      className={`relative w-full aspect-square bg-bg-element border border-border flex flex-col justify-end overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.03] select-none ${
        !inStock ? 'opacity-65 grayscale-[30%]' : ''
      }`}
      style={{
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Product Image */}
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
        style={{ maxWidth: '100%', maxHeight: '100%' }}
        className={`absolute inset-0 w-full h-full object-cover select-none transition-transform duration-500 hover:scale-105 ${onImageClick ? 'cursor-pointer' : 'pointer-events-none'}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&h=200&fit=crop';
        }}
      />
      {/* Bottom Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />

      {/* Top Right Quantity Controls */}
      <div className="absolute top-2.5 right-2.5 z-10">
        {!inStock ? (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-error-val text-white px-2 py-0.5 rounded-full">
            Sold Out
          </span>
        ) : quantity > 0 ? (
          <div className="flex items-center gap-1 bg-black/75 rounded-full p-0.5 border border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-tint hover:bg-tint/90 active:scale-95 text-white font-bold text-sm cursor-pointer"
            >
              −
            </button>
            <span className="text-white font-bold text-xs min-w-[18px] text-center">
              {quantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-tint hover:bg-tint/90 active:scale-95 text-white font-bold text-sm cursor-pointer"
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
            className="w-7 h-7 flex items-center justify-center rounded-full bg-tint hover:bg-tint/90 active:scale-95 text-white font-bold text-lg leading-none cursor-pointer border border-white/10"
          >
            +
          </button>
        )}
      </div>

      {/* Card Content Overlay */}
      <div className="relative z-10 w-full p-3 flex flex-col items-center gap-0.5 bg-black/70 text-white text-center">
        {children || (
          <>
            <span className="text-xs font-bold truncate max-w-full leading-tight">{item.name}</span>
            <span className="text-xs font-extrabold tracking-wide">
              ₦{item.price.toLocaleString()}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
