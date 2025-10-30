"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, Plus, MessageSquare, Loader2, AlertCircle } from "lucide-react";
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
      <section id="resenas" className="bg-gradient-to-b from-pearl/30 to-ivory py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-champagne to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-heading text-4xl md:text-5xl font-semibold text-graphite">
                  Lo que dicen nuestros clientes
                </h2>
              </div>
            </motion.div>
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
      <section id="resenas" className="bg-gradient-to-b from-pearl/30 to-ivory py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-champagne to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-heading text-4xl md:text-5xl font-semibold text-graphite">
                  Lo que dicen nuestros clientes
                </h2>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-pearl/50 p-12 text-center"
          >
            <div className="w-20 h-20 bg-champagne/10 rounded-full flex items-center justify-center mx-auto mb-6">
              {error ? (
                <AlertCircle className="h-10 w-10 text-champagne" />
              ) : (
                <MessageSquare className="h-10 w-10 text-champagne" />
              )}
            </div>
            <h3 className="font-heading text-2xl font-semibold text-graphite mb-3">
              {error ? "Error al cargar reseñas" : "Sé el primero en compartir tu experiencia"}
            </h3>
            <p className="text-graphite/60 mb-8 leading-relaxed">
              {error 
                ? "No pudimos cargar las reseñas en este momento. Por favor, intenta más tarde." 
                : "Comparte tu experiencia con nuestros relojes y ayuda a otros entusiastas a descubrir la calidad que ofrecemos."}
            </p>
            <motion.button
              onClick={() => setOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-champagne to-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-champagne/30 hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Dejar una reseña
            </motion.button>
          </motion.div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border-pearl">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-graphite flex items-center gap-3">
                  <div className="w-10 h-10 bg-champagne/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-champagne" />
                  </div>
                  Compartir tu experiencia
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div>
                  <Label htmlFor="nombre" className="text-graphite font-semibold mb-2 block">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Juan Pérez"
                    disabled={sending}
                    className="border-2 border-pearl focus:border-champagne rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="ciudad" className="text-graphite font-semibold mb-2 block">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Madrid, España"
                    disabled={sending}
                    className="border-2 border-pearl focus:border-champagne rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="texto" className="text-graphite font-semibold mb-2 block">Tu experiencia</Label>
                  <Textarea
                    id="texto"
                    rows={5}
                    value={formData.texto}
                    onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                    placeholder="Comparte tu experiencia con nosotros..."
                    disabled={sending}
                    className="border-2 border-pearl focus:border-champagne rounded-xl"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={{ scale: sending ? 1 : 1.02 }}
                  whileTap={{ scale: sending ? 1 : 0.98 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-champagne to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                </motion.button>
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
      <section id="resenas" className="bg-gradient-to-b from-pearl/30 to-ivory py-20 md:py-28 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-64 h-64 bg-champagne/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-20 w-64 h-64 bg-champagne/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-champagne to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-semibold text-graphite">
                Lo que dicen nuestros clientes
              </h2>
            </div>
            <div className="flex items-center justify-center gap-2 text-graphite/60">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-champagne text-champagne" />
                ))}
              </div>
              <span className="text-sm font-medium">•</span>
              <span className="text-sm font-medium">Reseñas verificadas</span>
              <span className="text-sm font-medium">•</span>
              <span className="text-sm font-semibold text-champagne">{reviews.length} opiniones</span>
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
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-pearl/50 p-8 md:p-12 relative overflow-hidden"
              >
                {/* Quote decoration */}
                <div className="absolute top-8 left-8 opacity-10">
                  <Quote className="h-24 w-24 text-champagne" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-2 mb-6 relative z-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="w-6 h-6 fill-champagne text-champagne" />
                    </motion.div>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-champagne bg-champagne/10 px-3 py-1 rounded-full">
                    Verificada
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xl md:text-2xl text-graphite leading-relaxed mb-8 relative z-10 font-medium">
                  "{currentReview.text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <Image
                      src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentReview.name)}&backgroundColor=C6A664`}
                      alt={currentReview.name}
                      width={64}
                      height={64}
                      className="rounded-full border-4 border-champagne/20 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-graphite font-bold text-lg">{currentReview.name}</p>
                    <p className="text-graphite/60 font-medium">{currentReview.city}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.button
              onClick={prev}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white border-2 border-pearl hover:border-champagne hover:bg-champagne/5 transition-all shadow-lg"
              aria-label="Reseña anterior"
            >
              <ChevronLeft className="w-6 h-6 text-graphite" />
            </motion.button>

            {/* Indicators */}
            <div className="flex items-center gap-2">
              {reviews.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  whileHover={{ scale: 1.2 }}
                  className={`rounded-full transition-all ${
                    i === currentIndex 
                      ? "w-10 h-3 bg-gradient-to-r from-champagne to-yellow-600" 
                      : "w-3 h-3 bg-pearl hover:bg-champagne/50"
                  }`}
                  aria-label={`Ver reseña ${i + 1}`}
                />
              ))}
            </div>

            <motion.button
              onClick={next}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white border-2 border-pearl hover:border-champagne hover:bg-champagne/5 transition-all shadow-lg"
              aria-label="Siguiente reseña"
            >
              <ChevronRight className="w-6 h-6 text-graphite" />
            </motion.button>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <motion.button
              onClick={() => setOpen(true)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-champagne to-yellow-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-champagne/30 hover:shadow-2xl transition-all"
            >
              <Plus className="h-6 w-6" />
              Dejar una reseña
            </motion.button>
          </div>
        </div>
      </section>

      {/* Review Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border-pearl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-graphite flex items-center gap-3">
              <div className="w-10 h-10 bg-champagne/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-champagne" />
              </div>
              Compartir tu experiencia
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div>
              <Label htmlFor="nombre-modal" className="text-graphite font-semibold mb-2 block">Nombre completo</Label>
              <Input
                id="nombre-modal"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
                disabled={sending}
                className="border-2 border-pearl focus:border-champagne rounded-xl py-3"
              />
            </div>
            <div>
              <Label htmlFor="ciudad-modal" className="text-graphite font-semibold mb-2 block">Ciudad</Label>
              <Input
                id="ciudad-modal"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Madrid, España"
                disabled={sending}
                className="border-2 border-pearl focus:border-champagne rounded-xl py-3"
              />
            </div>
            <div>
              <Label htmlFor="texto-modal" className="text-graphite font-semibold mb-2 block">Tu experiencia</Label>
              <Textarea
                id="texto-modal"
                rows={5}
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                placeholder="Comparte tu experiencia con nosotros..."
                disabled={sending}
                className="border-2 border-pearl focus:border-champagne rounded-xl"
              />
            </div>
            <motion.button
              type="submit"
              disabled={sending}
              whileHover={{ scale: sending ? 1 : 1.02 }}
              whileTap={{ scale: sending ? 1 : 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-champagne to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </motion.button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}