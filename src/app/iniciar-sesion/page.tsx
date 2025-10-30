"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await authClient.getSession();
      if (session?.data) {
        const callbackURL = searchParams.get("next") || "/mi-cuenta";
        router.replace(callbackURL);
      }
    };
    checkSession();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (error) {
        console.error("Error en login:", error);
        toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
        setIsLoading(false);
        return;
      }

      if (data) {
        toast.success("¡Bienvenido de nuevo!");
        await new Promise(resolve => setTimeout(resolve, 500));
        const callbackURL = searchParams.get("next") || "/mi-cuenta";
        window.location.href = callbackURL;
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      toast.error("Error al iniciar sesión. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const callbackURL = searchParams.get("next") || "/mi-cuenta";
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err) {
      console.error("Error con Google:", err);
      toast.error("Error al iniciar sesión con Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-pearl/20 to-ivory flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-champagne/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-champagne/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-8 group">
            <motion.h1 
              className="font-heading text-2xl font-semibold text-graphite group-hover:text-champagne transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              IWatchWorks
            </motion.h1>
          </Link>
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3">
            Bienvenido de nuevo
          </h2>
          <p className="text-graphite/60 text-base">
            Inicia sesión para acceder a tu cuenta
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-pearl/50 p-8 md:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-graphite">
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite/40 group-focus-within:text-champagne transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-pearl rounded-xl focus:outline-none focus:ring-2 focus:ring-champagne/20 focus:border-champagne transition-all bg-white/50"
                  placeholder="tu@email.com"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-graphite">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite/40 group-focus-within:text-champagne transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-pearl rounded-xl focus:outline-none focus:ring-2 focus:ring-champagne/20 focus:border-champagne transition-all bg-white/50"
                  placeholder="••••••••"
                  autoComplete="off"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-graphite/40 hover:text-champagne transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-champagne focus:ring-champagne/20 border-pearl rounded cursor-pointer"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ml-3 block text-sm text-graphite cursor-pointer">
                Mantener sesión iniciada
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-champagne to-yellow-600 hover:from-champagne/90 hover:to-yellow-600/90 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-champagne/20 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pearl" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-graphite/60 font-medium">
                O continúa con
              </span>
            </div>
          </div>

          {/* Google Button */}
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full bg-white hover:bg-gray-50 text-graphite font-semibold py-4 px-6 rounded-xl border-2 border-pearl hover:border-champagne/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar con Google</span>
          </motion.button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-graphite/60 text-sm">
              ¿No tienes cuenta?{" "}
              <Link 
                href="/registrarse" 
                className="text-champagne hover:text-champagne/80 font-semibold transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link 
            href="/" 
            className="text-graphite/60 hover:text-champagne text-sm font-medium transition-colors inline-flex items-center gap-2 group"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-ivory via-pearl/20 to-ivory flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-champagne mx-auto mb-4" />
          <p className="text-graphite/60 font-medium">Cargando...</p>
        </motion.div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";