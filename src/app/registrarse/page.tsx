"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      });

      if (error?.code) {
        console.error("Error en registro:", error);
        
        if (error.code === "USER_ALREADY_EXISTS") {
          toast.error("Este correo ya está registrado. Intenta iniciar sesión.");
        } else {
          toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
        }
        setIsLoading(false);
        return;
      }

      if (data) {
        toast.success("¡Cuenta creada exitosamente!");
        
        // Subscribe to newsletter
        try {
          await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              source: "registration",
            }),
          });
        } catch (newsletterErr) {
          console.error("Newsletter subscription error:", newsletterErr);
        }
        
        // Redirect after short delay
        setTimeout(() => {
          router.push("/mi-cuenta");
        }, 500);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-8">
            <h1 className="font-heading text-2xl font-semibold text-graphite hover:text-champagne transition-colors">
              IWatchWorks
            </h1>
          </Link>
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3">
            Crea tu cuenta
          </h2>
          <p className="text-graphite/70 text-base">
            Únete y desbloquea beneficios exclusivos
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg border border-pearl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-graphite">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite/40" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all bg-white"
                  placeholder="Juan Pérez"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-graphite">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all bg-white"
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
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all bg-white"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="off"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/40 hover:text-champagne transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="flex gap-1 mt-2">
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : password.length >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : password.length >= 5 ? 'bg-yellow-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-graphite">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite/40" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all bg-white"
                  placeholder="Repite tu contraseña"
                  autoComplete="off"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/40 hover:text-champagne transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-green-600 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Las contraseñas coinciden</span>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-champagne text-ivory font-medium py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed reflection-hover flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Crear cuenta</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pearl" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-graphite/60">O regístrate con</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-graphite font-medium py-3 px-6 rounded-lg border border-pearl hover:border-champagne/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-graphite/60 text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link 
                href="/iniciar-sesion" 
                className="text-champagne hover:text-champagne/80 font-semibold transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-graphite/60 hover:text-champagne text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-champagne" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";