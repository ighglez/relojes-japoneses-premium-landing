"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "34600000000"; // Replace with actual number

export default function ContactSection() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Mensaje enviado correctamente ✓");
        setFormData({ nombre: "", email: "", mensaje: "" });
      } else {
        toast.error("Error al enviar el mensaje");
      }
    } catch (error) {
      toast.error("Error al enviar el mensaje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="bg-ivory py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-4">
            Contáctanos
          </h2>
          <p className="text-graphite/70 max-w-2xl mx-auto">
            ¿Buscas un modelo específico? Escríbenos y te ayudaremos a encontrarlo.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="contact-nombre" className="text-graphite">
                  Nombre *
                </Label>
                <Input
                  id="contact-nombre"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="bg-white mt-1"
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-graphite">
                  Email *
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white mt-1"
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor="contact-mensaje" className="text-graphite">
                  Mensaje *
                </Label>
                <Textarea
                  id="contact-mensaje"
                  required
                  rows={6}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  className="bg-white mt-1"
                  aria-required="true"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                aria-label="Enviar mensaje"
              >
                {loading ? "Enviando..." : "Enviar mensaje"}
              </button>
            </form>
          </motion.div>

          {/* WhatsApp */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-center space-y-6"
          >
            <div className="bg-pearl rounded-lg p-8 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-champagne/10 rounded-full">
                <MessageSquare className="h-8 w-8 text-champagne" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-medium text-graphite mb-2">
                  ¿Prefieres WhatsApp?
                </h3>
                <p className="text-graphite/70 mb-6">
                  Respuesta rápida y personalizada para todas tus consultas.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20estoy%20interesado%20en%20un%20reloj`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-graphite text-ivory font-medium rounded-lg hover:bg-graphite/90 transition-all duration-300"
                  aria-label="Contactar por WhatsApp"
                >
                  Abrir WhatsApp
                </a>
              </div>
            </div>

            <div className="text-sm text-graphite/60">
              <p>Horario de atención:</p>
              <p className="mt-1">Lunes a Viernes: 10:00 - 19:00</p>
              <p>Sábados: 10:00 - 14:00</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
