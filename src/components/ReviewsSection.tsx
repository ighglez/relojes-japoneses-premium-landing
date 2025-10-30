"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, Plus, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
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
      
      const timestamp = Date.now();
      const res = await fetch(`/api/reviews?t=${timestamp}`, { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        if (data.reviews.length > 0 && currentIndex >= data.reviews.length) {
          setCurrentIndex(0);
        }
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.error("[ReviewsSection] Error:", e);
      setError("No se pudieron cargar las reseñas");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 30000);
    return () => clearInterval(interval);
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
      
      toast.success("¡Gracias por tu reseña! Ha sido publicada exitosamente.");
      setFormData({ nombre: "", ciudad: "", texto: "" });
      setOpen(false);
      
      setTimeout(() => fetchReviews(), 500);
    } catch {
      toast.error("No se pudo enviar la reseña. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const prev = () => setCurrentIndex((i) => (i === 0 ? reviews.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === reviews.length - 1 ? 0 : i + 1));

  // Loading State
  if (loading) {
    return (
      <section id="resenas" className="bg-pearl/30 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-4">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-champagne mx-auto mb-4" />
              <p className="text-graphite/60 font-medium">Cargando reseñas...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error or Empty State
  if (error || reviews.length === 0) {
    return (
      <section id="resenas" className="bg-pearl/30 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-4">
              Lo que dicen nuestros clientes
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-pearl p-12 text-center"
          >
            <div className="w-20 h-20 bg-champagne/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-champagne/30">
              {error ? (
                <AlertCircle className="h-10 w-10 text-champagne" />
              ) : (
                <MessageSquare className="h-10 w-10 text-champagne" />
              )}
            </div>
            <h3 className="font-heading text-2xl font-medium text-graphite mb-3">
              {error ? "Error al cargar reseñas" : "Sé el primero en compartir tu experiencia"}
            </h3>
            <p className="text-graphite/60 mb-8 leading-relaxed">
              {error 
                ? "No pudimos cargar las reseñas en este momento. Por favor, intenta más tarde." 
                : "Comparte tu experiencia con nuestros relojes y ayuda a otros entusiastas a descubrir la calidad que ofrecemos."}
            </p>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all reflection-hover"
            >
              <Plus className="h-5 w-5" />
              Dejar una reseña
            </button>
          </motion.div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg bg-white border-pearl">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-graphite flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-champagne" />
                  Compartir tu experiencia
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div>
                  <Label htmlFor="nombre" className="text-graphite font-medium mb-2 block">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Juan Pérez"
                    disabled={sending}
                    className="border border-pearl focus:border-champagne rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="ciudad" className="text-graphite font-medium mb-2 block">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Madrid, España"
                    disabled={sending}
                    className="border border-pearl focus:border-champagne rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="texto" className="text-graphite font-medium mb-2 block">Tu experiencia</Label>
                  <Textarea
                    id="texto"
                    rows={5}
                    value={formData.texto}
                    onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                    placeholder="Comparte tu experiencia con nosotros..."
                    disabled={sending}
                    className="border border-pearl focus:border-champagne rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full px-6 py-4 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 reflection-hover"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5" />
                      Enviar reseña
                    </>
                  )}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <>
      <section id="resenas" className="bg-pearl/30 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <div className="flex items-center justify-center gap-2 text-graphite/60">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-champagne text-champagne" />
                ))}
              </div>
              <span className="text-sm font-medium">•</span>
              <span className="text-sm font-medium">Reseñas verificadas</span>
              <span className="text-sm font-medium">•</span>
              <span className="text-sm font-medium text-champagne">{reviews.length} opiniones</span>
            </div>
          </motion.div>

          {/* Review Card */}
          <div className="max-w-4xl mx-auto mb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentReview.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-lg shadow-lg border border-pearl p-8 md:p-12 relative overflow-hidden"
              >
                {/* Quote decoration */}
                <div className="absolute top-8 left-8 opacity-5">
                  <Quote className="h-24 w-24 text-champagne" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-2 mb-6 relative z-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-champagne text-champagne" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-champagne bg-champagne/10 px-3 py-1 rounded-lg">
                    Verificada
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xl md:text-2xl text-graphite leading-relaxed mb-8 relative z-10 font-normal">
                  "{currentReview.text}"
                </p>

                {/* Author Info - SIN IMAGEN */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-champagne/20 rounded-full flex items-center justify-center border-2 border-champagne/40">
                    <span className="text-champagne font-bold text-lg">
                      {currentReview.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-graphite font-medium text-lg">{currentReview.name}</p>
                    <p className="text-graphite/60 font-normal">{currentReview.city}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={prev}
              className="p-3 rounded-full bg-white border border-pearl hover:border-champagne hover:bg-champagne/5 transition-all shadow-md"
              aria-label="Reseña anterior"
            >
              <ChevronLeft className="w-6 h-6 text-graphite" />
            </button>

            {/* Indicators */}
            <div className="flex items-center gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all ${
                    i === currentIndex 
                      ? "w-10 h-3 bg-champagne" 
                      : "w-3 h-3 bg-pearl hover:bg-champagne/50"
                  }`}
                  aria-label={`Ver reseña ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-3 rounded-full bg-white border border-pearl hover:border-champagne hover:bg-champagne/5 transition-all shadow-md"
              aria-label="Siguiente reseña"
            >
              <ChevronRight className="w-6 h-6 text-graphite" />
            </button>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-3 px-10 py-5 bg-champagne text-ivory font-medium text-lg rounded-lg hover:bg-opacity-90 transition-all shadow-lg reflection-hover"
            >
              <Plus className="h-6 w-6" />
              Dejar una reseña
            </button>
          </div>
        </div>
      </section>

      {/* Review Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-pearl rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-graphite flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-champagne" />
              Compartir tu experiencia
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div>
              <Label htmlFor="nombre-modal" className="text-graphite font-medium mb-2 block">Nombre completo</Label>
              <Input
                id="nombre-modal"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
                disabled={sending}
                className="border border-pearl focus:border-champagne rounded-lg py-3"
              />
            </div>
            <div>
              <Label htmlFor="ciudad-modal" className="text-graphite font-medium mb-2 block">Ciudad</Label>
              <Input
                id="ciudad-modal"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Madrid, España"
                disabled={sending}
                className="border border-pearl focus:border-champagne rounded-lg py-3"
              />
            </div>
            <div>
              <Label htmlFor="texto-modal" className="text-graphite font-medium mb-2 block">Tu experiencia</Label>
              <Textarea
                id="texto-modal"
                rows={5}
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                placeholder="Comparte tu experiencia con nosotros..."
                disabled={sending}
                className="border border-pearl focus:border-champagne rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full px-6 py-4 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 reflection-hover"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5" />
                  Enviar reseña
                </>
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}