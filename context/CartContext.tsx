import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { db } from "../firebase/config";
import { Alert } from "react-native";
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

    // Keep items already in the cart synchronized with the live product document.
    const cartProductIds = cart.map(item => item.id).sort().join("|");

    useEffect(() => {
        if (!cartProductIds) return;

        const ids = cartProductIds.split("|");
        const unsubscribers = ids.map(id =>
            db.collection("products").doc(id).onSnapshot(snapshot => {
                if (!snapshot.exists) return;
                const data = snapshot.data() as any;
                if (!data) return;

                setCart(prev => prev.map(item => {
                    if (item.id !== id) return item;
                    const nextPrice = Number(data.price);
                    const nextMrp = Number(data.mrp);
                    return {
                        ...item,
                        name: typeof data.name === "string" ? data.name : item.name,
                        price: Number.isFinite(nextPrice) ? nextPrice : item.price,
                        mrp: Number.isFinite(nextMrp) ? nextMrp : item.mrp,
                        image: typeof data.image === "string" ? data.image : item.image,
                        thumbnailUrl: typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : item.thumbnailUrl,
                        stock: data.stock != null ? Number(data.stock) : item.stock,
                        maxOrderQty: data.maxOrderQty != null ? Number(data.maxOrderQty) : item.maxOrderQty,
                        unit: typeof data.unit === "string" ? data.unit : item.unit,
                    };
                }));
            }, error => console.log("Cart product listener:", error.message))
        );

        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }, [cartProductIds]);

    const clearCart = () => setCart([]);

    const addToCart = (product: CartItem) => {
    setCart(prev => {
        const existing = prev.find(
            item => item.id === product.id
        );

        if (existing) {

            if (
                existing.maxOrderQty &&
                existing.maxOrderQty > 0 &&
                existing.quantity >= existing.maxOrderQty
            ) {
                return prev;
            }

            if (
                existing.stock &&
                existing.quantity >= existing.stock
            ) {
                return prev;
            }

            return prev.map(item =>
                item.id === product.id
                    ? {
                        ...item,
                        quantity: item.quantity + 1,
                    }
                    : item
            );
        }

        return [
            ...prev,
            {
                ...product,
                quantity: 1,
            },
        ];
    });
};

     const increaseQty = (id: string)=>{

                        setCart(prev => prev.map(item => {
                            console.log({
                                id:item.id,
                                quantity:item.quantity,
                                maxOrderQty: item.maxOrderQty,
                                stock:item.stock,
                                maxOrderQtyType:typeof item.maxOrderQty,
                                stockType:typeof item.stock,
                            });

                            if (item.id !== id)
                            return item;
                          if(
                            item.maxOrderQty !=null && 
                            item.quantity >= Number(item.maxOrderQty)
                          ){
                             Alert.alert(
                                    "Limit Reached",
                                    `Maximum ${item.maxOrderQty} units allowed`
                                );
                            return item;
                          }
                          if(item.stock!= null &&
                            item.quantity >= Number(item.stock)
                          ){
                            Alert.alert("Out of Stock","Sorry! That's all we have at this moment.")
                            return item;
                          }
    
                          return {
                            ...item,
                            quantity:item.quantity +1,
                          };
    
                        })
                      );
                      } ;

    const decreaseQty = (id: string) => {
        setCart(prev =>
            prev
                .map(item =>
                    item.id === id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, increaseQty, decreaseQty, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
