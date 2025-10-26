"use client";

import { motion } from "framer-motion";
import { Shield, PackageCheck, FileText, Headphones } from "lucide-react";

const trustFeatures = [
  {
    icon: PackageCheck,
    title: "Envío asegurado y con número de seguimiento.",
    description: "Todos los relojes se envian asegurados y con tracking en tiempo real.",
  },
  {
    icon: Shield,
    title: "Autenticidad garantizada.",
    description: "Verificamos cada pieza con documentación oficial y certificados de origen.",
  },
  {
    icon: FileText,
    title: "Factura emitida.",
    description: "Factura completa con todos los detalles de tu compra.",
  },
  {
    icon: Headphones,
    title: "Soporte cercano.",
    description: "Asesoramiento personalizado antes, durante y después de tu compra.",
  },
];

export default function TrustSection() {
  return (
    <section id="confianza" className="bg-ivory py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-4">
            Tu confianza es nuestra prioridad
          </h2>
          <p className="text-graphite/70 max-w-2xl mx-auto">
            En IWatchWorks cada detalle cuenta. Desde la selección de cada pieza hasta el envío. Garantizamos una experiencia clara, segura y profesional con asesoramiento durante el proceso.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-champagne/10 rounded-full">
                <feature.icon className="h-8 w-8 text-champagne" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-lg font-medium text-graphite">
                {feature.title}
              </h3>
              <p className="text-sm text-graphite/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-champagne font-medium">
            Distribuidor independiente
          </p>
        </motion.div>
      </div>
    </section>
  );
}
