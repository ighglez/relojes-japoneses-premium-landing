"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { trackAddToCart } from "@/lib/analytics";

interface WishlistItem {
  id: number;
  productId: number;
  product: {
    id: number;
    slug: string;
    name: string;
    brand: string;
    reference: string;
    price: number;
    stock: number;
    images: string | null;
  };
}

export default function FavoritosPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isPending && !session?.user) {
      toast.error("Debes iniciar sesión para ver tus favoritos");
      router.push("/iniciar-sesion?redirect=/favoritos");
      return;
    }

    if (session?.user) {
      fetchWishlist();
    }
  }, [session, isPending, router]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) return;

      const response = await fetch("/api/wishlist/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      } else {
        toast.error("Error al cargar favoritos");
      }
    } catch (error) {
      toast.error("Error al cargar favoritos");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) return;

      const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        setWishlist((prev) => prev.filter((item) => item.productId !== productId));
        toast.success("Eliminado de favoritos");
        window.dispatchEvent(new Event("wishlistUpdated"));
      } else {
        toast.error("Error al eliminar de favoritos");
      }
    } catch (error) {
      toast.error("Error al eliminar de favoritos");
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (item.product.stock === 0) {
      toast.error("Producto sin stock");
      return;
    }

    setProcessingItems((prev) => new Set(prev).add(item.productId));
    try {
      const token = localStorage.getItem("bearer_token");
      let sessionId = localStorage.getItem("guest_session_id");

      if (!token && !sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("guest_session_id", sessionId);
      }

      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId: item.productId,
          quantity: 1,
          sessionId: !token ? sessionId : undefined,
        }),
      });

      if (response.ok) {
        toast.success("Añadido al carrito");
        
        // Track analytics
        trackAddToCart({
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          reference: item.product.reference,
          price: item.product.price,
          quantity: 1,
        });
        
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al añadir al carrito");
      }
    } catch (error) {
      toast.error("Error al añadir al carrito");
    } finally {
      setProcessingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.productId);
        return next;
      });
    }
  };

  const parseImageUrl = (images: string | null): string => {
    if (!images) return "/images/products/placeholder-watch.webp";
    
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch {
      return images;
    }
    
    return "/images/products/placeholder-watch.webp";
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex justify-center items-center">
            <Loader2 className="h-12 w-12 text-champagne animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Heart className="h-24 w-24 text-graphite/20 mx-auto mb-6" />
            <h1 className="font-heading text-3xl font-medium text-graphite mb-4">
              Tu lista de favoritos está vacía
            </h1>
            <p className="text-graphite/60 mb-8">
              Explora nuestra colección y añade productos a tus favoritos
            </p>
            <button
              onClick={() => router.push("/productos")}
              className="px-8 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all"
            >
              Ver productos
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl font-medium text-graphite mb-2">
            Mis favoritos
          </h1>
          <p className="text-graphite/60">
            {wishlist.length} {wishlist.length === 1 ? "producto" : "productos"} en tu lista
          </p>
        </motion.div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border border-pearl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              {/* Image */}
              <Link href={`/productos/${item.product.slug}`} className="block">
                <div className="relative aspect-square bg-pearl overflow-hidden">
                  <Image
                    src={parseImageUrl(item.product.images)}
                    alt={`${item.product.brand} ${item.product.name}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Remove from Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFromWishlist(item.productId);
                    }}
                    className="absolute top-3 right-3 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                    aria-label="Eliminar de favoritos"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>

                  {/* Stock Badge */}
                  {item.product.stock === 0 && (
                    <div className="absolute top-3 left-3 bg-graphite/90 text-ivory text-xs font-medium px-3 py-1 rounded-full">
                      Sin stock
                    </div>
                  )}
                  {item.product.stock > 0 && item.product.stock <= 2 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      {item.product.stock === 1 ? "Última unidad" : `Quedan ${item.product.stock}`}
                    </div>
                  )}
                </div>
              </Link>

              {/* Content */}
              <div className="p-4">
                <Link href={`/productos/${item.product.slug}`}>
                  <div className="mb-2">
                    <p className="text-xs text-champagne font-medium uppercase tracking-wide mb-1">
                      {item.product.brand}
                    </p>
                    <h3 className="font-heading text-lg font-medium text-graphite mb-1 line-clamp-1 hover:text-champagne transition-colors">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-graphite/60">Ref: {item.product.reference}</p>
                  </div>
                </Link>

                {/* Price */}
                <div className="mb-4">
                  <p className="text-2xl font-bold text-champagne">
                    {item.product.price.toFixed(2)} €
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={processingItems.has(item.productId) || item.product.stock === 0}
                    className="w-full px-4 py-2.5 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {processingItems.has(item.productId) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Añadiendo...
                      </>
                    ) : item.product.stock === 0 ? (
                      "Sin stock"
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Añadir al carrito
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveFromWishlist(item.productId)}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-sm text-graphite hover:text-champagne transition-colors"
          >
            ← Seguir explorando productos
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
