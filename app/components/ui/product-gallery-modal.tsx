import React, { useEffect, useState, useRef } from 'react';
import { Icon } from './icon';
import { useCart } from '~/context/cart-context';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type ProductGalleryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  initialIndex?: number;
  onAddToCart?: (item: CartItem) => void;
};

export const ProductGalleryModal: React.FC<ProductGalleryModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}) => {
  const { cart, addToCart, removeFromCart, getItemQuantity, cartCount, cartTotal, setIsCartOpen } = useCart();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current && isOpen) {
      const activeThumbnail = scrollRef.current.children[currentIndex] as HTMLElement;
      if (activeThumbnail) {
        activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, isOpen]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(currentItem);
    
    // Optional: visual feedback
    const btn = e.currentTarget as HTMLButtonElement;
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 150);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header / Close Button */}
      <div className="absolute top-0 w-full flex justify-between items-center p-4 z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="text-white text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-sm backdrop-blur-md">
            {currentIndex + 1} / {items.length}
          </div>
          {cartCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                setIsCartOpen(true);
              }}
              className="text-white text-sm font-bold bg-tint px-3 py-1.5 rounded-full border border-tint/25 shadow-lg flex items-center gap-1.5 animate-pulse-slow cursor-pointer hover:bg-tint-dark active:scale-95 transition-all"
            >
              <Icon name="shopping-cart" size={14} />
              <span>{cartCount} in cart (₦{cartTotal.toLocaleString()})</span>
            </button>
          )}
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-white/20 transition-colors pointer-events-auto border border-white/10 shadow-sm backdrop-blur-md"
        >
          <Icon name="x" size={24} />
        </button>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden w-full h-full">
        {/* Navigation Arrows */}
        <button 
          onClick={goPrev}
          className="absolute left-4 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md"
        >
          <Icon name="chevron-left" size={32} />
        </button>

        <img 
          src={currentItem.image}
          alt={currentItem.name}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain select-none animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        />

        <button 
          onClick={goNext}
          className="absolute right-4 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md"
        >
          <Icon name="chevron-right" size={32} />
        </button>
        
        {/* Product Details & Add to Cart over the image */}
        <div className="absolute bottom-6 w-full px-6 flex flex-col items-center pointer-events-none">
           <div className="bg-black/70 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between gap-6 pointer-events-auto border border-white/10 shadow-2xl min-w-[300px] max-w-[90%]">
             <div className="flex flex-col">
               <span className="text-white font-bold text-lg leading-tight">{currentItem.name}</span>
               <span className="text-tint font-extrabold text-xl mt-0.5">₦{currentItem.price.toLocaleString()}</span>
             </div>
             {getItemQuantity(currentItem.id) > 0 ? (
               <div className="flex items-center gap-2 bg-black/75 rounded-xl p-0.5 border border-white/10">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     removeFromCart(currentItem.id);
                   }}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-tint hover:bg-tint/90 active:scale-95 text-white font-bold text-base cursor-pointer"
                 >
                   −
                 </button>
                 <span className="text-white font-bold text-sm min-w-[20px] text-center">
                   {getItemQuantity(currentItem.id)}
                 </span>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     addToCart(currentItem);
                   }}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-tint hover:bg-tint/90 active:scale-95 text-white font-bold text-base cursor-pointer"
                 >
                   +
                 </button>
               </div>
             ) : (
               <button
                 onClick={handleAdd}
                 className="bg-tint hover:bg-tint/90 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform shadow-lg shadow-tint/30 cursor-pointer"
               >
                 <Icon name="shopping-cart" size={18} />
                 <span>Add</span>
               </button>
             )}
           </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="h-28 w-full bg-black/80 flex items-center px-4 overflow-hidden border-t border-white/10">
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto w-full py-2 no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => (
            <div 
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${idx === currentIndex ? 'border-tint scale-105 shadow-[0_0_15px_rgba(var(--tint),0.5)]' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
