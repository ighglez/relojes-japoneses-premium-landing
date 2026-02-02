"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSession } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Loader2, 
  Tag, 
  X, 
  Shield, 
  ShoppingBag, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageCircle,
  MapPin,
  Mail,
  Phone,
  User,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { trackBeginCheckout } from "@/lib/analytics";
import Link from "next/link";

const STANDARD_SHIPPING = 19.99;

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
    images: any;
  };
  subtotal: number;
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
  
  // Form state
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "España",
    billingAddressSame: true,
    billingName: "",
    billingAddress: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "España",
    contactWhatsApp: true,
    customerNotes: "",
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  // Track begin_checkout
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
      const sessionId = localStorage.getItem("guest_session_id");
      const url = sessionId ? `/api/cart/get?sessionId=${sessionId}` : `/api/cart/get`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        toast.error("Error al cargar el carrito");
      }
    } catch (error) {
      toast.error("Error al cargar el carrito");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = "El nombre es obligatorio";
    if (!formData.email.trim()) errors.email = "El correo electrónico es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email inválido";
    if (!formData.phone.trim()) errors.phone = "El número de teléfono es obligatorio";
    if (!formData.address.trim()) errors.address = "La dirección es obligatoria";
    if (!formData.city.trim()) errors.city = "La ciudad es obligatoria";
    if (!formData.postalCode.trim()) errors.postalCode = "El código postal es obligatorio";

    if (!formData.billingAddressSame) {
      if (!formData.billingName.trim()) errors.billingName = "El nombre de facturación es obligatorio";
      if (!formData.billingAddress.trim()) errors.billingAddress = "La dirección de facturación es obligatoria";
      if (!formData.billingCity.trim()) errors.billingCity = "La ciudad de facturación es obligatoria";
      if (!formData.billingPostalCode.trim()) errors.billingPostalCode = "El código postal de facturación es obligatorio";
    }

    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error("Por favor, completa todos los campos obligatorios");
      return false;
    }
    
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;

    setValidatingCoupon(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          subtotal: cart.subtotal,
          email: formData.email,
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
    } catch (error) {
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart || cart.items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const sessionId = localStorage.getItem("guest_session_id");
      const total = cart.subtotal - discount + shippingCost;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(sessionId && { "X-Session-Id": sessionId })
        },
        body: JSON.stringify({
          ...formData,
          items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            productName: `${item.product.brand} ${item.product.name}`,
            productReference: item.product.reference,
          })),
          subtotal: cart.subtotal,
          discountAmount: discount,
          shippingCost: shippingCost,
          total: total,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al procesar el pedido");
      }

      const result = await response.json();
      
      // Clear cart
      localStorage.removeItem("guest_session_id");
      window.dispatchEvent(new Event("cartUpdated"));
      
      toast.success("¡Pedido registrado correctamente!");
      router.push(`/pago/exito?orden=${result.orderNumber}`);
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el pedido");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-champagne animate-spin mb-4" />
          <p className="text-graphite/60 font-medium">Cargando detalles de tu pedido...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <ShoppingBag className="h-24 w-24 text-graphite/10 mx-auto mb-6" />
          <h1 className="font-heading text-3xl text-graphite mb-4">Tu carrito está vacío</h1>
          <p className="text-graphite/60 mb-8 max-w-md mx-auto">Parece que aún no has seleccionado ninguna pieza para tu colección.</p>
          <Link href="/productos" className="inline-block px-8 py-3 bg-champagne text-ivory rounded-lg hover:scale-105 transition-all shadow-lg shadow-champagne/20">Explorar la colección</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const total = cart.subtotal - discount + shippingCost;

  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <Link href="/carrito" className="inline-flex items-center gap-2 text-sm text-graphite/60 hover:text-graphite transition-colors mb-4 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver al carrito
          </Link>
          <h1 className="font-heading text-4xl font-medium text-graphite">Finalizar pedido</h1>
          <p className="text-graphite/60 mt-2">Completa tus datos para realizar la reserva premium.</p>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Content */}
          <div className="lg:col-span-7 space-y-10">
            {/* Section: Contact & Shipping */}
            <section className="space-y-6 bg-white p-8 rounded-[2rem] border border-pearl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-champagne/10 flex items-center justify-center text-champagne shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="font-heading text-2xl text-graphite">Datos de contacto y envío</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Nombre y apellidos *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-5 py-3.5 bg-ivory/30 border rounded-2xl focus:ring-2 focus:ring-champagne/20 outline-none transition-all ${formErrors.name ? 'border-red-400' : 'border-pearl hover:border-graphite/10'}`}
                    placeholder="Tu nombre completo"
                  />
                  {formErrors.name && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-5 py-3.5 bg-ivory/30 border rounded-2xl focus:ring-2 focus:ring-champagne/20 outline-none transition-all ${formErrors.email ? 'border-red-400' : 'border-pearl hover:border-graphite/10'}`}
                    placeholder="email@ejemplo.com"
                  />
                  {formErrors.email && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Número de teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-5 py-3.5 bg-ivory/30 border rounded-2xl focus:ring-2 focus:ring-champagne/20 outline-none transition-all ${formErrors.phone ? 'border-red-400' : 'border-pearl hover:border-graphite/10'}`}
                    placeholder="+34 600 000 000"
                  />
                  {formErrors.phone && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{formErrors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Dirección de envío completa *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-5 py-3.5 bg-ivory/30 border rounded-2xl focus:ring-2 focus:ring-champagne/20 outline-none transition-all ${formErrors.address ? 'border-red-400' : 'border-pearl hover:border-graphite/10'}`}
                    placeholder="Calle, número, piso, puerta..."
                  />
                  {formErrors.address && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{formErrors.address}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-5 py-3.5 bg-ivory/30 border rounded-2xl focus:ring-2 focus:ring-champagne/20 outline-none transition-all ${formErrors.city ? 'border-red-400' : 'border-pearl hover:border-graphite/10'}`}
                    placeholder="Ej. Madrid"
                  />
                  {formErrors.city && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Código Postal *</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className={`w-full px-5 py-3.5 bg-ivory/30 border rounded-2xl focus:ring-2 focus:ring-champagne/20 outline-none transition-all ${formErrors.postalCode ? 'border-red-400' : 'border-pearl hover:border-graphite/10'}`}
                    placeholder="28001"
                  />
                  {formErrors.postalCode && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{formErrors.postalCode}</p>}
                </div>
              </div>

              {/* Billing Toggle */}
              <div className="pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.billingAddressSame}
                      onChange={(e) => setFormData({ ...formData, billingAddressSame: e.target.checked })}
                    />
                    <div className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${formData.billingAddressSame ? 'bg-champagne border-champagne' : 'border-pearl group-hover:border-graphite/20'}`}>
                      {formData.billingAddressSame && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-graphite/70 font-medium">La dirección de facturación es la misma que la de envío</span>
                </label>
              </div>

              <AnimatePresence>
                {!formData.billingAddressSame && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 mt-6 border-t border-pearl">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Nombre de facturación *</label>
                        <input
                          type="text"
                          value={formData.billingName}
                          onChange={(e) => setFormData({ ...formData, billingName: e.target.value })}
                          className="w-full px-5 py-3.5 bg-ivory/30 border border-pearl rounded-2xl outline-none"
                          placeholder="Nombre fiscal o empresa"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Dirección de facturación *</label>
                        <input
                          type="text"
                          value={formData.billingAddress}
                          onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                          className="w-full px-5 py-3.5 bg-ivory/30 border border-pearl rounded-2xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Ciudad *</label>
                        <input
                          type="text"
                          value={formData.billingCity}
                          onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                          className="w-full px-5 py-3.5 bg-ivory/30 border border-pearl rounded-2xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Código Postal *</label>
                        <input
                          type="text"
                          value={formData.billingPostalCode}
                          onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                          className="w-full px-5 py-3.5 bg-ivory/30 border border-pearl rounded-2xl outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Section: Additional & Preferences */}
            <section className="space-y-8 bg-white p-8 rounded-[2rem] border border-pearl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-champagne/10 flex items-center justify-center text-champagne shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="font-heading text-2xl text-graphite">Método de pago</h2>
              </div>

              <div className="p-6 bg-ivory/50 border border-pearl rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-6 h-6 rounded-full border-2 border-champagne flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-champagne"></div>
                  </div>
                  <span className="font-bold text-graphite">Transferencia bancaria</span>
                </div>
                <p className="text-sm text-graphite/60 ml-10">
                  Realiza tu pago directamente en nuestra cuenta bancaria. Por favor, usa el número del pedido como referencia de pago. Tu pedido no será enviado hasta que el importe haya sido recibido en nuestra cuenta.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-ivory/30 border border-pearl rounded-2xl p-6">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.contactWhatsApp}
                        onChange={(e) => setFormData({ ...formData, contactWhatsApp: e.target.checked })}
                      />
                      <div className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${formData.contactWhatsApp ? 'bg-green-500 border-green-500 shadow-md shadow-green-500/20' : 'border-pearl group-hover:border-graphite/20 bg-white'}`}>
                        {formData.contactWhatsApp && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-graphite font-bold block mb-1">Contactarme también por WhatsApp para seguimiento del pedido y comunicación directa.</span>
                      <p className="text-xs text-graphite/50 italic">Puedes desmarcarlo si prefieres comunicación solo por email.</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-graphite/40 uppercase tracking-widest mb-2">Notas del pedido (opcional)</label>
                  <textarea
                    value={formData.customerNotes}
                    onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                    rows={4}
                    className="w-full px-5 py-4 bg-ivory/30 border border-pearl rounded-2xl focus:ring-2 focus:ring-champagne/20 outline-none transition-all resize-none"
                    placeholder="Ej.: es para regalo, tengo una duda concreta, me corre algo de prisa…"
                  />
                </div>
              </div>
            </section>

            {/* Product Reservation Notice */}
            <div className="bg-champagne/5 border border-champagne/20 rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-champagne/10">
                <Clock className="w-8 h-8 text-champagne" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-graphite mb-2">Reserva garantizada durante 24h</h3>
                <p className="text-sm text-graphite/70 leading-relaxed">
                  Al confirmar el pedido, el modelo queda <span className="text-graphite font-bold underline decoration-champagne/30">reservado exclusivamente para ti</span>. Nos pondremos en contacto contigo para finalizar el proceso de pago personalizado.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white border border-pearl rounded-[2.5rem] p-8 shadow-xl shadow-graphite/5">
                <h3 className="font-heading text-xl text-graphite mb-8 pb-4 border-b border-pearl">Tu selección</h3>
                
                <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="relative w-20 h-20 bg-ivory rounded-2xl overflow-hidden shrink-0 border border-pearl transition-transform group-hover:scale-105">
                        {item.product.images?.[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-graphite/5">
                            <ShoppingBag className="w-8 h-8 text-graphite/10" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-graphite truncate uppercase tracking-tight">{item.product.brand}</h4>
                          <span className="text-xs font-bold text-champagne">{item.product.price.toLocaleString('es-ES')}€</span>
                        </div>
                        <p className="text-xs text-graphite/50 truncate mb-2">{item.product.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-ivory px-2 py-0.5 rounded-lg text-graphite/60 border border-pearl uppercase tracking-tighter">{item.quantity} ud.</span>
                          <span className="text-[10px] text-graphite/30 font-mono">{item.product.reference}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Input */}
                <div className="mb-8">
                  <div className="flex gap-2 p-1.5 bg-ivory rounded-2xl border border-pearl focus-within:ring-2 focus-within:ring-champagne/20 transition-all">
                    <input
                      type="text"
                      placeholder="Código de cupón"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-transparent px-4 py-2 text-sm outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode}
                      className="bg-graphite text-ivory px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-graphite/90 transition-all disabled:opacity-50"
                    >
                      {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between mt-3 px-4 py-2.5 bg-green-50 rounded-xl border border-green-100"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-bold text-green-700 uppercase tracking-tight">{appliedCoupon.code} aplicado</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-green-700 hover:text-green-800 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Costs */}
                <div className="space-y-3 pt-6 border-t border-pearl mb-8">
                  <div className="flex justify-between text-xs font-medium text-graphite/40 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{cart.subtotal.toLocaleString('es-ES')} €</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-green-600 uppercase tracking-widest">
                      <span>Descuento aplicado</span>
                      <span>-{discount.toLocaleString('es-ES')} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-medium text-graphite/40 uppercase tracking-widest">
                    <span>Gastos de envío</span>
                    <span className={shippingCost === 0 ? 'text-green-600 font-bold' : ''}>
                      {shippingCost === 0 ? 'Gratis' : `${shippingCost.toLocaleString('es-ES')} €`}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-xs font-bold text-graphite/40 uppercase tracking-[0.2em]">Total Final</span>
                    <span className="text-3xl font-heading text-graphite font-bold leading-none">{total.toLocaleString('es-ES')} <span className="text-lg">€</span></span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-champagne text-ivory py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm shadow-xl shadow-champagne/30 hover:bg-champagne/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar y Reservar
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center justify-center gap-6 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" width={60} height={15} />
                  <div className="h-4 w-[1px] bg-graphite/20" />
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={40} height={12} />
                  <div className="h-4 w-[1px] bg-graphite/20" />
                  <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={30} height={18} />
                </div>
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-pearl flex flex-col items-center text-center shadow-sm">
                  <Shield className="w-6 h-6 text-champagne mb-2" />
                  <span className="text-[8px] font-bold text-graphite/60 uppercase tracking-tighter leading-tight">Seguridad<br/>Garantizada</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-pearl flex flex-col items-center text-center shadow-sm">
                  <Clock className="w-6 h-6 text-champagne mb-2" />
                  <span className="text-[8px] font-bold text-graphite/60 uppercase tracking-tighter leading-tight">Reserva<br/>24 Horas</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-pearl flex flex-col items-center text-center shadow-sm">
                  <User className="w-6 h-6 text-champagne mb-2" />
                  <span className="text-[8px] font-bold text-graphite/60 uppercase tracking-tighter leading-tight">Trato<br/>Personalizado</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
