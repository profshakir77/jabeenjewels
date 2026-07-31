import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
}

function sameItem(a: { productId: number; color?: string }, b: { productId: number; color?: string }) {
  return a.productId === b.productId && (a.color ?? "") === (b.color ?? "");
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, color?: string) => void;
  updateQuantity: (productId: number, quantity: number, color?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("jabeen-jewels-cart");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error parsing cart from localStorage", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("jabeen-jewels-cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameItem(i, newItem));
      if (existing) {
        return prev.map((i) =>
          sameItem(i, newItem)
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: number, color?: string) => {
    setItems((prev) => prev.filter((i) => !sameItem(i, { productId, color })));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, color?: string) => {
    setItems((prev) =>
      prev.map((i) => (sameItem(i, { productId, color }) ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}