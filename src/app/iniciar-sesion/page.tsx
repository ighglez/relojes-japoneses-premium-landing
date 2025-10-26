"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/mi-cuenta",
      });

      if (error?.code) {
        toast.error("Error al iniciar sesión con Google");
        setGoogleLoading(false);
      }
    } catch (error) {
      toast.error("Error al iniciar sesión con Google");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        callbackURL: "/mi-cuenta",
      });

      if (error?.code) {
        toast.error("Email o contraseña incorrectos. Por favor, asegúrate de haber registrado una cuenta e intenta de nuevo.");
        return;
      }

      toast.success("¡Bienvenido de nuevo!");
      router.push("/mi-cuenta");
    } catch (error) {
      toast.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <nav className="border-b border-pearl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="font-heading text-xl font-semibold text-graphite">
            IWatches
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="font-heading text-3xl font-medium text-graphite mb-2">
              Iniciar sesión
            </h1>
            <p className="text-graphite/70 mb-8">
              Accede a tu cuenta y gestiona tus referidos
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full px-6 py-3 bg-white text-graphite font-medium rounded-lg border-2 border-pearl hover:bg-pearl/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 mb-6"
              aria-label="Iniciar sesión con Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pearl"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-graphite/60">o continúa con email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="mt-1"
                  aria-required="true"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-graphite">
                  Contraseña *
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="off"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1"
                  aria-required="true"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-graphite">
                  Recuérdame
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full px-6 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                aria-label="Iniciar sesión"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-graphite/70">
              ¿No tienes cuenta?{" "}
              <Link href="/registrarse" className="text-champagne hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}