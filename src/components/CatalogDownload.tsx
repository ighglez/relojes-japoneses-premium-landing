"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CATALOG_URL = "https://dl.dropboxusercontent.com/s/fi/xy4o2g7bye5i8wvdxne1f/CAT-LOGO-25-26.pdf?rlkey=y3cts9ffpefkag2b9w0ttms36&st=wqho6i9v&dl=0";

export default function CatalogDownload() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    // Get referral code from URL if exists
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    // Track download
    try {
      await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refCode }),
      });
    } catch (error) {
      console.error("Error tracking download:", error);
    }

    // Trigger download
    const link = document.createElement("a");
    link.href = CATALOG_URL;
    link.download = "IWatchWorks_Catalogo_2025.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Catálogo descargado ✓");
    
    // Show email capture modal
    setTimeout(() => {
      setShowEmailModal(true);
    }, 500);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "catalog_download" }),
      });

      if (response.ok) {
        toast.success("¡Gracias! Recibirás un código 5% de descuento en tu email.");
        setEmail("");
        setShowEmailModal(false);
      } else {
        toast.error("Error al guardar el email");
      }
    } catch (error) {
      toast.error("Error al guardar el email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section id="catalogo" className="bg-champagne/10 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite">
              Catálogo completo 2025
            </h2>
            <p className="text-graphite/70 text-lg max-w-2xl mx-auto">
              Explora nuestra selección exclusiva de relojes
            </p>
            <motion.button
              onClick={handleDownload}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 reflection-hover"
              aria-label="Descargar Catálogo 2025"
            >
              <Download className="h-5 w-5" aria-hidden="true" />
              <span>Descargar Catálogo 2025</span>
            </motion.button>
            <p className="text-xs text-graphite/60 pt-2">
              Descarga directa, sin registro requerido
            </p>
          </motion.div>
        </div>
      </section>

      {/* Email Capture Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="bg-ivory max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-graphite">
              5% en tu primera compra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-graphite/70">
              Déjanos tu email y recibe un 5 % de descuento en tu primer pedido.
Recibe las noticias de nuevas piezas y ventajas exclusivas para nuestros clientes.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email-download" className="text-graphite">
                  Email
                </Label>
                <Input
                  id="email-download"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="bg-white mt-1"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Recibir descuento"}
              </button>
            </form>
            <p className="text-xs text-graphite/60 text-center">
              Puedes darte de baja en cualquier momento.
            </p>
            <button
              onClick={() => setShowEmailModal(false)}
              className="w-full text-sm text-graphite/70 hover:text-graphite transition-colors"
            >
              No, gracias
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
