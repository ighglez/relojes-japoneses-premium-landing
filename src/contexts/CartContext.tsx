// src/contexts/CartContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trackAddToCart } from "@/lib/analytics";

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
  id: number;               // cart item id
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function ensureGuestSessionId(): string {
  let sid = localStorage.getItem("guest_session_id");
  if (!sid) {
    sid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("guest_session_id", sid);
  }
  return sid;
}

function buildHeaders(json = false) {
  const token = localStorage.getItem("bearer_token");
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    headers["X-Session-Id"] = ensureGuestSessionId();
  }
  return headers;
}

function mapApiItems(apiItems: ApiCartItem[]): CartItem[] {
  return (apiItems || [])
    .filter((it) => it && it.productId && it.product)
    .map((it) => ({
      id: it.id,
      productId: it.productId as number,
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

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = buildHeaders(false);

      // /api/cart/get acepta ?sessionId= para guests y Authorization para users
      const url = new URL("/api/cart/get", window.location.origin);
      if (!token) {
        url.searchParams.set("sessionId", ensureGuestSessionId());
      }

      const res = await fetch(url.toString(), { headers, cache: "no-store" });
      if (!res.ok) throw new Error("Respuesta no OK");

      const data = await res.json();
      const mapped = mapApiItems(data.items || []);
      setItems(mapped);
    } catch (e) {
      console.error("Error fetching cart:", e);
      // no toast aquí para no ser molesto en primer pintado
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // refrescar cuando otras partes del UI emitan "cartUpdated"
    const onUpdated = () => fetchCart();
    window.addEventListener("cartUpdated", onUpdated);
    return () => window.removeEventListener("cartUpdated", onUpdated);
  }, []);

  const addItem: CartContextType["addItem"] = async (product) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = buildHeaders(true);

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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error al añadir al carrito");
      }

      await fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Añadido al carrito");

      // analytics
      trackAddToCart({
        id: product.id,
        name: product.name,
        brand: product.brand,
        reference: product.reference,
        price: product.price,
        quantity: 1,
      });
    } catch (e: any) {
      console.error("addItem:", e);
      toast.error(e?.message || "Error al añadir al carrito");
    }
  };

  const updateQuantity: CartContextType["updateQuantity"] = async (itemId, quantity) => {
    try {
      const headers = buildHeaders(true);
      const body: Record<string, any> = { itemId, quantity };
      const token = localStorage.getItem("bearer_token");
      if (!token) body.sessionId = ensureGuestSessionId();

      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error al actualizar cantidad");
      }

      const data = await res.json();
      setItems(mapApiItems(data.items || []));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (e: any) {
      console.error("updateQuantity:", e);
      toast.error(e?.message || "Error al actualizar cantidad");
    }
  };

  const removeItem: CartContextType["removeItem"] = async (itemId) => {
    try {
      const headers = buildHeaders(false);
      const token = localStorage.getItem("bearer_token");
      const sp = new URLSearchParams({ itemId: String(itemId) });
      if (!token) sp.set("sessionId", ensureGuestSessionId());

      const res = await fetch(`/api/cart/remove?${sp.toString()}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error al eliminar del carrito");
      }

      const data = await res.json();
      setItems(mapApiItems(data.items || []));
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Producto eliminado del carrito");
    } catch (e: any) {
      console.error("removeItem:", e);
      toast.error(e?.message || "Error al eliminar del carrito");
    }
  };

  // Utilidad: por si algún componente sólo conoce productId
  const removeByProductId: CartContextType["removeByProductId"] = async (productId) => {
    const item = items.find((it) => it.productId === productId);
    if (item) return removeItem(item.id);
  };

  const clearCart: CartContextType["clearCart"] = async () => {
    try {
      // El backend no tiene /api/cart/clear dedicado; borraremos uno a uno para mantener consistencia y estado
      const toDelete = [...items];
      for (const it of toDelete) {
        // eslint-disable-next-line no-await-in-loop
        await removeItem(it.id);
      }
      // removeItem ya refresca estado y emite evento
    } catch (e) {
      console.error("clearCart:", e);
      toast.error("No se pudo vaciar el carrito");
    }
  };

  const refreshCart = fetchCart;

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
        refreshCart,
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
