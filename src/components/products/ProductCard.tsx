"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    brand: string;
    reference: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    stock: number;
    category: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link href={`/productos/${product.id}`} className="block">
        <div className="bg-white rounded-lg border border-pearl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-square bg-pearl overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-20 w-20 text-graphite/20" />
              </div>
            )}

            {/* Stock Badge */}
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
            >
              <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-2">
              <p className="text-xs text-champagne font-medium uppercase tracking-wide mb-1">
                {product.brand}
              </p>
              <h3 className="font-heading text-lg font-medium text-graphite mb-1 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-graphite/60">Ref: {product.reference}</p>
            </div>

            {product.description && (
              <p className="text-sm text-graphite/70 mb-3 line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Price & Actions */}
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-2xl font-bold text-champagne">
                  {product.price.toFixed(2)} €
                </p>
                {product.stock > 0 && product.stock <= 3 && (
                  <p className="text-xs text-red-600 mt-1">Solo {product.stock} disponibles</p>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAdding || product.stock === 0}
                className="px-4 py-2 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <ShoppingCart className="h-4 w-4" />
                {isAdding ? "..." : product.stock === 0 ? "Sin stock" : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
