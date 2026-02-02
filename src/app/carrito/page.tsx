"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Loader2, X, ShoppingCart, ChevronRight, ArrowLeft, ArrowRight, Shield, Truck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const STANDARD_SHIPPING = 19.99;

export default function CarritoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(STANDARD_SHIPPING);
  
  const total = subtotal - discount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          subtotal,
          email: session?.user?.email || "",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-champagne" />
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-ivory h-32 w-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <ShoppingBag className="h-12 w-12 text-graphite/20" />
            </div>
            <h1 className="font-heading text-3xl font-semibold text-graphite mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-graphite/50 mb-10 leading-relaxed">
              Descubre nuestra exclusiva colección de relojes y encuentra la pieza perfecta para tu estilo.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-10 py-4 bg-graphite text-ivory font-bold rounded-lg hover:bg-black transition-all uppercase tracking-[0.15em] text-xs shadow-lg shadow-graphite/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Explorar Tienda
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-semibold text-graphite mb-2 uppercase tracking-widest">Carrito</h1>
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-graphite/40">
            <Link href="/" className="hover:text-champagne transition-colors">Inicio</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/productos" className="hover:text-champagne transition-colors">Tienda</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-graphite">Cesta</span>
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Cart Items Table */}
          <div className="lg:w-2/3">
            <div className="border border-pearl rounded-xl overflow-hidden shadow-sm">
              <div className="bg-ivory/50 flex justify-end p-4 border-b border-pearl">
                <button 
                  onClick={() => {
                    if (confirm("¿Estás seguro de que deseas vaciar el carrito?")) {
                      clearCart();
                    }
                  }}
                  className="text-graphite/40 hover:text-red-500 text-[10px] font-bold px-4 py-2 flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Vaciar carrito
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-pearl bg-white text-[10px] font-bold text-graphite/40 uppercase tracking-[0.15em]">
                      <th className="p-6 w-10"></th>
                      <th className="p-6">Producto</th>
                      <th className="p-6 text-center">Precio</th>
                      <th className="p-6 text-center">Cantidad</th>
                      <th className="p-6 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-pearl/50 hover:bg-ivory/20 transition-colors">
                        <td className="p-6 text-center">
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-graphite/20 hover:text-red-500 transition-colors"
                            aria-label="Eliminar producto"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-6">
                            <div className="relative w-20 h-20 flex-shrink-0 bg-ivory rounded-lg overflow-hidden border border-pearl">
                              <Image 
                                src={item.imageUrl || "/images/products/placeholder-watch.webp"} 
                                alt={item.name} 
                                fill 
                                className="object-cover" 
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] text-champagne font-bold uppercase tracking-widest">{item.brand}</p>
                              <Link href={`/productos/${item.productId}`} className="text-sm font-semibold text-graphite hover:text-champagne transition-colors">
                                {item.name}
                              </Link>
                              <p className="text-[10px] text-graphite/40 font-mono">REF: {item.reference}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className="text-xs font-medium text-graphite">
                            {item.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center border border-pearl rounded-lg bg-white overflow-hidden max-w-[100px] mx-auto shadow-sm">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-2 text-graphite/40 hover:bg-ivory transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="flex-1 text-center text-xs font-bold text-graphite min-w-[30px]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-2 text-graphite/40 hover:bg-ivory transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-xs font-bold text-graphite">
                            {(item.price * item.quantity).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-8 flex flex-col md:flex-row gap-6 justify-between bg-white border-t border-pearl">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="CÓDIGO DE CUPÓN"
                    className="border border-pearl bg-ivory/30 px-6 py-3 rounded-lg text-[10px] font-bold tracking-widest w-full md:w-[200px] focus:outline-none focus:ring-2 focus:ring-champagne/20 transition-all uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon}
                    className="bg-graphite text-ivory font-bold px-8 py-3 rounded-lg text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                  >
                    {validatingCoupon ? "..." : "Aplicar"}
                  </button>
                </div>
                <button
                  onClick={() => router.refresh()}
                  className="border-2 border-pearl text-graphite/60 font-bold px-10 py-3 rounded-lg text-[10px] uppercase tracking-widest hover:bg-ivory hover:text-graphite transition-all"
                >
                  Actualizar carrito
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:w-1/3">
            <div className="border border-pearl rounded-xl bg-ivory/20 p-8 shadow-sm">
              <h2 className="font-heading text-2xl font-semibold text-graphite mb-8 uppercase tracking-widest border-b border-pearl pb-4">
                Resumen del pedido
              </h2>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-graphite/40 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                  <span className="text-graphite font-semibold">
                    {subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm p-3 bg-champagne/10 rounded-lg border border-champagne/20">
                    <div className="flex flex-col gap-1">
                      <span className="text-champagne font-bold uppercase tracking-widest text-[10px]">Cupón: {appliedCoupon.code}</span>
                      <button onClick={handleRemoveCoupon} className="text-[10px] text-graphite/40 hover:text-graphite underline text-left">Eliminar</button>
                    </div>
                    <span className="text-champagne font-bold">
                      -{discount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                )}
                
                <div className="space-y-3 pt-6 border-t border-pearl">
                  <div className="flex justify-between items-center">
                    <span className="text-graphite/40 font-bold uppercase tracking-widest text-[10px]">Envío (Tarifa plana)</span>
                    <span className="text-graphite font-semibold text-sm">
                      {shippingCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-graphite/40 uppercase tracking-widest leading-relaxed">
                    Entrega asegurada en 24-48 horas laborables (Península y Baleares).
                  </p>
                </div>
                
                <div className="pt-8 border-t-2 border-pearl">
                  <div className="flex justify-between items-end mb-8">
                    <span className="text-graphite font-bold uppercase tracking-widest text-xs">Total</span>
                    <span className="text-3xl font-bold text-graphite">
                      {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => router.push("/pagar")}
                    className="w-full bg-graphite text-ivory font-bold py-5 rounded-lg uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-graphite/10 flex items-center justify-center gap-3 group"
                  >
                    Finalizar pedido
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="pt-8 flex flex-wrap justify-center gap-6">
                  <div className="flex flex-col items-center gap-2 opacity-30 grayscale">
                    <Shield className="h-6 w-6" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Seguro</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 opacity-30 grayscale">
                    <Truck className="h-6 w-6" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Exprés</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 opacity-30 grayscale">
                    <CreditCard className="h-6 w-6" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Bancario</span>
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

// Helper icons missing from imports
function Trash2({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  );
}
