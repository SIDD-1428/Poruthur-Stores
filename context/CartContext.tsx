import React, { createContext, ReactNode, useContext, useState } from "react";
import { Alert } from "react-native";

export type CartItem = {
  id: string; cartKey?: string; name: string; price: number; image: string;
  quantity: number; maxOrderQty?: number; stock?: number; unit?: string;
  selectedUnitId?: string; selectedUnitLabel?: string; baseQuantity?: number; baseUnit?: string;
};
type CartContextType = {
  cart: CartItem[]; addToCart: (product: CartItem) => void;
  increaseQty: (key: string) => void; decreaseQty: (key: string) => void;
  removeFromCart: (key: string) => void; clearCart: () => void;
};
const CartContext = createContext<CartContextType | undefined>(undefined);
const keyOf = (item: CartItem) => item.cartKey || (item.selectedUnitId ? item.id + "__" + item.selectedUnitId : item.id);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const clearCart = () => setCart([]);
  const addToCart = (product: CartItem) => {
    const key = keyOf(product);
    setCart(prev => {
      const existing = prev.find(item => keyOf(item) === key);
      if (existing) {
        const next = existing.quantity + 1;
        if (existing.maxOrderQty && next > existing.maxOrderQty) { Alert.alert("Limit Reached", "Maximum packs allowed"); return prev; }
        if (existing.stock != null && next * Number(existing.baseQuantity || 1) > Number(existing.stock)) { Alert.alert("Stock Limit", "This exceeds available stock."); return prev; }
        return prev.map(item => keyOf(item) === key ? { ...item, quantity: next } : item);
      }
      if (product.stock != null && Number(product.baseQuantity || 1) > Number(product.stock)) { Alert.alert("Out of Stock", "There is not enough stock for this pack size."); return prev; }
      return [...prev, { ...product, cartKey: key, baseQuantity: Number(product.baseQuantity || 1), quantity: 1 }];
    });
  };
  const increaseQty = (key: string) => setCart(prev => prev.map(item => {
    if (keyOf(item) !== key && item.id !== key) return item;
    const next = item.quantity + 1;
    if (item.maxOrderQty && next > item.maxOrderQty) { Alert.alert("Limit Reached", "Maximum packs allowed"); return item; }
    if (item.stock != null && next * Number(item.baseQuantity || 1) > Number(item.stock)) { Alert.alert("Stock Limit", "This exceeds available stock."); return item; }
    return { ...item, quantity: next };
  }));
  const decreaseQty = (key: string) => setCart(prev => prev.map(item => keyOf(item) === key || item.id === key ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  const removeFromCart = (key: string) => setCart(prev => prev.filter(item => keyOf(item) !== key && item.id !== key));
  return React.createElement(CartContext.Provider, { value: { cart, addToCart, increaseQty, decreaseQty, removeFromCart, clearCart } }, children);
};
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
