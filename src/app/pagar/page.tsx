// src/app/pagar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Loader2, Tag, X, Shield, Truck, CreditCard, FileText, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";
import Link from "next/link";

const STANDARD_SHIPPING = 19.99;
const CART_EVENT = "cart:updated";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    brand: string;
    reference: string;
    price: number;
    stock: number;
    imageUrl: string | null;
  };
  subtotal?: number; // opcional por compat
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export default function PagarPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(STANDARD_SHIPPING);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutTracked, setCheckoutTracked] = useState(false);

  // Form envío
  const [shippingForm, setShippingForm] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "España",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // PayPal client id (aviso si falta)
  const PAYPAL_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
  const paypalReady = Boolean(PAYPAL_ID);

  useEffect(() => {
    fetchCart();
    // Si el carrito cambia en otra pestaña, recargar
    const onUpdated = () => fetchCart();
    window.addEventListener(CART_EVENT, onUpdated);
    window.addEventListener("cartUpdated", onUpdated);
    return () => {
      window.removeEventListener(CART_EVENT, onUpdated);
      window.removeEventListener("cartUpdated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.user) {
      setShippingForm((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  // Track begin_checkout cuando hay carrito
  useEffect(() => {
    if (cart && cart.items.length > 0 && !checkoutTracked) {
      const total = cart.subtotal - discount + shippingCost;
      trackBeginCheckout(
        cart.items.map((item) => ({
          id: item.productId,
          name: item.product.name,
          brand: item.product.brand,
          reference: item.product.reference,
          price: item.product.price,
          quantity: item.quantity,
        })),
        total
      );
      setCheckoutTracked(true);
    }
  }, [cart, discount, shippingCost, checkoutTracked]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (sessionId) headers["X-Session-Id"] = sessionId;

      const url = sessionId ? `/api/cart/get?sessionId=${sessionId}` : `/api/cart/get`;

      const response = await fetch(url, {
        headers,
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        toast.error("Error al cargar el carrito");
        setCart({ items: [], subtotal: 0, itemCount: 0 });
      }
    } catch (error) {
      toast.error("Error al cargar el carrito");
      setCart({ items: [], subtotal: 0, itemCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!shippingForm.name.trim()) errors.name = "Nombre es requerido";
    if (!shippingForm.email.trim()) errors.email = "Email es requerido";
    else if (!/\S+@\S+\.\S+/.test(shippingForm.email)) errors.email = "Email inválido";
    if (!shippingForm.address.trim()) errors.address = "Dirección es requerida";
    if (!shippingForm.city.trim()) errors.city = "Ciudad es requerida";
    if (!shippingForm.postalCode.trim()) errors.postalCode = "Código postal es requerido";

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Por favor completa todos los campos requeridos");
      return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;

    setValidatingCoupon(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers,
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          code: couponCode,
          subtotal: cart.subtotal,
          email: shippingForm.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
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

  const createOrder = async () => {
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }
    if (!validateForm()) {
      throw new Error("Invalid form");
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (sessionId) headers["X-Session-Id"] = sessionId;

      const total = cart.subtotal - discount + shippingCost;

      const orderData = {
        items: cart.items.map((item) => ({
          name: `${item.product.brand} ${item.product.name}`,
          quantity: item.quantity,
          unitAmount: item.product.price.toFixed(2),
        })),
        shippingAmount: shippingCost.toFixed(2),
        totalAmount: total.toFixed(2),
        currency: "EUR",
      };

      const response = await fetch("/api/orders/create-paypal", {
        method: "POST",
        headers,
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create order");
      }

      const data = await response.json();
      return data.orderId;
    } catch (error: any) {
      setIsProcessing(false);
      toast.error(error.message || "Error al crear orden");
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    if (!cart) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (sessionId) headers["X-Session-Id"] = sessionId;

      const total = cart.subtotal - discount + shippingCost;

      const orderData = {
        paypalOrderId: data.orderID,
        items: cart.items.map((item) => ({
          productId: item.productId,
          productName: `${item.product.brand} ${item.product.name}`,
          productReference: item.product.reference,
          unitPrice: item.product.price,
          quantity: item.quantity,
        })),
        subtotal: cart.subtotal,
        discountAmount: discount,
        shippingCost,
        total,
        couponCode: appliedCoupon?.code || null,
        shippingInfo: shippingForm,
      };

      const response = await fetch("/api/orders/capture-paypal", {
        method: "POST",
        headers,
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to capture order");
      }

      const result = await response.json();

      // Analytics
      trackPurchase(
        result.orderNumber,
        cart.items.map((item) => ({
          id: item.productId,
          name: item.product.name,
          brand: item.product.brand,
          reference: item.product.reference,
          price: item.product.price,
          quantity: item.quantity,
        })),
        cart.subtotal,
        discount,
        total,
        appliedCoupon?.code
      );

      // Limpiar carrito local invitado (servidor debería vaciar en capture)
      localStorage.removeItem("guest_session_id");
      window.dispatchEvent(new Event(CART_EVENT));

      toast.success("¡Pago completado exitosamente!");
      router.push(`/pago/exito?orden=${result.orderNumber}`);
    } catch (error: any) {
      console.error("Error capturing order:", error);
      toast.error(error.message || "Error al procesar el pago");
      setIsProcessing(false);
    }
  };

  const onError = (err: any) => {
    console.error("PayPal error:", err);
    toast.error("Error en el proceso de pago");
    setIsProcessing(false);
  };

  if (loading) {
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

  if (!cart || cart.items.length === 0) {
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
              Añade productos a tu carrito antes de proceder al pago
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

  const total = cart.subtotal - discount + shippingCost;
  const hasFreeShipping = appliedCoupon?.code === "WELCOME5";

  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/carrito"
            className="inline-flex items-center gap-2 text-sm text-graphite hover:text-champagne transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al carrito
          </Link>
          <h1 className="font-heading text-4xl font-medium text-graphite">
            Finalizar compra
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-pearl p-6"
            >
              <h2 className="font-heading text-xl font-medium text-graphite mb-4">
                Información de envío
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.name}
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, name: e.target.value });
                      setFormErrors({ ...formErrors, name: "" });
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 ${
                      formErrors.name ? "border-red-500" : "border-pearl"
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={shippingForm.email}
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, email: e.target.value });
                      setFormErrors({ ...formErrors, email: "" });
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 ${
                      formErrors.email ? "border-red-500" : "border-pearl"
                    }`}
                    placeholder="juan@ejemplo.com"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">
                    Teléfono <span className="text-graphite/50">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={shippingForm.phone}
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, phone: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50"
                    placeholder="+34 600 123 456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={shippingForm.country}
                    disabled
                    className="w-full px-4 py-2.5 border border-pearl rounded-lg bg-pearl/30 text-graphite/70"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-graphite mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.address}
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, address: e.target.value });
                      setFormErrors({ ...formErrors, address: "" });
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 ${
                      formErrors.address ? "border-red-500" : "border-pearl"
                    }`}
                    placeholder="Calle Principal 123, Piso 4, Puerta B"
                  />
                  {formErrors.address && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.city}
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, city: e.target.value });
                      setFormErrors({ ...formErrors, city: "" });
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 ${
                      formErrors.city ? "border-red-500" : "border-pearl"
                    }`}
                    placeholder="Madrid"
                  />
                  {formErrors.city && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.postalCode}
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, postalCode: e.target.value });
                      setFormErrors({ ...formErrors, postalCode: "" });
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 ${
                      formErrors.postalCode ? "border-red-500" : "border-pearl"
                    }`}
                    placeholder="28001"
                  />
                  {formErrors.postalCode && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.postalCode}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-pearl p-6"
            >
              <h2 className="font-heading text-xl font-medium text-graphite mb-4">
                Método de pago
              </h2>

              {!paypalReady && (
                <p className="text-sm text-red-600 mb-3">
                  Falta configurar <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>. Sin ello el botón de PayPal no se mostrará.
                </p>
              )}

              <p className="text-sm text-graphite/70 mb-4">
                Completa el formulario de envío para habilitar el pago con PayPal
              </p>

              <PayPalScriptProvider
                options={{
                  clientId: PAYPAL_ID || "missing",
                  currency: "EUR",
                  intent: "capture",
                }}
              >
                <PayPalButtons
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onError}
                  disabled={isProcessing}
                  style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "paypal",
                    height: 50,
                  }}
                />
              </PayPalScriptProvider>
            </motion.div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-pearl p-6 sticky top-24">
              <h2 className="font-heading text-xl font-medium text-graphite mb-4">
                Resumen del pedido
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6 pb-6 border-b border-pearl">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-pearl rounded flex-shrink-0 overflow-hidden">
                      {item.product.imageUrl ? (
                        <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-graphite/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-graphite truncate">
                        {item.product.brand} {item.product.name}
                      </p>
                      <p className="text-xs text-graphite/60">
                        {item.quantity} × {item.product.price.toFixed(2)} €
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-graphite">
                        {(item.product.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>

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
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 pb-6 border-b border-pearl">
                <div className="flex justify-between text-sm">
                  <span className="text-graphite/70">Subtotal</span>
                  <span className="font-medium text-graphite">{cart.subtotal.toFixed(2)} €</span>
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
                <div className="text-xs text-graphite/60">
                  IVA incluido en el precio final
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium text-graphite">Total</span>
                <span className="text-2xl font-bold text-champagne">{total.toFixed(2)} €</span>
              </div>

              {/* Trust Badges */}
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
      </main>

      <Footer />
    </div>
  );
}
