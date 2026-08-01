import React from 'react';
import { Money } from './money';

type ProductRowProps = {
  name: string;
  sub: string;
  price: number;
  image?: string;
  inStock?: boolean;
  quantity?: number;
  onOpen?: () => void;
  onAdd: () => void;
  onRemove?: () => void;
  className?: string;
};

/**
 * ProductRow — compact glass card used for "You order these often" on the
 * dashboard: thumbnail, name, caption, mono price and an add/stepper control.
 */
export const ProductRow: React.FC<ProductRowProps> = ({
  name,
  sub,
  price,
  image,
  inStock = true,
  quantity = 0,
  onOpen,
  onAdd,
  onRemove,
  className = '',
}) => {
  return (
    <div className={`glass-sheen rounded-[18px] p-3.5 flex gap-3 transition-transform duration-200 hover:-translate-y-0.5 ${className}`}>
      <div
        onClick={onOpen}
        className="w-[52px] h-[52px] flex-shrink-0 rounded-xl bg-cover bg-center"
        style={{
          cursor: onOpen ? 'zoom-in' : undefined,
          backgroundImage: image
            ? `url(${image})`
            : 'repeating-linear-gradient(135deg, var(--tint-b) 0 6px, var(--tint-a) 6px 12px)',
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold tracking-tight truncate">{name}</div>
        <div className="text-[11.5px] text-text-secondary mt-0.5 truncate">{sub}</div>
        <div className="flex items-center gap-2 mt-2">
          <Money amount={price} className="text-[13px] font-semibold" />
          {!inStock ? (
            <button disabled className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold cursor-not-allowed bg-border text-text-secondary">
              Sold out
            </button>
          ) : quantity > 0 ? (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onRemove}
                className="w-7 h-7 rounded-lg border border-border bg-card cursor-pointer hover:border-tint hover:text-tint"
              >
                −
              </button>
              <span className="font-money text-[13px] font-semibold w-4 text-center">{quantity}</span>
              <button onClick={onAdd} className="w-7 h-7 rounded-lg border-none bg-tint-dark text-white cursor-pointer hover:bg-tint">
                +
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-tint-dark text-white hover:brightness-110"
            >
              Reorder
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
