"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Shield, PackageCheck } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function Hero() {
  const { data: session } = useSession();

  return (
    <section id="inicio" className="relative bg-ivory py-12 md:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium text-graphite leading-tight">
              Distribuidor independiente de relojes automáticos
            </h1>
            
            <p className="text-lg text-graphite/80 leading-relaxed">
              En IWatchWorks seleccionamos cada pieza por su historia, precisión y carácter. Porque un reloj no se elige, se reconoce.
            </p>

            {session?.user && (
              <p className="text-sm text-champagne font-medium">
                Bienvenido de nuevo, {session.user.name}. 
              </p>
            )}

            <motion.a
              href="#catalogo"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block px-8 py-4 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 reflection-hover"
              aria-label="Descargar catálogo"
            >
              Descargar catálogo
            </motion.a>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center space-x-2">
                <PackageCheck className="h-5 w-5 text-champagne" aria-hidden="true" />
                <span className="text-sm text-graphite">Envío asegurado</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-champagne" aria-hidden="true" />
                <span className="text-sm text-graphite">Autenticidad garantizada</span>
              </div>
            </div>

            <p className="text-xs text-graphite/60 pt-2">
              Última actualización del catálogo: octubre 2025
            </p>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative aspect-square lg:aspect-auto lg:h-[500px] rounded-lg overflow-hidden reflection-hover"
          >
            <Image
              src="https://res.cloudinary.com/djg9xipqe/image/upload/v1761477994/seiko-seiko-5-ssk003k1-13967034_aooruw.jpg"
              alt="Reloj automático Seiko GMT SSK003K1 - Distribuidor independiente de relojes japoneses"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 0.8,
                ease: "easeInOut",
              }}
              className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              aria-hidden="true"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}