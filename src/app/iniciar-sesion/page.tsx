"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

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
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      if (error?.code) {
        console.error("Error en login:", error);
        toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
        setIsLoading(false);
        return;
      }

      if (data) {
        toast.success("¡Bienvenido de nuevo!");
        setTimeout(() => {
          const callbackURL = searchParams.get("next") || "/mi-cuenta";
          router.push(callbackURL);
        }, 500);
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
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="font-heading text-2xl font-medium text-graphite hover:text-champagne transition-colors">
              IWatchWorks
            </h1>
          </Link>
          <h2 className="font-heading text-3xl font-medium text-graphite mb-2">
            Bienvenido de nuevo
          </h2>
          <p className="text-graphite/60">
            Inicia sesión para acceder a tu cuenta
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg border border-pearl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-graphite mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all bg-white text-graphite"
                placeholder="tu@email.com"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-graphite mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all bg-white text-graphite"
                placeholder="••••••••"
                autoComplete="off"
                disabled={isLoading}
                required
              />
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
              <label htmlFor="remember" className="ml-2 block text-sm text-graphite cursor-pointer">
                Mantener sesión iniciada
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-champagne text-ivory font-medium py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed reflection-hover"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pearl" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-graphite/60">O continúa con</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-graphite font-medium py-3 rounded-lg border border-pearl hover:border-champagne/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-graphite/60 text-sm">
            ¿No tienes cuenta?{" "}
            <Link 
              href="/registrarse" 
              className="text-champagne hover:underline font-medium"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-champagne" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";