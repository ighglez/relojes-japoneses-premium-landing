"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

type ErrorTypes = Partial<Record<keyof typeof authClient.$ERROR_CODES, string>>;
const errorCodes = {
  USER_ALREADY_EXISTS: "Este email ya está registrado",
  INVALID_EMAIL: "Email inválido",
  WEAK_PASSWORD: "La contraseña es demasiado débil",
} satisfies ErrorTypes;

const getErrorMessage = (code: string) => {
  if (code in errorCodes) {
    return errorCodes[code as keyof typeof errorCodes];
  }
  return "Error al registrarse. Por favor, intenta de nuevo.";
};

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Password validation states
  const passwordValidations = {
    length: formData.password.length >= 8,
    match: formData.password === formData.confirmPassword && formData.confirmPassword !== "",
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/mi-cuenta",
      });

      if (error?.code) {
        toast.error("Error al registrarse con Google. Por favor, intenta de nuevo.");
        setGoogleLoading(false);
      }
    } catch (error) {
      toast.error("Error al conectar con Google. Verifica tu conexión.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      toast.error("Por favor, ingresa tu nombre completo");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Por favor, ingresa tu email");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
      });

      if (error?.code) {
        toast.error(getErrorMessage(error.code));
        setLoading(false);
        return;
      }

      // Success
      toast.success("¡Cuenta creada exitosamente! Iniciando sesión...");
      
      // Auto login after successful registration
      const { error: signInError } = await authClient.signIn.email({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: true,
      });

      if (signInError?.code) {
        router.push("/iniciar-sesion?registered=true");
        return;
      }

      // Redirect to account page
      router.push("/mi-cuenta");
    } catch (error) {
      toast.error("Error al crear la cuenta. Por favor, intenta de nuevo.");
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
                Crear cuenta
              </h1>
              <p className="text-graphite/70">
                Únete y accede al sistema de referidos
              </p>
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
              className="w-full px-6 py-3 bg-white text-graphite font-medium rounded-lg border-2 border-pearl hover:bg-pearl/30 hover:border-champagne transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
              aria-label="Registrarse con Google"
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
                <span className="px-3 bg-white text-graphite/60">o continúa con email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-graphite font-medium">
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 h-11"
                  aria-required="true"
                  disabled={loading || googleLoading}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-graphite font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 h-11"
                  aria-required="true"
                  disabled={loading || googleLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-graphite font-medium">
                  Contraseña *
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10 h-11"
                    aria-required="true"
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
                {formData.password && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {passwordValidations.length ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={passwordValidations.length ? "text-green-700" : "text-red-600"}>
                      Mínimo 8 caracteres
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-graphite font-medium">
                  Confirmar contraseña *
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pr-10 h-11"
                    aria-required="true"
                    disabled={loading || googleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/50 hover:text-graphite transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {passwordValidations.match ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={passwordValidations.match ? "text-green-700" : "text-red-600"}>
                      Las contraseñas coinciden
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading || !passwordValidations.length || !passwordValidations.match}
                className="w-full px-6 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-champagne/90 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-11"
                aria-label="Crear cuenta"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ivory"></div>
                    Creando cuenta...
                  </span>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-pearl">
              <p className="text-center text-sm text-graphite/70">
                ¿Ya tienes cuenta?{" "}
                <Link href="/iniciar-sesion" className="text-champagne hover:underline font-medium transition-colors">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}