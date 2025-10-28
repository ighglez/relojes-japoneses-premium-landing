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
  approved: boolean;
  createdAt: string;
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const res = await fetch("/api/reviews", { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Reviews data received:", data);
      
      if (data && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        if (data.reviews.length > 0 && currentIndex >= data.reviews.length) {
          setCurrentIndex(0);
        }
      } else {
        console.error("Formato de datos incorrecto:", data);
        setReviews([]);
      }
    } catch (e) {
      console.error("Error fetching reviews:", e);
      setError("No se pudieron cargar las reseñas");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error("Error al enviar");
      
      toast.success("¡Gracias por tu reseña! Ha sido publicada.");
      setFormData({ nombre: "", ciudad: "", texto: "" });
      setOpen(false);
      await fetchReviews();
    } catch {
      toast.error("No se pudo enviar la reseña. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-champagne border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || reviews.length === 0) {
    return (
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-graphite/70 mb-6">
            {error ? "Hubo un problema al cargar las reseñas." : "Aún no hay reseñas publicadas."}
          </p>
          <button
            onClick={() => setOpen(true)}
            className="px-5 py-3 rounded-lg bg-champagne text-ivory font-medium hover:bg-champagne/90 hover:shadow transition-all"
          >
            Dejar una reseña
          </button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-graphite">Dejar una reseña</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre" className="text-graphite">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Tu nombre"
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
                    placeholder="Comparte tu experiencia de compra"
                    disabled={sending}
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

  const currentReview = reviews[currentIndex];
  const prev = () => setCurrentIndex((i) => (i === 0 ? reviews.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === reviews.length - 1 ? 0 : i + 1));

  return (
    <>
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite">
                Lo que dicen nuestros clientes
              </h2>
              <p className="text-graphite/70 mt-2">
                Reseñas verificadas de compradores reales
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Reseña anterior"
                className="p-2 rounded-lg border border-pearl bg-white hover:bg-champagne hover:text-white hover:border-champagne transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                aria-label="Siguiente reseña"
                className="p-2 rounded-lg border border-pearl bg-white hover:bg-champagne hover:text-white hover:border-champagne transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <motion.div
            key={currentReview.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-md border border-pearl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-champagne text-champagne" />
              ))}
              <span className="ml-2 text-sm text-graphite/60">Reseña verificada</span>
            </div>
            
            <p className="text-lg md:text-xl text-graphite leading-relaxed mb-6">
              "{currentReview.text}"
            </p>
            
            <div className="flex items-center gap-3">
              <Image
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentReview.name)}&backgroundColor=C6A664`}
                alt={currentReview.name}
                width={48}
                height={48}
                className="rounded-full border-2 border-pearl"
              />
              <div>
                <p className="text-graphite font-semibold">{currentReview.name}</p>
                <p className="text-graphite/70 text-sm">{currentReview.city}</p>
              </div>
            </div>
          </motion.div>

          {/* Controles móviles */}
          <div className="mt-6 flex items-center justify-between sm:hidden">
            <button
              onClick={prev}
              aria-label="Reseña anterior"
              className="p-2 rounded-lg border border-pearl bg-white hover:bg-champagne hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente reseña"
              className="p-2 rounded-lg border border-pearl bg-white hover:bg-champagne hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Indicadores de página */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Ver reseña ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex 
                    ? "w-8 bg-champagne" 
                    : "w-2 bg-pearl hover:bg-champagne/50"
                }`}
              />
            ))}
          </div>

          {/* CTA para dejar reseña */}
          <div className="mt-10 text-center">
            <button
              onClick={() => setOpen(true)}
              className="px-6 py-3 rounded-lg bg-champagne text-ivory font-medium hover:bg-champagne/90 hover:shadow-lg transition-all"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre-modal" className="text-graphite">Nombre</Label>
              <Input
                id="nombre-modal"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre"
                disabled={sending}
              />
            </div>
            <div>
              <Label htmlFor="ciudad-modal" className="text-graphite">Ciudad</Label>
              <Input
                id="ciudad-modal"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Madrid, Barcelona..."
                disabled={sending}
              />
            </div>
            <div>
              <Label htmlFor="texto-modal" className="text-graphite">Tu experiencia</Label>
              <Textarea
                id="texto-modal"
                rows={4}
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                placeholder="Comparte tu experiencia de compra"
                disabled={sending}
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
    </>
  );
}