"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

// Componente interno que usa useSearchParams
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirigir si ya hay sesión activa
  useEffect(() => {
    const checkSession = async () => {
      const session = await authClient.getSession();
      if (session?.data) {
        router.replace("/mi-cuenta");
      }
    };
    checkSession();
  }, [router]);

  const validateForm = () => {
    if (!name.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return false;
    }
    if (!email.trim()) {
      toast.error("Por favor ingresa tu correo electrónico");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return false;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
      });

      if (error) {
        console.error("Error en registro:", error);
        
        // Manejo específico de errores
        if (error.code === "USER_ALREADY_EXISTS") {
          toast.error("Este correo ya está registrado. Intenta iniciar sesión.");
        } else {
          toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
        }
        setIsLoading(false);
        return;
      }

      if (data) {
        toast.success("¡Cuenta creada correctamente!");
        
        // Guardar email en newsletter_subscribers
        try {
          await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              source: "registration",
            }),
          });
        } catch (newsletterErr) {
          // No bloqueamos el registro si falla el newsletter
          console.error("Newsletter subscription error:", newsletterErr);
        }
        
        // Esperar para asegurar que la sesión se guarde
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirigir usando window.location para forzar recarga completa
        window.location.href = "/mi-cuenta";
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/mi-cuenta",
      });
    } catch (err) {
      console.error("Error con Google:", err);
      toast.error("Error al registrarse con Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-medium text-graphite mb-2">
            Crear Cuenta
          </h1>
          <p className="text-muted-foreground">
            Regístrate para acceder a beneficios exclusivos
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-graphite mb-2">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-champagne"
                placeholder="Tu nombre"
                disabled={isLoading}
                required
              />
            </div>

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
                placeholder="Mínimo 8 caracteres"
                autoComplete="off"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-graphite mb-2">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-champagne"
                placeholder="Repite tu contraseña"
                autoComplete="off"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-champagne hover:bg-champagne/90 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">O regístrate con</span>
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
              ¿Ya tienes cuenta?{" "}
              <Link href="/iniciar-sesion" className="text-champagne hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal con Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

// Forzar dynamic rendering
export const dynamic = "force-dynamic";