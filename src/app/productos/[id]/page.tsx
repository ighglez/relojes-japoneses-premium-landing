"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Heart, 
  ArrowLeft, 
  Loader2, 
  Bell, 
  Sparkles, 
  Award, 
  Shield, 
  Truck, 
  CreditCard, 
  FileText,
  Layers,
  Cpu,
  Palette,
  Maximize2,
  CircleDashed,
  Settings,
  ShieldCheck,
  Users,
  Ruler,
  Waves,
  Search,
  Watch,
  Clock,
  ChevronRight
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "@/lib/auth-client";
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
  calibre: string | null;
  caseBack: string | null;
  thickness: string | null;
  glassMaterial: string | null;
  strapMaterial: string | null;
  strapType: string | null;
  gender: string | null;
  warranty: string | null;
  availabilityDate: string | null;
  color: string | null;
  waterResistance: string | null;
  price: number;
  currency: string;
  stock: number;
  category: string;
  isNew: boolean;
  isExclusive: boolean;
  images: string[] | string | null;
  features?: string[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, openDrawer } = useCart();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifying, setNotifying] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);

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
      checkWishlistStatus(product.id);
    }
  }, [product]);

  const checkWishlistStatus = async (productId: number) => {
    const token = localStorage.getItem("bearer_token");
    if (!token) return;

    try {
      const response = await fetch("/api/wishlist/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsInWishlist(data.some((item: any) => item.productId === productId));
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

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
      await addItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        reference: product.reference,
        price: product.price
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || product.stock === 0) return;
    setIsBuying(true);
    try {
      await addItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        reference: product.reference,
        price: product.price
      });
      router.push("/pagar");
    } catch (error) {
      console.error("Error buying now:", error);
    } finally {
      setIsBuying(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!session?.user) {
      toast.error("Debes iniciar sesión para añadir a favoritos");
      return;
    }
    const token = localStorage.getItem("bearer_token");
    if (!token) return;

    try {
      const method = isInWishlist ? "DELETE" : "POST";
      const response = await fetch("/api/wishlist", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product?.id }),
      });

      if (response.ok) {
        setIsInWishlist(!isInWishlist);
        window.dispatchEvent(new Event("wishlistUpdated"));
        toast.success(isInWishlist ? "Eliminado de favoritos" : "Añadido a favoritos");
      }
    } catch (error) {
      toast.error("Error al actualizar favoritos");
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
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-graphite/50 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-champagne transition-colors">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/productos" className="hover:text-champagne transition-colors">Tienda</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-graphite font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
          {/* Left: Image Container */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-square bg-white rounded-xl border border-pearl overflow-hidden group shadow-sm">
              <Image
                src={imageUrl}
                alt={`${product.brand} ${product.name}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />

              {/* Badges on Image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-[#4CAF50] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded shadow-sm">
                    Nuevo
                  </span>
                )}
                {product.isExclusive && (
                  <span className="bg-graphite text-ivory text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded shadow-sm">
                    Edición Limitada
                  </span>
                )}
                {isLowStock && (
                  <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded shadow-sm">
                    Últimas unidades
                  </span>
                )}
              </div>

              {product.stock === 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-graphite text-ivory px-6 py-3 rounded-lg font-bold uppercase tracking-widest shadow-xl">
                    Agotado
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <h2 className="text-sm font-bold text-champagne uppercase tracking-[0.2em] mb-3">
                {product.brand} • {product.series}
              </h2>
              <h1 className="font-heading text-4xl md:text-5xl font-semibold text-graphite mb-4 leading-tight">
                {product.name}
              </h1>
              <p className="text-graphite/40 font-mono text-xs uppercase tracking-widest">
                REF: {product.reference}
              </p>
            </div>

            <div className="mb-8 p-6 bg-ivory rounded-xl border border-pearl inline-block self-start min-w-[200px]">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-graphite">
                  {product.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
                <span className="text-xs text-graphite/40 line-through">
                  {(product.price * 1.2).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <p className="text-[10px] text-graphite/40 uppercase tracking-widest mt-2">
                IVA Incluido • Envío Gratuito
              </p>
            </div>

            {product.description && (
              <div className="mb-10">
                <p className="text-graphite/70 leading-relaxed text-sm lg:text-base">
                  {product.description}
                </p>
              </div>
            )}

            {/* Actions Buttons */}
            <div className="space-y-4 mb-10">
              {product.stock > 0 ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleBuyNow}
                      disabled={isBuying}
                      className="flex-1 py-4 bg-graphite text-ivory font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-graphite/10"
                    >
                      {isBuying ? "Procesando..." : "Comprar ahora"}
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      className="flex-1 py-4 border-2 border-champagne text-champagne font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-champagne hover:text-ivory transition-all disabled:opacity-50"
                    >
                      {isAdding ? "Añadiendo..." : "Añadir al carrito"}
                    </button>
                  </div>
                  
                  <button
                    onClick={handleToggleWishlist}
                    className={`w-full py-4 border-2 font-bold uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-2 ${
                      isInWishlist
                        ? "border-red-500 text-red-500 bg-red-50"
                        : "border-pearl text-graphite/60 hover:border-graphite hover:text-graphite"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
                    {isInWishlist ? "En tus favoritos" : "Añadir a favoritos"}
                  </button>
                </>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                  <p className="text-red-800 font-bold text-sm uppercase tracking-widest mb-4">Agotado Temporalmente</p>
                  <form onSubmit={handleNotifyStock} className="flex gap-2">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="Tu correo electrónico"
                      required
                      className="flex-1 px-4 py-3 bg-white border border-red-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <button
                      type="submit"
                      disabled={notifying}
                      className="px-6 py-3 bg-graphite text-white font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-black transition-all"
                    >
                      {notifying ? "..." : "Avisar"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Trust Icons Section */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-8 border-t border-pearl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ivory rounded-full">
                  <Shield className="h-4 w-4 text-champagne" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-graphite/60">Garantía 3 Años</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ivory rounded-full">
                  <Truck className="h-4 w-4 text-champagne" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-graphite/60">Envío 24h</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ivory rounded-full">
                  <CreditCard className="h-4 w-4 text-champagne" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-graphite/60">Transferencia Segura</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ivory rounded-full">
                  <Award className="h-4 w-4 text-champagne" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-graphite/60">100% Original</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Technical Features Section - Now full width below */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-ivory/50 rounded-2xl p-8 lg:p-12 border border-pearl">
            <h2 className="font-heading text-2xl lg:text-3xl font-semibold text-graphite mb-10 text-center uppercase tracking-widest">
              Características Técnicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10">
              {/* Technical Item Component */}
              <TechnicalItem icon={<Layers />} label="Colección" value={product.series} />
              <TechnicalItem icon={<Cpu />} label="Calibre" value={product.calibre} />
              <TechnicalItem icon={<Maximize2 />} label="Diámetro" value={product.diameter} />
              <TechnicalItem icon={<Users />} label="Género" value={product.gender || 'Hombre'} />
              <TechnicalItem icon={<Palette />} label="Color Caja" value={product.color} />
              <TechnicalItem icon={<CircleDashed />} label="Fondo" value={product.caseBack} />
              <TechnicalItem icon={<Ruler />} label="Grosor" value={product.thickness ? `${product.thickness} mm` : null} />
              <TechnicalItem icon={<Watch />} label="Pulsera" value={product.strapMaterial} />
              <TechnicalItem icon={<Waves />} label="Resistencia" value={product.waterResistance} />
              <TechnicalItem icon={<Clock />} label="Movimiento" value={product.movement} />
              <TechnicalItem icon={<Search />} label="Cristal" value={product.glassMaterial} />
              <TechnicalItem icon={<ShieldCheck />} label="Garantía" value={`${product.warranty || '3'} Años`} />
              
              {/* Features Tags */}
              {product.features && product.features.length > 0 && (
                <div className="col-span-full mt-6 pt-10 border-t border-pearl flex flex-wrap gap-2 justify-center">
                  {product.features.map((f, i) => (
                    <span key={i} className="px-4 py-1.5 bg-white border border-pearl rounded-full text-[10px] font-bold uppercase tracking-widest text-graphite/60 shadow-sm">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 text-center">
            <h2 className="font-heading text-3xl font-semibold text-graphite mb-4 uppercase tracking-[0.2em]">
              También te puede interesar
            </h2>
            <p className="text-graphite/40 text-sm uppercase tracking-widest mb-12">Modelos de la misma colección</p>
            
              <div className="flex flex-wrap justify-center gap-8">
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
                    <Link key={related.id} href={`/productos/${related.slug}`} className="group w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-[300px]">
                      <div className="bg-white rounded-xl border border-pearl overflow-hidden hover:shadow-xl transition-all duration-500 h-full">
                        <div className="relative aspect-square bg-ivory overflow-hidden">

                        <Image
                          src={relatedImageUrl}
                          alt={related.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-graphite/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-6 text-left">
                        <p className="text-[10px] text-champagne font-bold uppercase tracking-widest mb-2">{related.brand}</p>
                        <h3 className="font-heading text-sm font-semibold text-graphite mb-3 line-clamp-1 group-hover:text-champagne transition-colors">
                          {related.name}
                        </h3>
                        <p className="text-lg font-bold text-graphite">
                          {related.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

// Sub-component for technical items to keep main JSX clean
function TechnicalItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) {
  if (!value || value === 'N/A') return null;
  return (
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-white rounded-lg text-graphite/30 shadow-sm border border-pearl">
        {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
      </div>
      <div>
        <p className="text-[10px] font-bold text-graphite/40 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-semibold text-graphite leading-tight">{value}</p>
      </div>
    </div>
  );
}
