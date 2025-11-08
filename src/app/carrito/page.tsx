"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, Tag, X, CreditCard, Package } from "lucide-react";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function CarritoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Shipping form
  const [shippingForm, setShippingForm] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "España",
  });

  const total = subtotal - discount;

  useEffect(() => {
    if (session?.user) {
      setShippingForm((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: couponCode,
          subtotal,
          email: shippingForm.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setDiscount(data.discountAmount);
        toast.success(`Cupón aplicado: -${data.discountAmount.toFixed(2)} €`);
      } else {
        toast.error(data.message || "Cupón no válido");
      }
    } catch (error) {
      toast.error("Error al validar cupón");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    toast.success("Cupón eliminado");
  };

  const validateShippingForm = () => {
    const required = ["name", "email", "phone", "address", "city", "postalCode"];
    for (const field of required) {
      if (!shippingForm[field as keyof typeof shippingForm]) {
        toast.error(`Por favor completa: ${field}`);
        return false;
      }
    }
    return true;
  };

  const createOrder = async () => {
    if (!validateShippingForm()) {
      throw new Error("Complete shipping form");
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (sessionId) headers["X-Session-Id"] = sessionId;

      const orderData = {
        items: items.map((item) => ({
          name: `${item.brand} ${item.name}`,
          quantity: item.quantity,
          unitAmount: item.price.toFixed(2),
        })),
        totalAmount: total.toFixed(2),
        currency: "EUR",
      };

      const response = await fetch("/api/orders/create-paypal", {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const data = await response.json();
      return data.orderId;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (sessionId) headers["X-Session-Id"] = sessionId;

      const orderData = {
        paypalOrderId: data.orderID,
        items: items.map((item) => ({
          productId: item.productId,
          productName: `${item.brand} ${item.name}`,
          productReference: item.reference,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        discountAmount: discount,
        total,
        couponCode: appliedCoupon?.code || null,
        shippingInfo: shippingForm,
      };

      const response = await fetch("/api/orders/capture-paypal", {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to capture order");

      const result = await response.json();
      
      await clearCart();
      toast.success("¡Pago completado exitosamente!");
      
      router.push(`/pago/exito?orderId=${result.orderNumber}`);
    } catch (error) {
      console.error("Error capturing order:", error);
      toast.error("Error al procesar el pago");
      setIsProcessing(false);
    }
  };

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
                        <Package className="h-10 w-10 text-graphite/30" />
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
                      onClick={() => removeItem(item.productId)}
                      className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-graphite w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
                      <span className="text-sm font-medium text-green-700">
                        {appliedCoupon.code}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1 hover:bg-green-100 rounded"
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
                  <span className="font-medium text-graphite">Calculado en checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium text-graphite">Total</span>
                <span className="text-2xl font-bold text-champagne">{total.toFixed(2)} €</span>
              </div>

              {/* Shipping Form */}
              <div className="mb-6 space-y-3">
                <h3 className="font-medium text-graphite mb-3">Información de envío</h3>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={shippingForm.name}
                  onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={shippingForm.email}
                  onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={shippingForm.phone}
                  onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                />
                <input
                  type="text"
                  placeholder="Dirección"
                  value={shippingForm.address}
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Ciudad"
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                  />
                  <input
                    type="text"
                    placeholder="CP"
                    value={shippingForm.postalCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                  />
                </div>
              </div>

              {/* PayPal Buttons */}
              <PayPalScriptProvider
                options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                  currency: "EUR",
                  intent: "capture",
                }}
              >
                <div className="mb-4">
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    disabled={isProcessing}
                    style={{
                      layout: "vertical",
                      color: "gold",
                      shape: "rect",
                      label: "checkout",
                    }}
                  />
                </div>
              </PayPalScriptProvider>

              <p className="text-xs text-graphite/60 text-center">
                Pago 100% seguro con PayPal o tarjeta
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
