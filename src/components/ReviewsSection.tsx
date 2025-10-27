"use client";

import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Review {
  id: number;
  name: string;
  city: string;
  text: string;
  createdAt?: string;
}

export default function ReviewsSection() {
  // Estado de datos
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estado de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / formulario
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    ciudad: "",
    texto: "",
  });

  async function fetchReviews() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reviews?ts=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Respuesta no OK");
      const data = await res.json();
      const arr: Review[] = Array.isArray(data?.reviews) ? data.reviews : [];
      setReviews(arr);
      // Reinicia el índice si el actual queda fuera de rango
      if (arr.length > 0 && currentIndex >= arr.length) {
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error("Error fetching reviews:", e);
      setError("No se pudieron cargar las reseñas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estados visibles siempre (evitan crasheos al acceder a reviews[0] vacío)
  if (loading) {
    return (
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-graphite/70">Cargando reseñas…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-red-600">Hubo un problema al cargar las reseñas.</p>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-graphite/70">Aún no hay reseñas publicadas.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-6 px-5 py-3 rounded-lg bg-champagne text-ivory font-medium hover:bg-champagne/90 hover:shadow transition-all"
          >
            Dejar una reseña
          </button>

          {/* Modal para enviar reseña */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-graphite">Dejar una reseña</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!formData.nombre.trim() || !formData.ciudad.trim() || !formData.texto.trim()) {
                    toast.error("Por favor, completa todos los campos");
                    return;
                  }
                  try {
                    setSending(true);
                    const response = await fetch("/api/reviews", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      cache: "no-store",
                      body: JSON.stringify(formData),
                    });
                    if (!response.ok) throw new Error("No OK");
                    toast.success("¡Gracias por tu reseña! Será revisada y publicada.");
                    setFormData({ nombre: "", ciudad: "", texto: "" });
                    setOpen(false);
                    await fetchReviews();
                  } catch {
                    toast.error("No se pudo enviar la reseña. Inténtalo de nuevo.");
                  } finally {
                    setSending(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="nombre" className="text-graphite">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre y/o iniciales"
                  />
                </div>
                <div>
                  <Label htmlFor="ciudad" className="text-graphite">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Madrid, Barcelona..."
                  />
                </div>
                <div>
                  <Label htmlFor="texto" className="text-graphite">Tu experiencia</Label>
                  <Textarea
                    id="texto"
                    rows={4}
                    value={formData.texto}
                    onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                    placeholder="Comparte brevemente tu experiencia de compra"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full px-4 py-3 bg-champagne text-ivory rounded-lg font-medium hover:bg-champagne/90 transition disabled:opacity-50"
                >
                  {sending ? "Enviando..." : "Enviar reseña"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    );
  }

  // En este punto ya hay al menos 1 reseña
  const currentReview = reviews[currentIndex];

  const prev = () => setCurrentIndex((i) => (i - 1 + reviews.length) % reviews.length);
  const next = () => setCurrentIndex((i) => (i + 1) % reviews.length);

  return (
    <>
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite">
                Lo que dicen nuestros clientes
              </h2>
              <p className="text-graphite/70 mt-2">
                Opiniones reales de compradores verificados.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Anterior"
                className="p-2 rounded-lg border border-pearl bg-white hover:bg-pearl/40 transition"
              >
                <ChevronLeft className="w-5 h-5 text-graphite" />
              </button>
              <button
                onClick={next}
                aria-label="Siguiente"
                className="p-2 rounded-lg border border-pearl bg-white hover:bg-pearl/40 transition"
              >
                <ChevronRight className="w-5 h-5 text-graphite" />
              </button>
            </div>
          </div>

          <motion.div
            key={currentReview?.id ?? currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-2xl shadow-sm border border-pearl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-champagne text-champagne" />
              ))}
            </div>
            <p className="text-lg md:text-xl text-graphite leading-relaxed">
              “{currentReview.text}”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Image
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                  currentReview.name || "User"
                )}`}
                alt={currentReview.name}
                width={40}
                height={40}
                className="rounded-full border border-pearl bg-pearl"
              />
              <div>
                <p className="text-graphite font-medium">{currentReview.name}</p>
                <p className="text-graphite/70 text-sm">{currentReview.city}</p>
              </div>
            </div>
          </motion.div>

          {/* Controles móviles */}
          <div className="mt-6 flex items-center justify-between sm:hidden">
            <button
              onClick={prev}
              aria-label="Anterior"
              className="p-2 rounded-lg border border-pearl bg-white hover:bg-pearl/40 transition"
            >
              <ChevronLeft className="w-5 h-5 text-graphite" />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="p-2 rounded-lg border border-pearl bg-white hover:bg-pearl/40 transition"
            >
              <ChevronRight className="w-5 h-5 text-graphite" />
            </button>
          </div>

          {/* Indicadores */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Ir a la reseña ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === currentIndex ? "w-6 bg-champagne" : "w-2.5 bg-pearl border border-pearl"
                }`}
              />
            ))}
          </div>

          {/* CTA para dejar reseña */}
          <div className="mt-10 text-center">
            <button
              onClick={() => setOpen(true)}
              className="px-5 py-3 rounded-lg bg-champagne text-ivory font-medium hover:bg-champagne/90 hover:shadow transition-all"
            >
              Dejar una reseña
            </button>
          </div>
        </div>
      </section>

      {/* Modal para enviar reseña */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-graphite">Dejar una reseña</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!formData.nombre.trim() || !formData.ciudad.trim() || !formData.texto.trim()) {
                toast.error("Por favor, completa todos los campos");
                return;
              }
              try {
                setSending(true);
                const response = await fetch("/api/reviews", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  cache: "no-store",
                  body: JSON.stringify(formData),
                });
                if (!response.ok) throw new Error("No OK");
                toast.success("¡Gracias por tu reseña! Será revisada y publicada.");
                setFormData({ nombre: "", ciudad: "", texto: "" });
                setOpen(false);
                await fetchReviews();
              } catch {
                toast.error("No se pudo enviar la reseña. Inténtalo de nuevo.");
              } finally {
                setSending(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="nombre" className="text-graphite">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre y/o iniciales"
                disabled={sending}
              />
            </div>
            <div>
              <Label htmlFor="ciudad" className="text-graphite">Ciudad</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Madrid, Barcelona..."
                disabled={sending}
              />
            </div>
            <div>
              <Label htmlFor="texto" className="text-graphite">Tu experiencia</Label>
              <Textarea
                id="texto"
                rows={4}
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                placeholder="Comparte brevemente tu experiencia de compra"
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full px-4 py-3 bg-champagne text-ivory rounded-lg font-medium hover:bg-champagne/90 transition disabled:opacity-50"
              aria-label="Enviar reseña"
            >
              {sending ? "Enviando..." : "Enviar reseña"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
