"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ArrowRight, 
  Package, 
  Mail, 
  Clock, 
  FileText, 
  ShoppingBag, 
  User, 
  MapPin,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Image from "next/image";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orden");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      fetch(`/api/orders?orderNumber=${orderNumber}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setOrder(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navigation />
      
      <main className="flex-grow max-w-4xl mx-auto px-4 py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-graphite/5 border border-pearl overflow-hidden"
        >
          {/* Header Banner */}
          <div className="bg-graphite text-ivory p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] rotate-12 bg-gradient-to-b from-champagne via-transparent to-transparent" />
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-champagne mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-ivory" />
            </motion.div>
            
            <h1 className="font-heading text-3xl md:text-4xl font-medium mb-4">¡Tu pedido ha sido registrado correctamente!</h1>
            
            {orderNumber && (
              <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                <p className="text-sm tracking-widest font-mono uppercase">Nº de pedido: <span className="text-champagne font-bold">{orderNumber}</span></p>
              </div>
            )}
          </div>

            <div className="p-8 md:p-12 space-y-12">
                {/* Trust Messages & Bank Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4 p-8 bg-graphite text-ivory rounded-[2rem] border border-pearl/10 col-span-full shadow-xl shadow-graphite/20">
                    <div className="w-14 h-14 rounded-2xl bg-champagne/20 flex items-center justify-center shrink-0 border border-white/10">
                      <CreditCard className="w-7 h-7 text-champagne" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl mb-4">Instrucciones para el pago manual</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                        <div>
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest font-bold mb-1">IBAN (España)</p>
                          <p className="font-mono font-bold tracking-wider select-all">ES43 0000 0000 0000 0000 0000</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest font-bold mb-1">Titular</p>
                          <p className="font-bold uppercase">IWATCHWORKS EXCLUSIVE S.L.</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest font-bold mb-1">Concepto</p>
                          <p className="font-bold text-champagne select-all">Pedido {orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-ivory/40 uppercase tracking-widest font-bold mb-1">BIC / SWIFT</p>
                          <p className="font-mono font-bold tracking-wider select-all">RELOJESES2026</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-champagne flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-ivory" />
                        </div>
                        <p className="text-xs text-ivory/60 italic leading-relaxed">
                          Una vez confirmemos la recepción (24-48h), procederemos al envío asegurado. También puedes enviarnos el justificante por WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 bg-ivory/50 rounded-2xl border border-pearl">

                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Clock className="w-6 h-6 text-champagne" />
                  </div>
                  <div>
                    <h3 className="font-medium text-graphite mb-1">Reserva de 24 horas</h3>
                    <p className="text-sm text-graphite/60 leading-relaxed">Tu pieza ha sido reservada exclusivamente para ti durante las próximas 24h laborables mientras realizas el pago.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-6 bg-ivory/50 rounded-2xl border border-pearl">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <MessageCircle className="w-6 h-6 text-champagne" />
                  </div>
                  <div>
                    <h3 className="font-medium text-graphite mb-1">Contacto personalizado</h3>
                    <p className="text-sm text-graphite/60 leading-relaxed">Si lo prefieres, nuestro equipo te contactará por WhatsApp para enviarte el justificante o resolver dudas.</p>
                  </div>
                </div>
              </div>

            {/* Main Reassurance Text */}
            <div className="text-center space-y-2 py-4 border-y border-pearl/50">
              <p className="text-graphite/80 font-medium">Estamos procesando los detalles de tu solicitud.</p>
              <p className="text-sm text-graphite/50 italic">Tiempo habitual de respuesta: menos de 24 horas laborables.</p>
            </div>

            {/* Order Summary & Details */}
            {order && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Items */}
                <div className="space-y-6">
                  <h3 className="font-heading text-xl text-graphite flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-champagne" />
                    Resumen del pedido
                  </h3>
                  <div className="space-y-4">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 pb-4 border-b border-pearl last:border-0 last:pb-0">
                        <div className="w-16 h-16 bg-ivory rounded-lg overflow-hidden shrink-0 border border-pearl/50 flex items-center justify-center text-graphite/10">
                          <Package className="w-8 h-8" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-graphite truncate">{item.productName}</h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-graphite/50">{item.quantity} ud.</span>
                            <span className="text-sm font-medium text-graphite">{item.unitPrice.toLocaleString('es-ES')} €</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between text-sm text-graphite/50">
                        <span>Subtotal</span>
                        <span>{order.subtotal.toLocaleString('es-ES')} €</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 font-medium">
                          <span>Descuento aplicado</span>
                          <span>-{order.discountAmount.toLocaleString('es-ES')} €</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-heading text-graphite pt-2 border-t border-pearl">
                        <span>Total</span>
                        <span className="text-champagne font-bold">{order.total.toLocaleString('es-ES')} €</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-6">
                  <h3 className="font-heading text-xl text-graphite flex items-center gap-2">
                    <User className="w-5 h-5 text-champagne" />
                    Datos de entrega
                  </h3>
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ivory flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-graphite/40" />
                      </div>
                      <div>
                        <p className="text-xs text-graphite/40 uppercase tracking-widest font-bold">Cliente</p>
                        <p className="text-sm text-graphite font-medium">{order.shippingName}</p>
                        <p className="text-xs text-graphite/60">{order.shippingEmail}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ivory flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-graphite/40" />
                      </div>
                      <div>
                        <p className="text-xs text-graphite/40 uppercase tracking-widest font-bold">Dirección de envío</p>
                        <p className="text-sm text-graphite font-medium leading-relaxed">
                          {order.shippingAddress}<br />
                          {order.shippingPostalCode} {order.shippingCity}<br />
                          {order.shippingCountry}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ivory flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-graphite/40" />
                      </div>
                      <div>
                        <p className="text-xs text-graphite/40 uppercase tracking-widest font-bold">Seguimiento</p>
                        <p className="text-sm text-graphite/70">
                          Recibirás todas las actualizaciones en tu email. 
                          {order.contactWhatsApp && " También te contactaremos por WhatsApp."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/productos" 
                className="flex-1 px-8 py-4 bg-graphite text-ivory rounded-2xl font-medium text-center hover:bg-graphite/90 transition-all flex items-center justify-center gap-2"
              >
                Volver a la tienda
                <ShoppingBag className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => window.print()}
                className="flex-1 px-8 py-4 bg-white border border-pearl text-graphite rounded-2xl font-medium text-center hover:bg-ivory transition-all flex items-center justify-center gap-2"
              >
                Imprimir resumen
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Support Link */}
        <p className="text-center text-graphite/40 text-sm mt-12 leading-relaxed">
          ¿Tienes alguna duda inmediata? <Link href="/#contacto" className="text-champagne hover:underline">Contacta con nuestro equipo de atención preferente</Link>.
        </p>
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
