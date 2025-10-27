'use client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.success("¡Cuenta creada! Ahora puedes iniciar sesión.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/mi-cuenta",
      });
      if (error?.code) {
        toast.error("Error al iniciar sesión con Google. Por favor, intenta de nuevo.");
        setGoogleLoading(false);
      }
    } catch {
      toast.error("Error al conectar con Google. Verifica tu conexión.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Por favor, ingresa tu email");
      return;
    }
    if (!formData.password) {
      toast.error("Por favor, ingresa tu contraseña");
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      if (error?.code) {
        toast.error("Email o contraseña incorrectos. Verifica tus datos e intenta de nuevo.");
        setLoading(false);
        return;
      }
      toast.success("¡Bienvenido de nuevo!");
      router.push("/mi-cuenta");
    } catch {
      toast.error("Error al iniciar sesión. Por favor, intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <nav className="border-b border-pearl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="font-heading text-xl font-semibold text-graphite hover:text-champagne transition-colors">
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
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-medium text-graphite mb-2">
                Iniciar sesión
              </h1>
              <p className="text-graphite/70">
                Accede a tu cuenta y gestiona tus referidos
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full px-6 py-3 bg-white text-graphite font-medium rounded-lg border-2 border-pearl hover:bg-pearl/30 hover:border-champagne transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
              aria-label="Iniciar sesión con Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pearl"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-graphite/60">o continúa con email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-graphite font-medium">Email *</Label>
                <Input
                  id="email" type="email" required placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 h-11" aria-required="true"
                  disabled={loading || googleLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-graphite font-medium">Contraseña *</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password" type={showPassword ? "text" : "password"} required
                    autoComplete="current-password" placeholder="Tu contraseña"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10 h-11" aria-required="true"
                    disabled={loading || googleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/50 hover:text-graphite transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember" type="checkbox" checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-graphite cursor-pointer">
                  Recuérdame
                </label>
              </div>

              <button
                type="submit" disabled={loading || googleLoading}
                className="w-full px-6 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-champagne/90 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-11"
                aria-label="Iniciar sesión"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ivory" />
                    Iniciando sesión...
                  </span>
                ) : "Iniciar sesión"}
              </button>
            </form>

            <div className="mt-6 bg-champagne/5 border border-champagne/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-champagne flex-shrink-0 mt-0.5" />
                <div className="text-sm text-graphite/70">
                  <p className="font-medium text-graphite mb-1">¿No tienes cuenta aún?</p>
                  <p>Crea una cuenta para acceder al sistema de referidos y desbloquear el catálogo premium.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-pearl">
              <p className="text-center text-sm text-graphite/70">
                ¿No tienes cuenta?{" "}
                <Link href="/registrarse" className="text-champagne hover:underline font-medium transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <SignInContent />
    </Suspense>
  );
}
