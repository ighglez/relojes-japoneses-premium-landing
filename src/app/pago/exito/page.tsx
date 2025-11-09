"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CheckCircle2, Package, Mail, Download, ArrowRight } from "lucide-react";
import Link from "next/link";

function PagoExitoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/orders?orderNumber=${orderId}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-4">
          ¡Pago completado con éxito!
        </h1>
        <p className="text-lg text-graphite/70 mb-8">
          Tu pedido ha sido procesado correctamente. Recibirás una confirmación por correo electrónico.
        </p>

        {/* Order Details */}
        {loading ? (
          <div className="bg-white rounded-lg border border-pearl p-8 mb-8">
            <p className="text-graphite/60">Cargando detalles del pedido...</p>
          </div>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-pearl p-8 mb-8 text-left"
          >
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-pearl">
              <div>
                <p className="text-sm text-graphite/60 mb-1">Número de pedido</p>
                <p className="text-xl font-bold text-champagne">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-graphite/60 mb-1">Total pagado</p>
                <p className="text-2xl font-bold text-graphite">{order.total.toFixed(2)} €</p>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="mb-6">
                <h3 className="font-heading text-lg font-medium text-graphite mb-4">
                  Productos
                </h3>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium text-graphite">{item.productName}</p>
                        <p className="text-sm text-graphite/60">
                          {item.productReference} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-graphite">
                        {item.subtotal.toFixed(2)} €
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-2 mb-6 pb-6 border-b border-pearl">
              <div className="flex justify-between text-sm">
                <span className="text-graphite/70">Subtotal</span>
                <span className="font-medium text-graphite">
                  {order.subtotal.toFixed(2)} €
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">
                    Descuento {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span className="font-medium text-green-600">
                    -{order.discountAmount.toFixed(2)} €
                  </span>
                </div>
              )}
            </div>

            {/* Shipping Info */}
            <div>
              <h3 className="font-heading text-lg font-medium text-graphite mb-3">
                Información de envío
              </h3>
              <div className="bg-pearl/30 rounded-lg p-4 space-y-1 text-sm">
                <p className="font-medium text-graphite">{order.shippingName}</p>
                <p className="text-graphite/70">{order.shippingAddress}</p>
                <p className="text-graphite/70">
                  {order.shippingPostalCode} {order.shippingCity}
                </p>
                <p className="text-graphite/70">{order.shippingCountry}</p>
                <p className="text-graphite/70 mt-2">{order.shippingEmail}</p>
                <p className="text-graphite/70">{order.shippingPhone}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-lg border border-pearl p-8 mb-8">
            <p className="text-graphite/60">No se encontraron detalles del pedido</p>
          </div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-champagne/10 rounded-lg border border-champagne/30 p-8 mb-8"
        >
          <h2 className="font-heading text-2xl font-medium text-graphite mb-6">
            ¿Qué sigue?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-champagne rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-ivory" />
              </div>
              <div>
                <h3 className="font-medium text-graphite mb-1">1. Confirmación por email</h3>
                <p className="text-sm text-graphite/70">
                  Recibirás un email con todos los detalles
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-champagne rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-ivory" />
              </div>
              <div>
                <h3 className="font-medium text-graphite mb-1">2. Preparación del envío</h3>
                <p className="text-sm text-graphite/70">
                  Procesaremos tu pedido en 24-48h
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-champagne rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6 text-ivory" />
              </div>
              <div>
                <h3 className="font-medium text-graphite mb-1">3. Seguimiento</h3>
                <p className="text-sm text-graphite/70">
                  Te enviaremos el número de seguimiento
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Footer */}
        <div className="bg-white rounded-lg border border-pearl p-6 mb-8">
          <p className="text-sm text-graphite/70">
            <strong className="text-champagne">Envío asegurado</strong> • <strong className="text-champagne">Autenticidad garantizada</strong> • <strong className="text-champagne">Factura emitida</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/productos"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all"
          >
            Volver a la tienda
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/mi-cuenta"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-pearl text-graphite font-medium rounded-lg hover:bg-pearl transition-all"
          >
            Ver mis pedidos
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function PagoExitoPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />
      <Suspense fallback={
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-4">
              Cargando...
            </h1>
          </div>
        </main>
      }>
        <PagoExitoContent />
      </Suspense>
      <Footer />
    </div>
  );
}