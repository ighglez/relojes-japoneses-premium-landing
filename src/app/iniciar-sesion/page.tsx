"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

// Componente interno que usa useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Redirigir si ya hay sesión activa
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
        toast.success("¡Sesión iniciada correctamente!");
        
        // Esperar para asegurar que la sesión se guarde
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirigir usando window.location para forzar recarga completa
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
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-medium text-graphite mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-muted-foreground">
            Accede a tu cuenta para continuar
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-graphite mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-champagne"
                placeholder="tu@email.com"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-graphite mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-champagne"
                placeholder="••••••••"
                autoComplete="off"
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-champagne focus:ring-champagne border-input rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-graphite">
                Mantener sesión iniciada
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-champagne hover:bg-champagne/90 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="mt-4 w-full bg-white hover:bg-gray-50 text-graphite font-medium py-3 px-4 rounded-md border border-input transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link href="/registrarse" className="text-champagne hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal con Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

// Forzar dynamic rendering
export const dynamic = "force-dynamic";