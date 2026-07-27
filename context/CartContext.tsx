import { createContext, ReactNode, useContext, useState } from "react";
import { Alert } from "react-native";
type Product = {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    maxOrderQty?: number;
    stock?: number;
    unit?: string;
};

type CartItem = Product;

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: CartItem) => void;
    increaseQty: (name: string) => void;
    decreaseQty: (name: string) => void;
    removeFromCart: (name: string) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const clearCart = () => setCart([]);

    const addToCart = (product: CartItem) => {
    setCart(prev => {
        const existing = prev.find(
            item => item.name === product.name
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
                item.name === product.name
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

     const increaseQty = (name: string)=>{
                        setCart(prev => prev.map(item => {
                          if (item.name !== name)
                            return item;
                          if(
                            item.maxOrderQty && 
                            item.maxOrderQty >0 &&
                            item.quantity >= item.maxOrderQty
                          ){
                             Alert.alert(
                                    "Limit Reached",
                                    `Maximum ${item.maxOrderQty} units allowed`
                                );
                            return item;
                          }
                          if(item.stock &&
                            item.quantity >= item.stock
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

    const decreaseQty = (name: string) => {
        setCart(prev =>
            prev
                .map(item =>
                    item.name === name
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    };

    const removeFromCart = (name: string) => {
        setCart(prev => prev.filter(item => item.name !== name));
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
