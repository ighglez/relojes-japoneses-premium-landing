// src/contexts/CartContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { trackAddToCart } from "@/lib/analytics";

const CART_EVENT = "cart:updated";

type ApiCartItem = {
  id: number;
  productId: number | null;
  quantity: number;
  product?: {
    id?: number;
    name?: string | null;
    brand?: string | null;
    reference?: string | null;
    price?: number | null;
    stock?: number | null;
    imageUrl?: string | null;
  } | null;
};

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
  isLoading: boolean;
  addItem: (product: { id: number; name: string; brand: string; reference: string; price: number }) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  removeByProductId: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function ensureGuestSessionId(): string {
  let sid = null;
  try {
    sid = localStorage.getItem("guest_session_id");
  } catch {}
  if (!sid) {
    sid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      localStorage.setItem("guest_session_id", sid);
    } catch {}
  }
  return sid!;
}

function buildHeaders(json = false) {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";

  let token: string | null = null;
  try {
    token = localStorage.getItem("bearer_token");
  } catch {}

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    headers["X-Session-Id"] = ensureGuestSessionId();
  }
  return headers;
}

function mapApiItems(apiItems: ApiCartItem[] | undefined | null): CartItem[] {
  if (!Array.isArray(apiItems)) return [];
  return apiItems
    .filter((it) => it && it.productId && it.product)
    .map((it) => ({
      id: it.id,
      productId: Number(it.productId),
      name: it.product?.name ?? "Producto",
      brand: it.product?.brand ?? "",
      reference: it.product?.reference ?? "",
      price: Number(it.product?.price ?? 0),
      imageUrl: it.product?.imageUrl ?? null,
      quantity: it.quantity,
    }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchCart = async () => {
    try {
      const headers = buildHeaders(false);
      const url = new URL("/api/cart/get", window.location.origin);

      let token: string | null = null;
      try {
        token = localStorage.getItem("bearer_token");
      } catch {}

      if (!token) {
        url.searchParams.set("sessionId", ensureGuestSessionId());
      }

      const res = await fetch(url.toString(), { headers, cache: "no-store" });
      if (!res.ok) throw new Error("Error fetching cart");

      const data = await res.json();
      setItems(mapApiItems(data.items));
    } catch (e) {
      console.error("fetchCart error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();

    const onUpdated = () => fetchCart();
    window.addEventListener(CART_EVENT, onUpdated);
    window.addEventListener("cartUpdated", onUpdated);

    return () => {
      window.removeEventListener(CART_EVENT, onUpdated);
      window.removeEventListener("cartUpdated", onUpdated);
    };
  }, []);

  const addItem: CartContextType["addItem"] = async (product) => {
    // Abrimos el drawer inmediatamente para feedback visual
    openDrawer();
    
    try {
      const headers = buildHeaders(true);
      let token: string | null = null;
      try {
        token = localStorage.getItem("bearer_token");
      } catch {}

      const body: Record<string, any> = {
        productId: product.id,
        quantity: 1,
      };
      if (!token) body.sessionId = ensureGuestSessionId();

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Error al añadir al carrito");
      }

      // Sincronización inmediata con los datos devueltos
      if (data.items) {
        setItems(mapApiItems(data.items));
      } else {
        await fetchCart();
      }

      window.dispatchEvent(new Event(CART_EVENT));
      toast.success("Añadido al carrito", { id: "cart-add-success" });

      trackAddToCart({
        id: product.id,
        name: product.name,
        brand: product.brand,
        reference: product.reference,
        price: product.price,
        quantity: 1,
      });
    } catch (e: any) {
      console.error("addItem error:", e);
      toast.error(e?.message || "Error al añadir al carrito");
    }
  };

  const updateQuantity: CartContextType["updateQuantity"] = async (itemId, quantity) => {
    try {
      const headers = buildHeaders(true);
      let token: string | null = null;
      try {
        token = localStorage.getItem("bearer_token");
      } catch {}

      const body: Record<string, any> = { itemId, quantity };
      if (!token) body.sessionId = ensureGuestSessionId();

      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Error al actualizar cantidad");
      }

      setItems(mapApiItems(data.items));
      window.dispatchEvent(new Event(CART_EVENT));
    } catch (e: any) {
      console.error("updateQuantity error:", e);
      toast.error(e?.message || "Error al actualizar cantidad");
    }
  };

  const removeItem: CartContextType["removeItem"] = async (itemId) => {
    try {
      const headers = buildHeaders(false);
      let token: string | null = null;
      try {
        token = localStorage.getItem("bearer_token");
      } catch {}

      const sp = new URLSearchParams({ itemId: String(itemId) });
      if (!token) sp.set("sessionId", ensureGuestSessionId());

      const res = await fetch(`/api/cart/remove?${sp.toString()}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Error al eliminar del carrito");
      }

      setItems(mapApiItems(data.items));
      window.dispatchEvent(new Event(CART_EVENT));
      toast.success("Producto eliminado");
    } catch (e: any) {
      console.error("removeItem error:", e);
      toast.error(e?.message || "Error al eliminar del carrito");
    }
  };

  const removeByProductId: CartContextType["removeByProductId"] = async (productId) => {
    const item = items.find((it) => it.productId === productId);
    if (item) return removeItem(item.id);
  };

  const clearCart: CartContextType["clearCart"] = async () => {
    try {
      const headers = buildHeaders(false);
      let token: string | null = null;
      try {
        token = localStorage.getItem("bearer_token");
      } catch {}

      const url = new URL("/api/cart/clear", window.location.origin);
      if (!token) url.searchParams.set("sessionId", ensureGuestSessionId());

      const res = await fetch(url.toString(), { method: "DELETE", headers });
      if (res.ok) {
        setItems([]);
        window.dispatchEvent(new Event(CART_EVENT));
      }
    } catch (e) {
      console.error("clearCart error:", e);
    }
  };

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        removeByProductId,
        clearCart,
        refreshCart: fetchCart,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
