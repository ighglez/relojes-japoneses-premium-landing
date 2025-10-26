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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    ciudad: "",
    texto: "",
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("¡Gracias! Tu reseña está pendiente de verificación.");
        setFormData({ nombre: "", ciudad: "", texto: "" });
        setShowReviewModal(false);
        fetchReviews();
      } else {
        toast.error("Error al enviar la reseña");
      }
    } catch (error) {
      toast.error("Error al enviar la reseña");
    } finally {
      setLoading(false);
    }
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];

  return (
    <>
      <section id="resenas" className="bg-pearl py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <p className="text-sm text-champagne font-medium">Las opiniones de nuestros clientes son parte esencial de nuestra historia.
Cada reseña refleja la dedicación con la que tratamos cada envío, cada conversación, cada reloj.</p>
          </motion.div>

          <div className="relative">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-ivory rounded-lg p-8 md:p-12 shadow-sm"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-champagne/20">
                  <Image
                    src={`https://ui-avatars.com/api/?name=${currentReview.name}&background=C6A664&color=F9F9F7&size=80`}
                    alt={currentReview.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex space-x-1" aria-label="5 estrellas">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-champagne text-champagne" aria-hidden="true" />
                  ))}
                </div>

                <p className="text-graphite/80 text-lg leading-relaxed max-w-3xl">
                  "{currentReview.text}"
                </p>

                <div>
                  <p className="font-medium text-graphite">{currentReview.name}</p>
                  <p className="text-sm text-graphite/60">{currentReview.city}</p>
                  {!currentReview.approved && (
                    <p className="text-xs text-champagne mt-2">Pendiente de verificación</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            {reviews.length > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={prevReview}
                  className="p-2 rounded-full bg-ivory hover:bg-champagne/10 transition-colors duration-300"
                  aria-label="Reseña anterior"
                >
                  <ChevronLeft className="h-6 w-6 text-graphite" />
                </button>
                <div className="flex space-x-2">
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex ? "bg-champagne w-8" : "bg-graphite/30"
                      }`}
                      aria-label={`Ir a reseña ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextReview}
                  className="p-2 rounded-full bg-ivory hover:bg-champagne/10 transition-colors duration-300"
                  aria-label="Siguiente reseña"
                >
                  <ChevronRight className="h-6 w-6 text-graphite" />
                </button>
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-3 bg-graphite text-ivory font-medium rounded-lg hover:bg-graphite/90 transition-all duration-300"
              aria-label="Dejar tu reseña"
            >
              Deja tu reseña
            </button>
          </motion.div>
        </div>
      </section>

      {/* Review Submission Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-ivory max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-graphite">
              Comparte tu experiencia
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nombre" className="text-graphite">
                Nombre *
              </Label>
              <Input
                id="nombre"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="bg-white mt-1"
                aria-required="true"
              />
            </div>
            <div>
              <Label htmlFor="ciudad" className="text-graphite">
                Ciudad *
              </Label>
              <Input
                id="ciudad"
                required
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="bg-white mt-1"
                aria-required="true"
              />
            </div>
            <div>
              <Label htmlFor="texto" className="text-graphite">
                Tu reseña *
              </Label>
              <Textarea
                id="texto"
                required
                rows={5}
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                className="bg-white mt-1"
                aria-required="true"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
              aria-label="Enviar reseña"
            >
              {loading ? "Enviando..." : "Enviar reseña"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
