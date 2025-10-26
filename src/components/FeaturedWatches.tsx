"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import InquiryModal from "./InquiryModal";

const watches = [
  {
    id: 1,
    name: "Seiko Presage Cocktail Time",
    reference: "SCC911P1",
    description: "Esfera azul profundo inspirada en el cóctel Blue Moon. Movimiento automático 4R35.",
    image: "https://res.cloudinary.com/djg9xipqe/image/upload/v1761217241/SSC911P1_th2gtl.jpg",
  },
  {
    id: 2,
    name: "Seiko Prospex Diver",
    reference: "SSK035K1",
    description: "Reinterpretación moderna del icónico 62MAS. Resistencia al agua 200m.",
    image: "https://res.cloudinary.com/djg9xipqe/image/upload/v1761506066/SSK035K1_ppe4kb.jpg",
  },
  {
    id: 3,
    name: "Seiko 5 Sports",
    reference: "SSK001K1",
    description: "Inspirado en el diseño vintage. Movimiento automático con reserva de marcha de 41h.",
    image: "https://res.cloudinary.com/djg9xipqe/image/upload/v1761506078/SSK001K1_ofw6mq.jpg",
  },
];

export default function FeaturedWatches() {
  const [selectedWatch, setSelectedWatch] = useState<typeof watches[0] | null>(null);

  return (
    <>
      <section className="bg-pearl py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-4">
              Selección destacada
            </h2>
            <p className="text-graphite/70 max-w-2xl mx-auto">
              Nuestras piezas seleccionadas para ti
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {watches.map((watch, index) => (
              <motion.div
                key={watch.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-ivory rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="relative aspect-square overflow-hidden reflection-hover">
                  <Image
                    src={watch.image}
                    alt={watch.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-heading text-xl font-medium text-graphite">
                    {watch.name}
                  </h3>
                  <p className="text-sm text-champagne font-medium">
                    Ref. {watch.reference}
                  </p>
                  <p className="text-sm text-graphite/70 leading-relaxed">
                    {watch.description}
                  </p>
                  <button
                    onClick={() => setSelectedWatch(watch)}
                    className="w-full mt-4 px-4 py-3 bg-graphite text-ivory text-sm font-medium rounded-lg hover:bg-graphite/90 transition-all duration-300"
                    aria-label={`Solicitar información sobre ${watch.name}`}
                  >
                    Solicitar información
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <InquiryModal
        watch={selectedWatch}
        isOpen={!!selectedWatch}
        onClose={() => setSelectedWatch(null)}
      />
    </>
  );
}
