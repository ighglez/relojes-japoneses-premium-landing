"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });

      if (response.ok) {
        toast.success("¡Gracias por suscribirte!");
        setEmail("");
      } else {
        toast.error("Error al suscribirse");
      }
    } catch (error) {
      toast.error("Error al suscribirse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-graphite text-ivory py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-heading text-2xl font-medium">IWatchWorks</h3>
            <p className="text-ivory/70 text-sm leading-relaxed max-w-md">
              Distribuidor especializado en relojes automáticos. 
              Autenticidad garantizada, envío asegurado.
            </p>
            <p className="text-xs text-ivory/50 pt-4">
              Distribuidor independiente. Las marcas mostradas son propiedad de sus respectivos titulares.
            </p>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Recibe lanzamientos exclusivos y ediciones limitadas antes que nadie</h4>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-ivory/10 border-ivory/20 text-ivory placeholder:text-ivory/50"
                aria-label="Email para newsletter"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                aria-label="Suscribirse al newsletter"
              >
                {loading ? "..." : "Suscribirse"}
              </button>
            </form>
            <p className="text-xs text-ivory/50">
              Puedes darte de baja en cualquier momento.
            </p>
          </div>
        </div>

        <div className="border-t border-ivory/10 pt-8 text-center">
          <p className="text-sm text-ivory/60">
            © {new Date().getFullYear()} IWatchWorks. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
