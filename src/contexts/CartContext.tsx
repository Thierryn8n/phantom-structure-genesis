import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartContextData {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

// Contexto
const CartContext = createContext<CartContextData>({} as CartContextData);

// Hook personalizado para usar o contexto
export function useCart(): CartContextData {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  
  return context;
}

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado do carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Recupera os itens do carrinho do localStorage
    const storedItems = localStorage.getItem('@FiscalFlow:cart');
    return storedItems ? JSON.parse(storedItems) : [];
  });

  // Salva os itens do carrinho no localStorage sempre que houver alteração
  useEffect(() => {
    localStorage.setItem('@FiscalFlow:cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Adiciona um item ao carrinho
  const addToCart = (newItem: CartItem) => {
    setCartItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.id === newItem.id);

      if (existingItemIndex >= 0) {
        // Se o item já existe, atualiza a quantidade
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      }

      // Se o item não existe, adiciona ao carrinho
      return [...currentItems, newItem];
    });
  };

  // Remove um item do carrinho
  const removeFromCart = (itemId: string) => {
    setCartItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  // Atualiza a quantidade de um item
  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    setCartItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Limpa o carrinho
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcula o total do carrinho
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Retorna o número total de itens no carrinho
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}; 