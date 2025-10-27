"use client";

import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, LogOut, Download, Share2, User, Mail, CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function MyAccountPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [referralData, setReferralData] = useState<any>(null);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [showPremium, setShowPremium] = useState(false);
  const [copied, setCopied] = useState(false);

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
        }
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoadingReferral(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    
    if (error?.code) {
      toast.error("Error al cerrar sesión");
    } else {
      localStorage.removeItem("bearer_token");
      await refetch();
      router.push("/");
      toast.success("Sesión cerrada correctamente");
    }
  };

  const copyReferralLink = () => {
    if (referralData?.refCode) {
      const link = `${window.location.origin}?ref=${referralData.refCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("¡Enlace copiado al portapapeles!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = async () => {
    if (referralData?.refCode) {
      const link = `${window.location.origin}?ref=${referralData.refCode}`;
      const shareText = "¡Descarga el catálogo de relojes automáticos japoneses exclusivos! 🎯⌚";
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: "IWatches - Catálogo de Relojes",
            text: shareText,
            url: link,
          });
          toast.success("¡Compartido exitosamente!");
        } catch (error) {
          // User cancelled
        }
      } else {
        copyReferralLink();
      }
    }
  };

  if (isPending || loadingReferral) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-champagne border-t-transparent"></div>
          <p className="mt-4 text-graphite font-medium">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const progress = referralData?.totalCount || 0;
  const progressPercentage = Math.min((progress / 3) * 100, 100);
  const isPremiumUnlocked = progress >= 3;
  const remainingReferrals = Math.max(3 - progress, 0);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Navigation */}
      <nav className="border-b border-pearl bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-heading text-xl font-semibold text-graphite hover:text-champagne transition-colors">
            IWatches
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-sm text-graphite/70 hover:text-champagne transition-colors"
            >
              Ir al inicio
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-graphite hover:text-champagne border border-pearl hover:border-champagne rounded-lg transition-all duration-300"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-3">
            Mi cuenta
          </h1>
          <p className="text-lg text-graphite/70">
            Bienvenido de nuevo, <span className="text-champagne font-medium">{session.user.name}</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm border border-pearl p-6 h-full">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-champagne/10 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-champagne" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-graphite/60 font-medium uppercase tracking-wider">Nombre</label>
                  <p className="text-graphite font-medium mt-1">{session.user.name}</p>
                </div>
                <div>
                  <label className="text-xs text-graphite/60 font-medium uppercase tracking-wider">Email</label>
                  <p className="text-graphite font-medium mt-1 text-sm break-all">{session.user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-graphite/60 font-medium uppercase tracking-wider">Miembro desde</label>
                  <p className="text-graphite font-medium mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-champagne" />
                    {new Date(session.user.createdAt).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Referral System Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm border border-pearl p-6 md:p-8 space-y-6 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-2xl md:text-3xl font-medium text-graphite mb-2">
                    Sistema de referidos
                  </h2>
                  <p className="text-graphite/70">
                    {isPremiumUnlocked
                      ? "¡Felicitaciones! Has desbloqueado el acceso premium"
                      : `Comparte tu enlace y desbloquea el catálogo premium. ${remainingReferrals} ${remainingReferrals === 1 ? 'referido más' : 'referidos más'} para desbloquearlo.`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-champagne" />
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-champagne/5 rounded-lg p-4 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-champagne">{progress}</p>
                  <p className="text-xs text-graphite/60 mt-1">Referidos</p>
                </div>
                <div className="bg-champagne/5 rounded-lg p-4 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-champagne">{remainingReferrals}</p>
                  <p className="text-xs text-graphite/60 mt-1">Restantes</p>
                </div>
                <div className="bg-champagne/5 rounded-lg p-4 text-center">
                  <p className="text-2xl md:text-3xl font-bold text-champagne">{progressPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-graphite/60 mt-1">Completado</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-graphite">
                    Tu progreso
                  </span>
                  {isPremiumUnlocked && (
                    <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Completado
                    </span>
                  )}
                </div>
                <div className="w-full bg-pearl rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isPremiumUnlocked ? 'bg-green-500' : 'bg-champagne'}`}
                  />
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-sm font-medium text-graphite mb-2">
                  Tu enlace de referido único
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralData?.refCode ? `${window.location.origin}?ref=${referralData.refCode}` : "Cargando..."}
                    className="flex-1 px-4 py-3 bg-pearl/50 border border-pearl rounded-lg text-graphite text-sm focus:outline-none focus:ring-2 focus:ring-champagne"
                    aria-label="Enlace de referido"
                  />
                  <button
                    onClick={copyReferralLink}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-champagne text-ivory hover:bg-champagne/90'
                    }`}
                    aria-label="Copiar enlace"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={shareReferralLink}
                    className="px-4 py-3 bg-graphite text-ivory rounded-lg hover:bg-graphite/90 transition-all duration-300 flex items-center gap-2"
                    aria-label="Compartir enlace"
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="hidden sm:inline">Compartir</span>
                  </button>
                </div>
                <p className="text-xs text-graphite/60 mt-2">
                  💡 Comparte este enlace. Cada descarga válida del catálogo suma a tu progreso.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Premium Catalog Unlock */}
        {isPremiumUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <div className="bg-gradient-to-br from-champagne/20 via-champagne/10 to-transparent border-2 border-champagne rounded-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-champagne rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-ivory" />
                    </div>
                    <h3 className="font-heading text-2xl md:text-3xl font-medium text-graphite">
                      Catálogo Premium Desbloqueado
                    </h3>
                  </div>
                  <p className="text-graphite/70 mb-4">
                    ¡Felicitaciones! Has alcanzado 3 referidos. Accede ahora al catálogo exclusivo con precios especiales, lanzamientos anticipados y ofertas VIP.
                  </p>
                  <ul className="space-y-2 text-sm text-graphite/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-champagne" />
                      Precios especiales exclusivos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-champagne" />
                      Acceso anticipado a nuevos lanzamientos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-champagne" />
                      Ofertas VIP no disponibles públicamente
                    </li>
                  </ul>
                </div>
                <a
                  href="/premium.pdf"
                  download
                  className="flex-shrink-0 inline-flex items-center space-x-3 px-8 py-4 bg-champagne text-ivory font-medium rounded-lg hover:bg-champagne/90 hover:shadow-xl transition-all duration-300 group"
                  aria-label="Descargar Catálogo Premium"
                >
                  <Download className="h-6 w-6 group-hover:animate-bounce" />
                  <span className="text-lg">Descargar Catálogo Premium</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* How it Works */}
        {!isPremiumUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-pearl p-6 md:p-8">
              <h3 className="font-heading text-xl font-medium text-graphite mb-4">
                ¿Cómo funciona el sistema de referidos?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
                    <span className="text-champagne font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-graphite mb-1">Comparte tu enlace</h4>
                    <p className="text-sm text-graphite/70">Envía tu enlace único a amigos, familiares y conocidos interesados en relojes.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
                    <span className="text-champagne font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-graphite mb-1">Acumula descargas</h4>
                    <p className="text-sm text-graphite/70">Cada vez que alguien descargue el catálogo usando tu enlace, suma 1 referido.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
                    <span className="text-champagne font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-graphite mb-1">Desbloquea premium</h4>
                    <p className="text-sm text-graphite/70">Al llegar a 3 referidos válidos, obtienes acceso al catálogo premium.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}