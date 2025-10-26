"use client";

import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, LogOut, Download } from "lucide-react";
import { toast } from "sonner";

export default function MyAccountPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [referralData, setReferralData] = useState<any>(null);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [showPremium, setShowPremium] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/iniciar-sesion");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchReferralData();
    }
  }, [session]);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/referrals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
        if (data.totalCount >= 3 && !showPremium) {
          setShowPremium(true);
          setTimeout(() => {
            toast.success("¡Has desbloqueado el Catálogo Premium con precios especiales!");
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoadingReferral(false);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    if (error?.code) {
      toast.error("Error al cerrar sesión");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
      toast.success("Sesión cerrada correctamente");
    }
  };

  const copyReferralLink = () => {
    if (referralData?.refCode) {
      const link = `${window.location.origin}?ref=${referralData.refCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  if (isPending || loadingReferral) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-champagne"></div>
          <p className="mt-4 text-graphite">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const progress = referralData?.totalCount || 0;
  const progressPercentage = Math.min((progress / 3) * 100, 100);
  const isPremiumUnlocked = progress >= 3;

  return (
    <div className="min-h-screen bg-ivory">
      <nav className="border-b border-pearl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-heading text-xl font-semibold text-graphite">
            IWatches
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-sm text-graphite hover:text-champagne transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-2">
            Mi cuenta
          </h1>
          <p className="text-graphite/70 mb-8">
            Bienvenido de nuevo, {session.user.name}
          </p>

          {/* Referral System */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-medium text-graphite mb-4">
                Sistema de referidos
              </h2>
              <p className="text-graphite/70">
                {isPremiumUnlocked
                  ? "¡Has desbloqueado el acceso premium!"
                  : "Comparte tu enlace y desbloquea acceso preferente."}
              </p>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-graphite">
                  Progreso: {progress} / 3 referidos
                </span>
                <span className="text-sm text-champagne font-medium">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-pearl rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-champagne h-full rounded-full"
                />
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="block text-sm font-medium text-graphite mb-2">
                Tu enlace de referido
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralData?.refCode ? `${window.location.origin}?ref=${referralData.refCode}` : "Cargando..."}
                  className="flex-1 px-4 py-2 bg-pearl border border-pearl rounded-lg text-graphite text-sm"
                  aria-label="Enlace de referido"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all duration-300"
                  aria-label="Copiar enlace"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-graphite/60 mt-2">
                Comparte este enlace. Cada descarga válida de catálogo suma a tu progreso.
              </p>
            </div>

            {/* Premium Catalog */}
            {isPremiumUnlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-champagne/10 border-2 border-champagne rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-medium text-graphite mb-2">
                      Catálogo Premium Desbloqueado
                    </h3>
                    <p className="text-sm text-graphite/70 mb-4">
                      Accede al catálogo exclusivo con precios especiales y lanzamientos anticipados.
                    </p>
                    <a
                      href="/premium.pdf"
                      download
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all duration-300"
                      aria-label="Descargar Catálogo Premium"
                    >
                      <Download className="h-5 w-5" />
                      <span>Descargar Catálogo Premium</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Instructions */}
            {!isPremiumUnlocked && (
              <div className="bg-pearl rounded-lg p-4">
                <h3 className="font-medium text-graphite mb-2">¿Cómo funciona?</h3>
                <ul className="space-y-2 text-sm text-graphite/70">
                  <li>• Comparte tu enlace único con amigos y conocidos</li>
                  <li>• Cada vez que alguien descargue el catálogo con tu enlace, suma 1 referido</li>
                  <li>• Al llegar a 3 referidos válidos, desbloqueas el catálogo premium</li>
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}