"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, ShoppingCart, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-pearl">
          {/* Cancel Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
            >
              <XCircle className="h-12 w-12 text-red-600" />
            </motion.div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-heading font-medium text-graphite text-center mb-4">
            Pago cancelado
          </h1>
          
          <p className="text-center text-graphite/60 mb-8">
            No te preocupes, tu pedido no se ha procesado y no se ha realizado ningún cargo.
          </p>

          {/* Info Message */}
          <div className="bg-pearl/50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <ShoppingCart className="h-5 w-5 text-champagne mt-0.5" />
              <div>
                <h2 className="font-medium text-graphite mb-1">
                  Tu carrito está intacto
                </h2>
                <p className="text-sm text-graphite/70">
                  Los artículos de tu carrito siguen ahí. Puedes continuar con tu compra cuando estés listo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-champagne mt-0.5" />
              <div>
                <h2 className="font-medium text-graphite mb-1">
                  ¿Necesitas ayuda?
                </h2>
                <p className="text-sm text-graphite/70">
                  Si tuviste algún problema durante el proceso de pago, nuestro equipo está aquí para ayudarte.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link
              href="/carrito"
              className="flex-1 px-6 py-3 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all text-center font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al carrito
            </Link>
            <Link
              href="/productos"
              className="flex-1 px-6 py-3 bg-pearl text-graphite rounded-lg hover:bg-pearl/80 transition-all text-center font-medium"
            >
              Seguir comprando
            </Link>
          </div>

          {/* Contact */}
          <div className="text-center">
            <Link
              href="/#contacto"
              className="text-sm text-champagne hover:underline inline-flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              Contactar con soporte
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-pearl">
            <p className="text-sm text-graphite/60 text-center">
              Aceptamos múltiples métodos de pago para tu comodidad. Si tienes dudas sobre el proceso de pago, consulta nuestras{" "}
              <Link href="/#faq" className="text-champagne hover:underline">
                preguntas frecuentes
              </Link>
              .
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}