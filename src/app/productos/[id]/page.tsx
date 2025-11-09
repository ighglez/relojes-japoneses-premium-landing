"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingCart, Heart, Package, ArrowLeft, Loader2, Bell, Sparkles, Award, Shield, Truck, CreditCard, FileText } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { trackProductView } from "@/lib/analytics";

interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  series: string;
  reference: string;
  description: string | null;
  movement: string | null;
  diameter: string | null;
  color: string | null;
  waterResistance: string | null;
  price: number;
  currency: string;
  stock: number;
  category: string;
  isNew: boolean;
  isExclusive: boolean;
  images: string[] | string | null;
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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  // Track product view
  useEffect(() => {
    if (product) {
      trackProductView({
        id: product.id,
        name: product.name,
        brand: product.brand,
        reference: product.reference,
        price: product.price,
        category: product.category,
      });
    }
  }, [product]);

  const fetchProduct = async (slug: string) => {
    try {
      const response = await fetch(`/api/products?limit=100`);
      if (response.ok) {
        const data = await response.json();
        const foundProduct = data.find((p: Product) => p.slug === slug);
        if (foundProduct) {
          setProduct(foundProduct);
          fetchRelatedProducts(foundProduct.series, foundProduct.id);
        } else {
          router.push("/productos");
        }
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

  const fetchRelatedProducts = async (series: string, currentId: number) => {
    try {
      const response = await fetch(`/api/products?limit=100`);
      if (response.ok) {
        const data = await response.json();
        const related = data
          .filter((p: Product) => p.series === series && p.id !== currentId)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
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

  const isLowStock = product.stock > 0 && product.stock <= 2;

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
          <span>Volver a la tienda</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square bg-white rounded-lg border border-pearl overflow-hidden"
          >
            <Image
              src={imageUrl}
              alt={`${product.brand} ${product.name}`}
              fill
              className="object-cover"
              priority
            />

            {/* Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              {product.isNew && (
                <div className="flex items-center gap-2 bg-champagne text-ivory text-sm font-medium px-4 py-2 rounded-lg">
                  <Sparkles className="h-4 w-4" />
                  Nuevo
                </div>
              )}
              {product.isExclusive && (
                <div className="flex items-center gap-2 bg-graphite text-ivory text-sm font-medium px-4 py-2 rounded-lg">
                  <Award className="h-4 w-4" />
                  Exclusivo
                </div>
              )}
              {isLowStock && (
                <div className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  {product.stock === 1 ? "Última unidad" : `Solo quedan ${product.stock} unidades`}
                </div>
              )}
            </div>

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
                {product.brand} • {product.series}
              </p>
              <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-2">
                {product.name}
              </h1>
              <p className="text-graphite/60">Referencia: {product.reference}</p>
            </div>

            <div className="mb-8">
              <p className="text-4xl font-bold text-champagne mb-2">
                {product.price.toFixed(2)} {product.currency}
              </p>
              {product.stock > 0 ? (
                <p className="text-sm text-green-600 font-medium">
                  ✓ En stock • Envío en 24-48 horas
                </p>
              ) : (
                <p className="text-sm text-red-600 font-medium">Sin stock disponible</p>
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

            {/* Specifications */}
            <div className="mb-8 bg-white rounded-lg border border-pearl p-6">
              <h2 className="font-heading text-xl font-medium text-graphite mb-4">
                Especificaciones
              </h2>
              <ul className="space-y-2">
                {product.movement && (
                  <li className="flex justify-between text-sm">
                    <span className="text-graphite/60">Movimiento:</span>
                    <span className="font-medium text-graphite">{product.movement}</span>
                  </li>
                )}
                {product.diameter && (
                  <li className="flex justify-between text-sm">
                    <span className="text-graphite/60">Diámetro:</span>
                    <span className="font-medium text-graphite">{product.diameter}</span>
                  </li>
                )}
                {product.waterResistance && (
                  <li className="flex justify-between text-sm">
                    <span className="text-graphite/60">Resistencia al agua:</span>
                    <span className="font-medium text-graphite">{product.waterResistance}</span>
                  </li>
                )}
                {product.color && (
                  <li className="flex justify-between text-sm">
                    <span className="text-graphite/60">Color:</span>
                    <span className="font-medium text-graphite">{product.color}</span>
                  </li>
                )}
                <li className="flex justify-between text-sm">
                  <span className="text-graphite/60">Serie:</span>
                  <span className="font-medium text-graphite">{product.series}</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-4 mb-8">
              {product.stock > 0 ? (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="w-full py-4 bg-champagne text-ivory font-medium text-lg rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isAdding ? "Añadiendo..." : "Añadir al carrito"}
                  </button>
                  <button className="w-full py-3 border-2 border-pearl text-graphite font-medium rounded-lg hover:bg-pearl transition-all flex items-center justify-center gap-2">
                    <Heart className="h-5 w-5" />
                    Añadir a favoritos
                  </button>
                </>
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
            </div>

            {/* Trust Badges */}
            <div className="bg-champagne/10 border border-champagne/30 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-graphite">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-champagne flex-shrink-0" />
                  <span>Pago seguro</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-champagne flex-shrink-0" />
                  <span>Envío asegurado</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-champagne flex-shrink-0" />
                  <span>Autenticidad garantizada</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-champagne flex-shrink-0" />
                  <span>Factura emitida</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-20"
          >
            <h2 className="font-heading text-3xl font-medium text-graphite mb-8">
              Modelos relacionados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => {
                let relatedImageUrl = "/images/products/placeholder-watch.webp";
                if (related.images) {
                  if (typeof related.images === "string") {
                    try {
                      const parsed = JSON.parse(related.images);
                      relatedImageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : relatedImageUrl;
                    } catch {
                      relatedImageUrl = related.images;
                    }
                  } else if (Array.isArray(related.images) && related.images.length > 0) {
                    relatedImageUrl = related.images[0];
                  }
                }

                return (
                  <Link key={related.id} href={`/productos/${related.slug}`}>
                    <div className="bg-white rounded-lg border border-pearl overflow-hidden hover:shadow-lg transition-all">
                      <div className="relative aspect-square bg-pearl">
                        <Image
                          src={relatedImageUrl}
                          alt={related.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-champagne font-medium mb-1">{related.brand}</p>
                        <h3 className="font-heading text-sm font-medium text-graphite mb-1 line-clamp-1">
                          {related.name}
                        </h3>
                        <p className="text-lg font-bold text-champagne">
                          {related.price.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}