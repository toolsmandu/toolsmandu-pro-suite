import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  duration: string | null;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [], addItem: () => {}, removeItem: () => {},
  updateQuantity: () => {}, clearCart: () => {}, total: 0, itemCount: 0,
});

export const useCart = () => useContext(CartContext);

const getItemKey = (item: { id: string; variantId?: string }) =>
  item.variantId ? `${item.id}_${item.variantId}` : item.id;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('toolsmandu_cart');
      const parsed = saved ? JSON.parse(saved) : [];
      if (parsed.length > 0) return parsed;
      // Restore from backup if main cart is empty (e.g. after payment redirect back)
      const backup = localStorage.getItem('toolsmandu_cart_backup');
      return backup ? JSON.parse(backup) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('toolsmandu_cart', JSON.stringify(items));
    if (items.length > 0) {
      localStorage.setItem('toolsmandu_cart_backup', JSON.stringify(items));
    }
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const key = getItemKey(item);
      const existing = prev.find(i => getItemKey(i) === key);
      if (existing) {
        toast.info('This item is already in your cart');
        return prev;
      }
      toast.success('Item added to cart ✓');
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string, variantId?: string) => {
    const key = variantId ? `${id}_${variantId}` : id;
    setItems(prev => prev.filter(i => getItemKey(i) !== key));
    toast.info('Item removed from cart');
  };

  const updateQuantity = (id: string, quantity: number, variantId?: string) => {
    if (quantity < 1) return removeItem(id, variantId);
    const key = variantId ? `${id}_${variantId}` : id;
    setItems(prev => prev.map(i => getItemKey(i) === key ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('toolsmandu_cart_backup');
  };
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};
