"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface CartItem {
  id: number;
  productId: number;
  name: string;
  brand: string;
  reference: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: any) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id") || `guest_${Date.now()}_${Math.random()}`;
      
      if (!localStorage.getItem("guest_session_id")) {
        localStorage.setItem("guest_session_id", sessionId);
      }

      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers["X-Session-Id"] = sessionId;
      }

      const response = await fetch("/api/cart", { headers });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addItem = async (product: any) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (sessionId) {
        headers["X-Session-Id"] = sessionId;
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers,
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (response.ok) {
        await fetchCart();
        toast.success(`${product.name} añadido al carrito`);
      } else {
        toast.error("Error al añadir al carrito");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error al añadir al carrito");
    }
  };

  const removeItem = async (productId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (sessionId) {
        headers["X-Session-Id"] = sessionId;
      }

      const response = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        await fetchCart();
        toast.success("Producto eliminado del carrito");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Error al eliminar del carrito");
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) {
      await removeItem(productId);
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (sessionId) {
        headers["X-Session-Id"] = sessionId;
      }

      const response = await fetch("/api/cart", {
        method: "PUT",
        headers,
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Error al actualizar cantidad");
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (sessionId) {
        headers["X-Session-Id"] = sessionId;
      }

      const response = await fetch("/api/cart?all=true", {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        setItems([]);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const refreshCart = fetchCart;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
