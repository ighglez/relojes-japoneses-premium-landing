'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Package, Mail } from 'lucide-react';
import Link from 'next/link';

// --- Componente interno que usa useSearchParams, envuelto por <Suspense> ---
function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orden') ?? searchParams.get('orderId') ?? '';
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      const token = localStorage.getItem('bearer_token');
      fetch(`/api/orders/my-orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          const order = data.orders?.find((o: any) => o.orderNumber === orderId);
          if (order) setOrderDetails(order);
        })
        .catch(() => {});
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-pearl">
          {/* Icono de éxito */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </motion.div>
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-heading font-medium text-graphite text-center mb-4">
            ¡Pago completado con éxito!
          </h1>

          {orderId && (
            <p className="text-center text-graphite/60 mb-8">
              Nº de pedido:{' '}
              <span className="font-mono font-medium text-champagne">{orderId}</span>
            </p>
          )}

          {/* Mensajes */}
          <div className="bg-pearl/50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="h-5 w-5 text-champagne mt-0.5" />
              <div>
                <h2 className="font-medium text-graphite mb-1">Confirmación enviada</h2>
                <p className="text-sm text-graphite/70">
                  Recibirás un email con los detalles de tu pedido en los próximos minutos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-champagne mt-0.5" />
              <div>
                <h2 className="font-medium text-graphite mb-1">Envío asegurado • 24-48h</h2>
                <p className="text-sm text-graphite/70">
                  Tu pedido será preparado y enviado con número de seguimiento.
                </p>
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          {orderDetails && (
            <div className="border border-pearl rounded-lg p-6 mb-8">
              <h3 className="font-medium text-graphite mb-4">Resumen del pedido</h3>
              <div className="space-y-2">
                {orderDetails.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-graphite/70">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-medium text-graphite">
                      {(item.unitPrice * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
                <div className="border-t border-pearl pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-graphite">Total pagado</span>
                    <span className="text-champagne text-lg">
                      {orderDetails.total.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/mi-cuenta"
              className="flex-1 px-6 py-3 bg-pearl text-graphite rounded-lg hover:bg-pearl/80 transition-all text-center font-medium"
            >
              Ver mis pedidos
            </Link>
            <Link
              href="/productos"
              className="flex-1 px-6 py-3 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all text-center font-medium flex items-center justify-center gap-2"
            >
              Volver a la tienda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Info extra */}
          <div className="mt-8 pt-6 border-t border-pearl">
            <p className="text-sm text-graphite/60 text-center">
              Si tienes alguna pregunta sobre tu pedido, no dudes en{' '}
              <Link href="/#contacto" className="text-champagne hover:underline">
                contactarnos
              </Link>
              .
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Página: solo envuelve en Suspense (esto quita el error de build) ---
export default function PagoExitoPage() {
  return <Suspense fallback={null}><PaymentSuccessInner /></Suspense>;
}
