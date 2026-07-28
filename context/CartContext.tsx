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
    increaseQty: (id: string) => void;
    decreaseQty: (id: string) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

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
