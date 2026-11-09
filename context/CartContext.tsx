import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { db } from "../firebase/config";

type Product = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  thumbnailUrl?: string;
  quantity: number;
  maxOrderQty?: number;
  stock?: number;
  unit?: string;
};
type CartItem = Product;
type CartContextType = {
  cart: CartItem[];
  addToCart: (product: CartItem) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartIds = useMemo(() => cart.map(item => item.id).sort().join("|"), [cart]);

  // Keep every cart line synchronized with the live catalogue. Quantity is
  // deliberately preserved; only admin-managed product fields are refreshed.
  useEffect(() => {
    if (!cartIds) return;
    const ids = cartIds.split("|");
    const unsubscribers = ids.map(id =>
      db.collection("products").doc(id).onSnapshot(
        snapshot => {
          if (!snapshot.exists) {
            setCart(current => current.map(item => item.id === id ? { ...item, stock: 0 } : item));
            return;
          }
          const data = snapshot.data() as any;
          if (!data) return;
          setCart(current => current.map(item => {
            if (item.id !== id) return item;
            return {
              ...item,
              name: data.name ?? item.name,
              price: Number(data.price ?? item.price),
              mrp: Number(data.mrp ?? data.price ?? item.mrp ?? item.price),
              image: data.image ?? item.image,
              thumbnailUrl: data.thumbnailUrl ?? data.image ?? item.thumbnailUrl ?? item.image,
              stock: data.stock == null ? item.stock : Number(data.stock),
              maxOrderQty: data.maxOrderQty == null ? undefined : Number(data.maxOrderQty),
              unit: data.unit ?? item.unit,
            };
          }));
        },
        error => console.warn("Cart product sync failed:", id, error.message)
      )
    );
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [cartIds]);

  const clearCart = () => setCart([]);
  const addToCart = (product: CartItem) => {
    setCart(previous => {
      const existing = previous.find(item => item.id === product.id);
      if (existing) {
        const limit = existing.maxOrderQty != null && existing.maxOrderQty > 0
          ? Math.min(existing.maxOrderQty, existing.stock ?? Infinity)
          : existing.stock ?? Infinity;
        if (existing.quantity >= limit) {
          Alert.alert("Limit Reached", "You have added the maximum available quantity.");
          return previous;
        }
        return previous.map(item => item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              price: product.price,
              mrp: product.mrp,
              image: product.image ?? item.image,
              thumbnailUrl: product.thumbnailUrl ?? item.thumbnailUrl,
            }
          : item);
      }
      if ((product.stock ?? 0) <= 0) {
        Alert.alert("Out of Stock", "This product is currently unavailable.");
        return previous;
      }
      return [...previous, { ...product, quantity: 1 }];
    });
  };

  const increaseQty = (id: string) => {
    setCart(previous => previous.map(item => {
      if (item.id !== id) return item;
      const limit = item.maxOrderQty != null && item.maxOrderQty > 0
        ? Math.min(item.maxOrderQty, item.stock ?? Infinity)
        : item.stock ?? Infinity;
      if (item.quantity >= limit) {
        Alert.alert("Limit Reached", "Sorry, the maximum available quantity has been reached.");
        return item;
      }
      return { ...item, quantity: item.quantity + 1 };
    }));
  };

  const decreaseQty = (id: string) => setCart(previous =>
    previous.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item)
      .filter(item => item.quantity > 0)
  );
  const removeFromCart = (id: string) => setCart(previous => previous.filter(item => item.id !== id));

  return (
    <CartContext.Provider value={{ cart, addToCart, increaseQty, decreaseQty, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
