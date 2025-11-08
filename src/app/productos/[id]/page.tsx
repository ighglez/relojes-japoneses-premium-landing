"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingCart, Heart, Package, ArrowLeft, Loader2, Bell } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  brand: string;
  reference: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  category: string;
  features: any;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else {
        router.push("/productos");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      router.push("/productos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    setIsAdding(true);
    try {
      await addItem(product);
    } finally {
      setIsAdding(false);
    }
  };

  const handleNotifyStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !product) return;

    setNotifying(true);
    try {
      const response = await fetch("/api/stock-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          email: notifyEmail,
        }),
      });

      if (response.ok) {
        toast.success("Te notificaremos cuando esté disponible");
        setNotifyEmail("");
      } else {
        toast.error("Error al registrar notificación");
      }
    } catch (error) {
      toast.error("Error al registrar notificación");
    } finally {
      setNotifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-champagne" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-graphite/70 hover:text-champagne transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver al catálogo</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square bg-white rounded-lg border border-pearl overflow-hidden"
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-32 w-32 text-graphite/20" />
              </div>
            )}

            {product.stock === 0 && (
              <div className="absolute top-6 left-6 bg-graphite/90 text-ivory px-4 py-2 rounded-lg font-medium">
                Sin stock
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-4">
              <p className="text-sm text-champagne font-medium uppercase tracking-wide mb-2">
                {product.brand}
              </p>
              <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-2">
                {product.name}
              </h1>
              <p className="text-graphite/60">Referencia: {product.reference}</p>
            </div>

            <div className="mb-8">
              <p className="text-4xl font-bold text-champagne mb-2">
                {product.price.toFixed(2)} €
              </p>
              {product.stock > 0 && product.stock <= 3 && (
                <p className="text-sm text-red-600">Solo quedan {product.stock} unidades</p>
              )}
            </div>

            {product.description && (
              <div className="mb-8">
                <h2 className="font-heading text-xl font-medium text-graphite mb-3">
                  Descripción
                </h2>
                <p className="text-graphite/70 leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.features && Object.keys(product.features).length > 0 && (
              <div className="mb-8 bg-white rounded-lg border border-pearl p-6">
                <h2 className="font-heading text-xl font-medium text-graphite mb-4">
                  Características
                </h2>
                <ul className="space-y-2">
                  {Object.entries(product.features).map(([key, value]) => (
                    <li key={key} className="flex justify-between text-sm">
                      <span className="text-graphite/60">{key}:</span>
                      <span className="font-medium text-graphite">{String(value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {product.stock > 0 ? (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full py-4 bg-champagne text-ivory font-medium text-lg rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isAdding ? "Añadiendo..." : "Añadir al carrito"}
                </button>
              ) : (
                <form onSubmit={handleNotifyStock} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="flex-1 px-4 py-3 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50"
                    />
                    <button
                      type="submit"
                      disabled={notifying}
                      className="px-6 py-3 bg-graphite text-ivory font-medium rounded-lg hover:bg-graphite/90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Bell className="h-5 w-5" />
                      {notifying ? "..." : "Notificar"}
                    </button>
                  </div>
                  <p className="text-xs text-graphite/60">
                    Te avisaremos cuando este producto esté disponible
                  </p>
                </form>
              )}

              <button className="w-full py-3 border-2 border-pearl text-graphite font-medium rounded-lg hover:bg-pearl transition-all flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                Añadir a favoritos
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
