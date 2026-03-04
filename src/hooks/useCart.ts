"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string | null;
    brand: string | null;
    price: number;
    imageUrl: string | null;
  };
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export function useCart() {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartData>({
    items: [],
    subtotal: 0,
    itemCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener o crear sessionId
  const getSessionId = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    let sessionId = localStorage.getItem("cart_session_id");
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("cart_session_id", sessionId);
      console.log('[useCart] Created sessionId:', sessionId);
    }
    return sessionId;
  }, []);

  // Fetch cart - USA EL ENDPOINT QUE FUNCIONA: /api/cart (GET)
  const fetchCart = useCallback(async () => {
    try {
      const userId = session?.user?.id;
      const sessionId = getSessionId();

      if (!userId && !sessionId) {
        setCart({ items: [], subtotal: 0, itemCount: 0 });
        return;
      }

      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      else if (sessionId) params.append("sessionId", sessionId);

      // USA /api/cart (no /api/cart/get)
      const url = `/api/cart?${params}`;
      console.log('[useCart] Fetching from:', url);

      const res = await fetch(url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[useCart] Fetch error:', res.status, errorText);
        throw new Error(`Failed to fetch cart: ${res.status}`);
      }

      const data = await res.json();
      console.log('[useCart] Fetched cart:', data);
      
      // Adaptar respuesta a formato esperado
      setCart({
        items: data.items || [],
        subtotal: data.cartTotal || 0,
        itemCount: data.itemCount || data.count || 0,
      });
      
      setError(null);
    } catch (error) {
      console.error('[useCart] Fetch error:', error);
      setError((error as Error).message);
      // No mostrar error al usuario si simplemente no hay items
      setCart({ items: [], subtotal: 0, itemCount: 0 });
    }
  }, [session, getSessionId]);

  // Add to cart - USA /api/cart/add
  const addToCart = async (productId: number, quantity: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionId = getSessionId();

      console.log('[useCart] Adding to cart:', { productId, quantity, sessionId });

      const body = {
        productId,
        quantity,
        sessionId,
      };

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[useCart] Add error:', res.status, errorText);
        throw new Error(`Failed to add to cart: ${res.status}`);
      }

      const data = await res.json();
      console.log('[useCart] Add response:', data);

      // La respuesta de /api/cart/add trae el cart completo
      if (data.ok) {
        setCart({
          items: data.items || [],
          subtotal: data.subtotal || 0,
          itemCount: data.itemCount || 0,
        });
      }
      
      // Dispatch event para otros componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("cart:updated"));
      }
      
    } catch (error) {
      console.error('[useCart] Add error:', error);
      setError((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity - USA /api/cart (PUT)
  const updateQuantity = async (itemId: number, quantity: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/cart?id=${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        throw new Error('Failed to update cart');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("cart:updated"));
      }
      
      await fetchCart();
    } catch (error) {
      console.error('[useCart] Update error:', error);
      setError((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item - USA /api/cart (DELETE)
  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/cart?id=${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error('Failed to remove item');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("cart:updated"));
      }
      
      await fetchCart();
    } catch (error) {
      console.error('[useCart] Remove error:', error);
      setError((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = session?.user?.id;
      const sessionId = getSessionId();

      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      else if (sessionId) params.append("sessionId", sessionId);

      const res = await fetch(`/api/cart?${params}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error('Failed to clear cart');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("cart:updated"));
      }

      setCart({ items: [], subtotal: 0, itemCount: 0 });
    } catch (error) {
      console.error('[useCart] Clear error:', error);
      setError((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to cart:updated events
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('[useCart] Cart updated event received');
      fetchCart();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cart:updated', handleCartUpdate);
      return () => window.removeEventListener('cart:updated', handleCartUpdate);
    }
  }, [fetchCart]);

  // Initial fetch
  useEffect(() => {
    console.log('[useCart] Initial fetch');
    fetchCart();
  }, [fetchCart]);

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refetch: fetchCart,
  };
}
