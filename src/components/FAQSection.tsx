"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "¿Sois distribuidor independiente?",
    answer: "Sí. Trabajamos de forma directa con proveedores oficiales y particulares de confianza lo que nos permite ofrecer el mejor precio. Todas las piezas son nuevas y se entregan con factura y envío asegurado. Puedes consultar más información sobre este proceso en ",
    link: { text: "proceso de confianza", href: "#confianza" },
  },
  {
    question: "¿Los relojes son nuevos y auténticos?",
    answer: "Todos nuestros relojes tienen procedencia verificada, incluyen factura y comprobante de pago junto con verificación de número de serie cuando aplique. Más información en",
    link: { text: "confianza", href: "#confianza" },
  },
  {
    question: "¿Cómo funciona el envío asegurado?",
    answer: "Todos los envíos están asegurados y cuentan con número de seguimiento. Recibirás actualizaciones por email en cada etapa. Si tienes dudas, visita",
    link: { text: "contacto", href: "#contacto" },
  },
  {
    question: "¿Puedo descargar el catálogo sin dar mi email?",
    answer: "Sí, la descarga es directa y sin registro. Si quieres, puedes dejar tu correo después para acceder a ventajas exclusivas y obtener un 5 % de descuento. Ve a",
    link: { text: "descargar catálogo", href: "#catalogo" },
  },
  {
    question: "¿Cómo funciona el sistema de referidos y el catálogo premium?",
    answer: "Desde tu cuenta puedes compartir tu enlace único. Cada descarga válida suma a tu progreso y al llegar a 3 referencias desbloqueas el catálogo premium con precios especiales. Accede a",
    link: { text: "mi cuenta", href: "/mi-cuenta" },
  },
];

// Generate JSON-LD for FAQ
const generateFAQSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${faq.answer} ${faq.link.text}`
      }
    }))
  };
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema()) }}
      />
      
      <section className="bg-pearl py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-4">
              Preguntas frecuentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-ivory rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-pearl/50 transition-colors duration-300"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-medium text-graphite pr-8">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-champagne flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {openIndex === index && (
                  <motion.div
                    id={`faq-answer-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-graphite/70 leading-relaxed">
                      {faq.answer}{" "}
                      <a
                        href={faq.link.href}
                        className="text-champagne hover:underline font-medium"
                      >
                        {faq.link.text}
                      </a>
                      .
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
