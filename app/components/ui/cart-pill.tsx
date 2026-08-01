import React from 'react';
import { Icon } from './icon';
import { Money } from './money';

type CartPillProps = {
  count: number;
  total: number;
  onClick: () => void;
  className?: string;
};

/**
 * CartPill — floating bottom-right cart button (cart icon + count badge),
 * expanding to show item count + total once the cart has items. Hidden by
 * the caller on landing/auth/pin-setup routes and while the cart/viewer is open.
 */
export const CartPill: React.FC<CartPillProps> = ({ count, total, onClick, className = '' }) => {
  if (count <= 0) return null;

  return (
    <button
      onClick={onClick}
      className={`fixed z-45 flex items-center gap-3 h-[58px] rounded-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] ${className}`}
      style={{
        padding: '5px 20px 5px 5px',
        border: '1px solid var(--glass-border)',
        background: 'linear-gradient(150deg, var(--glass-sheen), var(--surface) 45%, var(--surface-2))',
        backdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: '0 20px 46px -18px var(--shadow), inset 0 1px 0 var(--glass-sheen)',
        color: 'var(--color-text-main)',
      }}
    >
      <span className="relative w-[38px] h-[38px] flex-shrink-0 rounded-full grid place-items-center bg-tint-dark text-white">
        <Icon name="cart" size={18} color="currentColor" />
        <span
          className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-error-val text-white text-[11px] font-bold grid place-items-center"
          style={{ border: '2px solid var(--color-bg-page)' }}
        >
          {count}
        </span>
      </span>
      <span className="flex flex-col items-start gap-px pr-1">
        <span className="text-[11px] font-semibold text-text-secondary tracking-wide">{count} item{count > 1 ? 's' : ''}</span>
        <Money amount={total} className="text-[15px] font-semibold tracking-tight" />
      </span>
    </button>
  );
};
