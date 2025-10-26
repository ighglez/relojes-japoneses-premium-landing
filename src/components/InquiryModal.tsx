"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

interface InquiryModalProps {
  watch: { name: string; reference: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InquiryModal({ watch, isOpen, onClose }: InquiryModalProps) {
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
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          modelo: `${watch?.name} (${watch?.reference})`,
        }),
      });

      if (response.ok) {
        toast.success("Solicitud enviada ✓");
        setFormData({ nombre: "", email: "", mensaje: "" });
        onClose();
      } else {
        toast.error("Error al enviar la solicitud");
      }
    } catch (error) {
      toast.error("Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-ivory max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-graphite">
            Solicitar información
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="modelo" className="text-graphite">
              Modelo
            </Label>
            <Input
              id="modelo"
              value={watch ? `${watch.name} (${watch.reference})` : ""}
              disabled
              className="bg-pearl mt-1"
            />
          </div>
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
            <Label htmlFor="email" className="text-graphite">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-white mt-1"
              aria-required="true"
            />
          </div>
          <div>
            <Label htmlFor="mensaje" className="text-graphite">
              Mensaje
            </Label>
            <Textarea
              id="mensaje"
              rows={4}
              value={formData.mensaje}
              onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
              className="bg-white mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
            aria-label="Enviar solicitud"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
