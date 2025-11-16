"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { trackAddToCart } from "@/lib/analytics";

const CART_EVENT = "cart:updated";

interface ProductCardProps {
  product: {
    id: number | string;
    slug: string;
    name: string;
    brand: string;
    series: string;
    reference: string;
    description: string | null;
    price: number;
    stock: number;
    isNew?: boolean;
    isExclusive?: boolean;
    images?: string[] | string | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const productId = Number(product.id);

  // Imagen
  let imageUrl = "/images/products/placeholder-watch.webp";
  if (product.images) {
    if (typeof product.images === "string") {
      try {
        const parsed = JSON.parse(product.images);
        imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageUrl;
      } catch {
        imageUrl = product.images;
      }
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      imageUrl = product.images[0];
    }
  }

  // Wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      const token = localStorage.getItem("bearer_token");
      if (!token) return;
      try {
        const response = await fetch("/api/wishlist/get", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const wishlist = await response.json();
        const inWishlist = wishlist.some((item: any) => item.productId === productId);
        setIsInWishlist(inWishlist);
      } catch { /* noop */ }
    };
    checkWishlist();
  }, [productId]);

  const ensureSessionId = () => {
    let sessionId = localStorage.getItem("guest_session_id");
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("guest_session_id", sessionId);
    }
    return sessionId;
  };

  const buildAuthHeaders = () => {
    const token = localStorage.getItem("bearer_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      headers["X-Session-Id"] = ensureSessionId();
    }
    return headers;
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || Number.isNaN(productId)) return toast.error("Producto inválido");
    if (product.stock === 0) return toast.error("Producto sin stock");

    setIsAdding(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = token ? null : ensureSessionId();

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: buildAuthHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          productId,
          quantity: 1,
          sessionId: sessionId || undefined, // body opcional para guests
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error al añadir al carrito");

      toast.success("Añadido al carrito");
      trackAddToCart({
        id: productId,
        name: product.name,
        brand: product.brand,
        reference: product.reference,
        price: product.price,
        quantity: 1,
      });

      window.dispatchEvent(new Event(CART_EVENT));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al añadir al carrito");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || Number.isNaN(productId)) return toast.error("Producto inválido");
    if (product.stock === 0) return toast.error("Producto sin stock");

    setIsBuying(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = token ? null : ensureSessionId();

      // 1) añade (espera a que termine)
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: buildAuthHeaders(),
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          productId,
          quantity: 1,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error al procesar la compra");

      // 2) refresca y navega a /pagar
      window.dispatchEvent(new Event(CART_EVENT));
      router.push("/pagar");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al procesar la compra");
    } finally {
      setIsBuying(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      toast.error("Debes iniciar sesión para usar favoritos");
      return;
    }
    try {
      const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ productId }),
      });
      if (response.ok) {
        const data = await response.json();
        setIsInWishlist(data.inWishlist);
        toast.success(data.message);
        window.dispatchEvent(new Event("wishlistUpdated"));
      } else {
        toast.error("Error al actualizar favoritos");
      }
    } catch {
      toast.error("Error al actualizar favoritos");
    }
  };

  const isLowStock = product.stock > 0 && product.stock <= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <div className="bg-white rounded-lg border border-pearl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        <Link href={`/productos/${product.slug}`} className="block">
          <div className="relative aspect-square bg-pearl overflow-hidden">
            <Image
              src={imageUrl}
              alt={`${product.brand} ${product.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isNew && (
                <div className="flex items-center gap-1 bg-champagne text-ivory text-xs font-medium px-3 py-1 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  Nuevo
                </div>
              )}
              {product.isExclusive && (
                <div className="flex items-center gap-1 bg-graphite text-ivory text-xs font-medium px-3 py-1 rounded-full">
                  <Award className="h-3 w-3" />
                  Exclusivo
                </div>
              )}
              {isLowStock && (
                <div className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {product.stock === 1 ? "Última unidad" : `Quedan ${product.stock}`}
                </div>
              )}
            </div>
            {product.stock === 0 && (
              <div className="absolute top-3 left-3 bg-graphite/90 text-ivory text-xs font-medium px-3 py-1 rounded-full">
                Sin stock
              </div>
            )}
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isInWishlist
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-graphite hover:bg-champagne hover:text-ivory"
              }`}
              aria-label={isInWishlist ? "Eliminar de favoritos" : "Añadir a favoritos"}
            >
              <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
            </button>
            {product.stock > 0 && product.stock <= 5 && !isLowStock && (
              <div className="absolute bottom-3 left-3 bg-white/90 text-graphite text-xs font-medium px-3 py-1 rounded-full">
                En stock • 24-48h
              </div>
            )}
            {product.stock > 5 && (
              <div className="absolute bottom-3 left-3 bg-green-500/90 text-white text-xs font-medium px-3 py-1 rounded-full">
                Disponible • Envío inmediato
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/productos/${product.slug}`}>
            <div className="mb-2">
              <p className="text-xs text-champagne font-medium uppercase tracking-wide mb-1">
                {product.brand}
              </p>
              <h3 className="font-heading text-lg font-medium text-graphite mb-1 line-clamp-1 hover:text-champagne transition-colors">
                {product.name}
              </h3>
              <p className="text-xs text-graphite/60">Ref: {product.reference}</p>
            </div>
          </Link>

          {product.description && (
            <p className="text-sm text-graphite/70 mb-3 line-clamp-2">{product.description}</p>
          )}

          <div className="mb-4">
            <p className="text-2xl font-bold text-champagne">{product.price.toFixed(2)} €</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || product.stock === 0}
              className="w-full px-4 py-2.5 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              aria-label="Añadir al carrito"
            >
              {product.stock === 0 ? "Sin stock" : isAdding ? "Añadiendo..." : "Añadir al carrito"}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isBuying || product.stock === 0}
              className="w-full px-4 py-2.5 bg-graphite text-ivory rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              aria-label="Comprar ahora"
            >
              {isBuying ? "Procesando..." : "Comprar ahora"}
            </button>

            <Link
              href={`/productos/${product.slug}`}
              className="block w-full text-center text-sm text-graphite hover:text-champagne transition-colors underline-offset-2 hover:underline py-1"
            >
              Ver detalles
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
