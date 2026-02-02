"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  User, 
  ShoppingBag, 
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders?orderNumber=${orderNumber}`);
        if (!response.ok) {
          throw new Error("Pedido no encontrado");
        }
        const data = await response.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-champagne animate-spin mb-4" />
          <p className="text-graphite/60">Cargando detalles de tu pedido...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-heading text-3xl text-graphite mb-4">Pedido no encontrado</h1>
          <p className="text-graphite/60 mb-8 max-w-md mx-auto">Lo sentimos, no hemos podido encontrar un pedido con el número: <span className="font-bold text-graphite">{orderNumber}</span></p>
          <Link href="/productos" className="inline-block px-8 py-3 bg-graphite text-ivory rounded-lg hover:scale-105 transition-all">Explorar la colección</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente de pago / Reserva activa', color: 'text-amber-600', bg: 'bg-amber-50' };
      case 'paid': return { label: 'Pago confirmado', color: 'text-green-600', bg: 'bg-green-50' };
      case 'shipped': return { label: 'Enviado', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'cancelled': return { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50' };
      default: return { label: status, color: 'text-graphite/60', bg: 'bg-ivory' };
    }
  };

  const status = getStatusDisplay(order.status);

  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-champagne/10 text-champagne text-[10px] font-bold uppercase tracking-widest rounded-full border border-champagne/20">
                Estado del pedido
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${status.color} ${status.bg} border-current`}>
                {status.label}
              </span>
            </div>
            <h1 className="font-heading text-4xl text-graphite">Pedido {order.orderNumber}</h1>
            <p className="text-graphite/60 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Realizado el {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/#contacto" 
              className="px-6 py-2.5 bg-white border border-pearl text-graphite text-sm font-medium rounded-xl hover:bg-ivory transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Solicitar ayuda
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
              {/* Status Timeline / Banner */}
              {order.status === 'pending' && (
                <div className="space-y-6">
                  <div className="bg-white border border-champagne/20 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Clock className="w-32 h-32" />
                    </div>
                    <div className="flex gap-6 items-start">
                      <div className="w-14 h-14 rounded-2xl bg-champagne/10 flex items-center justify-center shrink-0">
                        <Clock className="w-7 h-7 text-champagne" />
                      </div>
                      <div>
                        <h2 className="font-heading text-xl text-graphite mb-2">Reserva activa por 24 horas</h2>
                        <p className="text-sm text-graphite/60 leading-relaxed mb-4">
                          Tu pedido ha sido registrado correctamente y las piezas están bloqueadas para ti hasta el <strong>{new Date(order.reservedUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong>.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <div className="px-3 py-1.5 bg-ivory rounded-lg text-[10px] font-bold text-graphite/40 border border-pearl uppercase tracking-wider">Esperando pago manual</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BANK DETAILS SECTION */}
                  <div className="bg-graphite text-ivory rounded-[2rem] p-8 shadow-xl shadow-graphite/20 border border-pearl/10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-champagne/20 flex items-center justify-center text-champagne">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl">Instrucciones de Pago</h3>
                        <p className="text-xs text-ivory/50 uppercase tracking-widest">Transferencia Bancaria o Bizum</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest mb-1 font-bold">IBAN (España)</p>
                          <p className="text-sm font-mono font-bold tracking-wider select-all">ES43 0000 0000 0000 0000 0000</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest mb-1 font-bold">BIC / SWIFT</p>
                          <p className="text-sm font-mono font-bold tracking-wider select-all">RELOJESES2026</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest mb-1 font-bold">Concepto (Muy Importante)</p>
                          <p className="text-sm font-bold text-champagne select-all">{order.orderNumber}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest mb-1 font-bold">Titular</p>
                          <p className="text-sm font-bold uppercase">IWATCHWORKS EXCLUSIVE S.L.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-champagne/10 rounded-2xl border border-champagne/20 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-champagne flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-ivory" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1">Pago por Bizum</p>
                        <p className="text-sm">Envía el total a: <strong className="text-champagne font-bold text-lg">+34 600 000 000</strong></p>
                      </div>
                    </div>

                    <p className="mt-6 text-[10px] text-ivory/40 text-center uppercase tracking-widest">
                      Una vez realizado el pago, puedes enviarnos el comprobante por WhatsApp para agilizar el envío.
                    </p>
                  </div>
                </div>
              )}


            {/* Items List */}
            <div className="bg-white border border-pearl rounded-[2rem] overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-pearl bg-ivory/30">
                <h2 className="font-heading text-lg text-graphite flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-champagne" />
                  Artículos en el pedido
                </h2>
              </div>
              <div className="divide-y divide-pearl">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="p-8 flex gap-6 group">
                    <div className="w-24 h-24 bg-ivory rounded-2xl overflow-hidden shrink-0 border border-pearl flex items-center justify-center text-graphite/10 group-hover:scale-105 transition-transform">
                      <Package className="w-10 h-10" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <h3 className="font-bold text-graphite uppercase tracking-tight truncate">{item.productName}</h3>
                        <span className="font-bold text-graphite shrink-0">{item.unitPrice.toLocaleString('es-ES')} €</span>
                      </div>
                      <p className="text-xs text-graphite/40 font-mono mb-3">{item.productReference}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold bg-ivory px-2 py-0.5 rounded border border-pearl text-graphite/50 uppercase">Cantidad: {item.quantity}</span>
                        <span className="text-[10px] font-bold text-champagne uppercase tracking-widest">Subtotal: {item.subtotal.toLocaleString('es-ES')} €</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-8 bg-ivory/20 border-t border-pearl space-y-3">
                <div className="flex justify-between text-sm text-graphite/40 uppercase tracking-widest font-medium">
                  <span>Subtotal</span>
                  <span>{order.subtotal.toLocaleString('es-ES')} €</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 uppercase tracking-widest font-bold">
                    <span>Descuento</span>
                    <span>-{order.discountAmount.toLocaleString('es-ES')} €</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-heading text-graphite pt-3 border-t border-pearl/50">
                  <span className="font-bold">Total del pedido</span>
                  <span className="font-bold text-champagne">{order.total.toLocaleString('es-ES')} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Customer & Shipping */}
            <div className="bg-white border border-pearl rounded-[2rem] p-8 shadow-sm space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-graphite/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Cliente
                </h3>
                <div>
                  <p className="text-sm font-bold text-graphite">{order.shippingName}</p>
                  <p className="text-sm text-graphite/60">{order.shippingEmail}</p>
                  <p className="text-sm text-graphite/60">{order.shippingPhone}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-graphite/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Entrega
                </h3>
                <div className="text-sm text-graphite/70 leading-relaxed">
                  {order.shippingAddress}<br />
                  {order.shippingPostalCode} {order.shippingCity}<br />
                  {order.shippingCountry}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-graphite/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pago y Comunicación
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-graphite/60">
                    <CheckCircle2 className="w-4 h-4 text-champagne" />
                    <span>Pago Manual (Transferencia/Bizum)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-graphite/60">
                    <CheckCircle2 className="w-4 h-4 text-champagne" />
                    <span>Comunicación: {order.contactWhatsApp ? 'WhatsApp + Email' : 'Solo Email'}</span>
                  </div>
                </div>
              </div>

              {order.customerNotes && (
                <div className="space-y-4 pt-4 border-t border-pearl">
                  <h3 className="text-xs font-bold text-graphite/30 uppercase tracking-[0.2em]">Notas</h3>
                  <p className="text-xs text-graphite/60 italic leading-relaxed bg-ivory/50 p-4 rounded-xl border border-pearl">
                    "{order.customerNotes}"
                  </p>
                </div>
              )}
            </div>

            {/* Support Box */}
            <div className="bg-graphite text-ivory rounded-[2rem] p-8 shadow-xl shadow-graphite/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <MessageCircle className="w-20 h-20" />
              </div>
              <h3 className="font-heading text-xl mb-4 relative z-10">Atención Preferente</h3>
              <p className="text-sm text-ivory/60 mb-6 relative z-10 leading-relaxed">Si necesitas realizar el pago ahora mismo o tienes dudas sobre el envío asegurado.</p>
              <a 
                href={`https://wa.me/34600000000?text=Hola, tengo una duda sobre mi pedido ${order.orderNumber}`}
                target="_blank"
                className="block w-full py-3 bg-champagne text-ivory rounded-xl text-xs font-bold text-center uppercase tracking-widest hover:bg-champagne/90 transition-all relative z-10"
              >
                Chat Directo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
