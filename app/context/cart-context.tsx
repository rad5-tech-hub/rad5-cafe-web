import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  cart: CartItem[];
  getItemQuantity: (itemId: string) => number;
  cartTotal: number;
  cartCount: number;
};

type CartActions = {
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
};

const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i,
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const actions = useMemo(() => ({ addToCart, removeFromCart, clearCart }), [addToCart, removeFromCart, clearCart]);

  const getItemQuantity = useCallback(
    (itemId: string) => cart.find((i) => i.id === itemId)?.quantity || 0,
    [cart],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const state = useMemo(
    () => ({ cart, getItemQuantity, cartTotal, cartCount }),
    [cart, getItemQuantity, cartTotal, cartCount],
  );

  return (
    <CartStateContext.Provider value={state}>
      <CartActionsContext.Provider value={actions}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCartState() {
  const context = useContext(CartStateContext);
  if (!context) throw new Error("useCartState must be used within a CartProvider");
  return context;
}

export function useCartActions() {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error("useCartActions must be used within a CartProvider");
  return context;
}

export function useCart() {
  const state = useCartState();
  const actions = useCartActions();
  return { ...state, ...actions };
}
