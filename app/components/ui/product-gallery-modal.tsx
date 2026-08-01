import React, { useEffect, useState } from 'react';
import { Icon } from './icon';
import { Money } from './money';
import { useCart } from '~/context/cart-context';

type GalleryProduct = {
  id: string;
  name: string;
  category?: string;
  price: number;
  image: string;
  inStock?: boolean;
};

type ProductGalleryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryProduct[];
  initialIndex?: number;
  onAddToCart?: (item: GalleryProduct) => void;
};

/**
 * ProductGalleryModal — full-screen product viewer/lightbox. Prev/next
 * navigation through the currently-filtered product list, a qty stepper,
 * an add-to-cart/view-cart CTA and dot pagination — the glass "viewer" overlay.
 */
export const ProductGalleryModal: React.FC<ProductGalleryModalProps> = ({ isOpen, onClose, items, initialIndex = 0 }) => {
  const { addToCart, removeFromCart, getItemQuantity, cartCount, setIsCartOpen } = useCart();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items.length]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const quantity = getItemQuantity(currentItem.id);
  const inStock = currentItem.inStock !== false;

  const goNext = () => setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) (dx > 0 ? goPrev() : goNext());
    setTouchStartX(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[65] flex flex-col animate-rad5-in"
      style={{ background: 'var(--viewer-bg)', backdropFilter: 'blur(20px) saturate(150%)' }}
    >
      <div className="flex items-center gap-3 px-4.5 py-4">
        <span className="font-money text-xs text-text-secondary">
          {currentIndex + 1} / {items.length}
        </span>
        <span className="text-xs text-text-secondary hidden sm:inline">Use arrow keys or swipe to browse</span>
        {cartCount > 0 && (
          <button
            onClick={() => {
              onClose();
              setIsCartOpen(true);
            }}
            className="ml-2 px-3 py-1.5 rounded-full bg-tint-dark text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-tint transition-colors"
          >
            <Icon name="shopping-cart" size={13} />
            {cartCount} in cart
          </button>
        )}
        <button
          onClick={onClose}
          className="ml-auto w-[38px] h-[38px] rounded-xl border border-border bg-surface grid place-items-center cursor-pointer hover:border-tint hover:text-tint transition-colors"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center gap-3.5 px-4 pb-4">
        <button
          onClick={goPrev}
          className="hidden sm:grid w-[46px] h-[46px] flex-shrink-0 rounded-full border border-border bg-surface place-items-center cursor-pointer hover:border-tint hover:text-tint transition-colors"
        >
          <Icon name="chevron-left" size={18} />
        </button>

        <div className="flex-1 min-w-0 max-w-[860px] mx-auto flex flex-col gap-4.5">
          <div
            className="relative rounded-[26px] overflow-hidden border border-glass-border grid place-items-center animate-rad5-pop bg-cover bg-center"
            style={{
              height: 'min(46vh, 420px)',
              backgroundImage: currentItem.image
                ? `url(${currentItem.image})`
                : 'repeating-linear-gradient(135deg, var(--tint-b) 0 12px, transparent 12px 24px)',
            }}
          >
            <span
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
              style={{
                background: 'var(--sheet)',
                border: '1px solid var(--glass-border)',
                color: inStock ? 'var(--color-ok)' : 'var(--color-err)',
              }}
            >
              {inStock ? 'In stock' : 'Sold out'}
            </span>
          </div>

          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              {currentItem.category && (
                <div className="text-xs font-bold tracking-[0.08em] text-text-secondary uppercase">{currentItem.category}</div>
              )}
              <h2 className="mt-1.5 text-2xl sm:text-[28px] tracking-tight font-extrabold text-balance">{currentItem.name}</h2>
              <Money amount={currentItem.price} className="block mt-2 text-2xl font-semibold tracking-tight" />
            </div>

            <div className="flex items-center gap-3">
              {inStock && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-full glass-surface">
                  <button
                    onClick={() => removeFromCart(currentItem.id)}
                    disabled={quantity === 0}
                    className="w-[46px] h-[46px] rounded-full border border-border bg-card grid place-items-center cursor-pointer hover:border-tint hover:text-tint disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Icon name="minus" size={17} />
                  </button>
                  <span className="min-w-[34px] text-center font-money text-[17px] font-semibold">{quantity}</span>
                  <button
                    onClick={() => addToCart(currentItem)}
                    className="w-[46px] h-[46px] rounded-full border-none bg-tint-dark text-white grid place-items-center cursor-pointer hover:brightness-110 transition-all"
                  >
                    <Icon name="plus" size={17} />
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  if (!inStock) return;
                  if (quantity > 0) {
                    onClose();
                    setIsCartOpen(true);
                  } else {
                    addToCart(currentItem);
                  }
                }}
                disabled={!inStock}
                className="h-[58px] flex-shrink-0 whitespace-nowrap px-6 rounded-full border-none text-white text-[14.5px] font-bold cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: inStock ? 'var(--color-tint-dark)' : 'var(--color-border-strong)' }}
              >
                {!inStock ? 'Sold out' : quantity > 0 ? 'View cart' : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={goNext}
          className="hidden sm:grid w-[46px] h-[46px] flex-shrink-0 rounded-full border border-border bg-surface place-items-center cursor-pointer hover:border-tint hover:text-tint transition-colors"
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </div>

      <div className="flex justify-center gap-1.5 px-4 pb-6 pt-1 flex-wrap">
        {items.map((item, i) => (
          <span
            key={item.id}
            onClick={() => setCurrentIndex(i)}
            title={item.name}
            className="h-[7px] rounded-full cursor-pointer transition-all"
            style={{
              width: i === currentIndex ? 22 : 7,
              background: i === currentIndex ? 'var(--color-tint)' : 'var(--color-border-strong)',
            }}
          />
        ))}
      </div>
    </div>
  );
};
