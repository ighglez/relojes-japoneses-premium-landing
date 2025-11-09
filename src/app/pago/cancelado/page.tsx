"use client";

import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function PagoCanceladoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Cancel Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>

          {/* Cancel Message */}
          <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-4">
            Pago cancelado
          </h1>
          <p className="text-lg text-graphite/70 mb-12">
            El pago fue cancelado. Puedes intentarlo de nuevo o volver a la tienda.
          </p>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-pearl p-8 mb-8 text-left max-w-2xl mx-auto"
          >
            <h2 className="font-heading text-xl font-medium text-graphite mb-4">
              ¿Qué ocurrió?
            </h2>
            <ul className="space-y-3 text-graphite/70">
              <li className="flex items-start gap-3">
                <span className="text-champagne mt-1">•</span>
                <span>Has cancelado el proceso de pago o cerraste la ventana de PayPal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-champagne mt-1">•</span>
                <span>No se ha realizado ningún cargo a tu cuenta</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-champagne mt-1">•</span>
                <span>Los productos siguen en tu carrito</span>
              </li>
            </ul>
          </motion.div>

          {/* Help Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-champagne/10 rounded-lg border border-champagne/30 p-6 mb-8 max-w-2xl mx-auto"
          >
            <h3 className="font-medium text-graphite mb-2">¿Necesitas ayuda?</h3>
            <p className="text-sm text-graphite/70">
              Si tuviste problemas con el pago o necesitas asistencia, contáctanos y te ayudaremos.
            </p>
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/carrito")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              Volver al carrito
            </button>
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-pearl text-graphite font-medium rounded-lg hover:bg-pearl transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver a la tienda
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}