"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, Award } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: number;
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
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Parse images
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) {
      toast.error("Producto sin stock");
      return;
    }
    setIsAdding(true);
    try {
      await addItem(product);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      toast.error("Debes iniciar sesión para usar la lista de deseos");
      return;
    }

    try {
      const method = isInWishlist ? "DELETE" : "POST";
      const response = await fetch("/api/wishlist", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.ok) {
        setIsInWishlist(!isInWishlist);
        toast.success(isInWishlist ? "Eliminado de favoritos" : "Añadido a favoritos");
      }
    } catch (error) {
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
        {/* Image */}
        <Link href={`/productos/${product.slug}`} className="block">
          <div className="relative aspect-square bg-pearl overflow-hidden">
            <Image
              src={imageUrl}
              alt={`${product.brand} ${product.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Badges */}
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

            {/* Stock Out Badge */}
            {product.stock === 0 && (
              <div className="absolute top-3 left-3 bg-graphite/90 text-ivory text-xs font-medium px-3 py-1 rounded-full">
                Sin stock
              </div>
            )}

            {/* Wishlist Button */}
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

            {/* Stock Status */}
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

        {/* Content */}
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
            <p className="text-sm text-graphite/70 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mb-4">
            <p className="text-2xl font-bold text-champagne">
              {product.price.toFixed(2)} €
            </p>
          </div>

          {/* Action Buttons - NEW STRATEGY */}
          <div className="space-y-2">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || product.stock === 0}
              className="w-full px-4 py-2.5 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              aria-label="Añadir al carrito"
            >
              {product.stock === 0 ? "Sin stock" : isAdding ? "Añadiendo..." : "Añadir al carrito"}
            </button>
            
            <Link 
              href={`/productos/${product.slug}`}
              className="block w-full text-center text-sm text-graphite hover:text-champagne transition-colors underline-offset-2 hover:underline"
            >
              Ver detalles
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}