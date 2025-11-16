// src/app/carrito/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  Tag,
  X,
  Shield,
  Truck,
  CreditCard,
  FileText,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { trackBeginCheckout } from "@/lib/analytics";

const STANDARD_SHIPPING = 19.99;

export default function CarritoPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Cart context
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  // Discounts & shipping (local UI state)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(STANDARD_SHIPPING);
  const [checkoutTracked, setCheckoutTracked] = useState(false);

  // Shipping form (solo para pre-rellenar en /pagar; aquí no enviamos nada)
  const [shippingForm, setShippingForm] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "España",
  });

  useEffect(() => {
    if (session?.user) {
      setShippingForm((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  // Track begin_checkout al llegar con items
  useEffect(() => {
    if (items.length > 0 && !checkoutTracked) {
      const total = subtotal - discount + shippingCost;
      trackBeginCheckout(
        items.map((item) => ({
          id: item.productId,
          name: item.name,
          brand: item.brand,
          reference: item.reference,
          price: item.price,
          quantity: item.quantity,
        })),
        total
      );
      setCheckoutTracked(true);
    }
  }, [items, subtotal, discount, shippingCost, checkoutTracked]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers,
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          code: couponCode,
          subtotal,
          email: shippingForm.email || "",
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setDiscount(data.discountAmount);
        if (data.coupon.code === "WELCOME5") {
          setShippingCost(0);
          toast.success(`Cupón aplicado: -${data.discountAmount.toFixed(2)} € + Envío gratis`);
        } else {
          toast.success(`Cupón aplicado: -${data.discountAmount.toFixed(2)} €`);
        }
      } else {
        toast.error(data.message || "Cupón no válido");
      }
    } catch {
      toast.error("Error al validar cupón");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setShippingCost(STANDARD_SHIPPING);
    setCouponCode("");
    toast.success("Cupón eliminado");
  };

  const total = subtotal - discount + shippingCost;
  const hasFreeShipping = appliedCoupon?.code === "WELCOME5";

  // Carrito vacío
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-graphite/20 mx-auto mb-6" />
            <h1 className="font-heading text-3xl font-medium text-graphite mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-graphite/60 mb-8">
              Explora nuestra colección y añade productos
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
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl font-medium text-graphite mb-8"
        >
          Tu carrito
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="bg-white rounded-lg border border-pearl p-6"
              >
                <div className="flex gap-6">
                  <div className="relative w-24 h-24 bg-pearl rounded-lg flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-10 w-10 text-graphite/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-medium text-graphite mb-1">
                      {item.brand} {item.name}
                    </h3>
                    <p className="text-sm text-graphite/60 mb-3">Ref: {item.reference}</p>
                    <p className="text-xl font-bold text-champagne">
                      {(item.price * item.quantity).toFixed(2)} €
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)} {/* <- usar cart item id */}
                      className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      aria-label="Eliminar producto"
                      title="Eliminar producto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const next = item.quantity - 1;
                          if (next < 1) return;
                          updateQuantity(item.id, next); // <- usar cart item id
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors"
                        aria-label="Disminuir cantidad"
                        title="Disminuir cantidad"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-graphite w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          const next = item.quantity + 1;
                          updateQuantity(item.id, next); // <- usar cart item id
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors"
                        aria-label="Aumentar cantidad"
                        title="Aumentar cantidad"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => router.push("/productos")}
                className="text-sm text-graphite hover:text-champagne transition-colors flex items-center gap-2"
              >
                ← Seguir comprando
              </button>
            </div>
          </div>

          {/* Checkout Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-pearl p-6 sticky top-24">
              <h2 className="font-heading text-xl font-medium text-graphite mb-6">
                Resumen del pedido
              </h2>

              {/* Coupon */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-graphite mb-2">
                  Código de descuento
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <div>
                        <span className="text-sm font-medium text-green-700 block">
                          {appliedCoupon.code}
                        </span>
                        {appliedCoupon.code === "WELCOME5" && (
                          <span className="text-xs text-green-600">
                            5% descuento + Envío gratis
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1 hover:bg-green-100 rounded"
                      aria-label="Eliminar cupón"
                    >
                      <X className="h-4 w-4 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="WELCOME5"
                      className="flex-1 px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-graphite text-ivory text-sm font-medium rounded-lg hover:bg-graphite/90 transition-all disabled:opacity-50"
                    >
                      {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                    </button>
                  </div>
                )}
                <p className="text-xs text-graphite/60 mt-2">
                  Usa <span className="font-semibold">WELCOME5</span> para 5% de descuento + envío gratis
                </p>
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-6 pb-6 border-b border-pearl">
                <div className="flex justify-between text-sm">
                  <span className="text-graphite/70">Subtotal</span>
                  <span className="font-medium text-graphite">{subtotal.toFixed(2)} €</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Descuento</span>
                    <span className="font-medium text-green-600">-{discount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-graphite/70">Envío</span>
                  <span className="font-medium text-graphite">
                    {hasFreeShipping ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      `${shippingCost.toFixed(2)} €`
                    )}
                  </span>
                </div>
                <div className="text-xs text-graphite/60">IVA incluido en el precio final</div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium text-graphite">Total</span>
                <span className="text-2xl font-bold text-champagne">{total.toFixed(2)} €</span>
              </div>

              {/* CTA: ir a pagar */}
              <button
                onClick={() => router.push("/pagar")}
                className="w-full mb-4 py-4 bg-champagne text-ivory font-medium text-lg rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Ir a pagar
                <ArrowRight className="h-5 w-5" />
              </button>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-pearl">
                <div className="grid grid-cols-2 gap-3 text-xs text-graphite/70">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-champagne" />
                    <span>Pago seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-champagne" />
                    <span>Envío asegurado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-champagne" />
                    <span>Autenticidad garantizada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-champagne" />
                    <span>Factura emitida</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
