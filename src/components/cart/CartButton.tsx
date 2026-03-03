"use client";

import { useState } from "react";

type Props = {
  productId: number;        // ⚠️ Pásale el ID real del producto desde tu card o página de detalle
  quantity?: number;
  className?: string;
};

export default function AddToCartButton({ productId, quantity = 1, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleAdd() {
    setLoading(true);
    setMsg(null);

    // sessionId para invitados
    let sid = localStorage.getItem("cart_session_id");
    if (!sid) {
      sid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("cart_session_id", sid);
    }

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, sessionId: sid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo añadir al carrito");

      // Notifica al contexto para que refresque itemCount
      window.dispatchEvent(new CustomEvent("cart:updated"));
      setMsg("Producto añadido al carrito");
    } catch (e: any) {
      setMsg(e.message || "No se pudo añadir al carrito");
      console.error("add-to-cart error:", e);
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full bg-champagne text-ivory rounded-lg px-4 py-2 font-medium hover:bg-champagne/90 transition disabled:opacity-60"
        aria-label="Añadir al carrito"
      >
        {loading ? "Añadiendo…" : "Añadir al carrito"}
      </button>
      {msg && <p className="mt-2 text-sm text-graphite/70">{msg}</p>}
    </div>
  );
}
// Agregar DESPUÉS de tu componente actual:

// Exportación alternativa que usa el hook
export function CartButtonWithHook({ 
  productId, 
  quantity = 1, 
  className = "" 
}: { 
  productId: number; 
  quantity?: number; 
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { addToCart } = useCart();

  async function handleAdd() {
    setLoading(true);
    setMsg(null);

    try {
      await addToCart(productId, quantity);
      setMsg("Producto añadido al carrito");
    } catch (e: any) {
      setMsg(e.message || "No se pudo añadir al carrito");
      console.error("add-to-cart error:", e);
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full bg-champagne text-ivory rounded-lg px-4 py-2 font-medium hover:bg-champagne/90 transition disabled:opacity-60"
        aria-label="Añadir al carrito"
      >
        {loading ? "Añadiendo…" : "Añadir al carrito"}
      </button>
      {msg && <p className="mt-2 text-sm text-graphite/70">{msg}</p>}
    </div>
  );
}
