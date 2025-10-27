"use client";

import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, LogOut, Download, Share2, User, Mail, CheckCircle2, TrendingUp, Calendar, Users, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function MyAccountPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [referralData, setReferralData] = useState<any>(null);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [showPremium, setShowPremium] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    setSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      
      if (error?.code) {
        toast.error("Error al cerrar sesión");
        setSigningOut(false);
      } else {
        localStorage.removeItem("bearer_token");
        await refetch();
        toast.success("Sesión cerrada correctamente");
        router.push("/");
      }
    } catch (error) {
      toast.error("Error al cerrar sesión");
      setSigningOut(false);
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
      const shareText = "Descubre relojes automáticos japoneses exclusivos de IWatches. ¡Descarga el catálogo gratis! 🎯⌚";
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: "IWatches - Catálogo de Relojes Automáticos",
            text: shareText,
            url: link,
          });
          toast.success("¡Compartido exitosamente!");
        } catch (error) {
          // User cancelled, no error needed
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
          <motion.div 
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-champagne border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
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
    <div className="min-h-screen bg-gradient-to-b from-ivory to-pearl/30">
      {/* Navigation */}
      <nav className="border-b border-pearl/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-heading text-xl font-semibold text-graphite hover:text-champagne transition-colors">
            IWatches
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-sm text-graphite/70 hover:text-champagne transition-colors px-3 py-2 rounded-lg hover:bg-champagne/5"
            >
              Volver al inicio
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-graphite hover:text-champagne border border-pearl hover:border-champagne rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span>{signingOut ? "Cerrando..." : "Cerrar sesión"}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Section with Premium Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-2">
                Mi cuenta
              </h1>
              <p className="text-lg text-graphite/70">
                Bienvenido de nuevo, <span className="text-champagne font-medium">{session.user.name}</span>
              </p>
            </div>
            {isPremiumUnlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-champagne to-yellow-600 text-white rounded-full shadow-lg"
              >
                <Award className="h-5 w-5" />
                <span className="font-semibold">Miembro Premium</span>
                <Sparkles className="h-4 w-4" />
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-md border border-pearl/50 p-6 h-full hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-champagne/20 to-champagne/5 rounded-full flex items-center justify-center ring-4 ring-champagne/10">
                    <User className="h-12 w-12 text-champagne" />
                  </div>
                  {isPremiumUnlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 bg-champagne rounded-full p-1.5 shadow-lg"
                    >
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-pearl/30 to-transparent rounded-lg p-4">
                  <label className="text-xs text-graphite/60 font-medium uppercase tracking-wider flex items-center gap-2 mb-1">
                    <User className="h-3 w-3" />
                    Nombre
                  </label>
                  <p className="text-graphite font-semibold text-lg">{session.user.name}</p>
                </div>
                <div className="bg-gradient-to-r from-pearl/30 to-transparent rounded-lg p-4">
                  <label className="text-xs text-graphite/60 font-medium uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-graphite font-medium text-sm break-all">{session.user.email}</p>
                </div>
                <div className="bg-gradient-to-r from-pearl/30 to-transparent rounded-lg p-4">
                  <label className="text-xs text-graphite/60 font-medium uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Calendar className="h-3 w-3" />
                    Miembro desde
                  </label>
                  <p className="text-graphite font-medium">
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

          {/* Referral System Card - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-md border border-pearl/50 p-6 md:p-8 space-y-6 h-full hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-2xl md:text-3xl font-medium text-graphite mb-2 flex items-center gap-2">
                    <Users className="h-8 w-8 text-champagne" />
                    Sistema de referidos
                  </h2>
                  <p className="text-graphite/70 text-base">
                    {isPremiumUnlocked
                      ? "🎉 ¡Felicitaciones! Has desbloqueado el acceso premium"
                      : `Comparte y desbloquea beneficios exclusivos. Solo ${remainingReferrals} ${remainingReferrals === 1 ? 'más' : 'más'} para premium.`}
                  </p>
                </div>
              </div>

              {/* Progress Stats - Enhanced */}
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  className="bg-gradient-to-br from-champagne/10 to-champagne/5 rounded-xl p-5 text-center border border-champagne/20 hover:border-champagne/40 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="text-3xl md:text-4xl font-bold text-champagne mb-1">{progress}</p>
                  <p className="text-xs text-graphite/60 font-medium">Referidos totales</p>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-pearl/50 to-pearl/20 rounded-xl p-5 text-center border border-pearl hover:border-champagne/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="text-3xl md:text-4xl font-bold text-graphite mb-1">{remainingReferrals}</p>
                  <p className="text-xs text-graphite/60 font-medium">Restantes</p>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 text-center border border-green-200 hover:border-green-300 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="text-3xl md:text-4xl font-bold text-green-600 mb-1">{progressPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-graphite/60 font-medium">Completado</p>
                </motion.div>
              </div>

              {/* Progress Bar - Enhanced */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-graphite flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-champagne" />
                    Tu progreso hacia premium
                  </span>
                  {isPremiumUnlocked && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      ¡Completado!
                    </motion.span>
                  )}
                </div>
                <div className="w-full bg-pearl rounded-full h-5 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isPremiumUnlocked 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-champagne to-yellow-500'
                    } shadow-sm`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-graphite/60">
                  <span>0 referidos</span>
                  <span className="font-semibold">3 referidos (Premium)</span>
                </div>
              </div>

              {/* Referral Link - Enhanced */}
              <div>
                <label className="block text-sm font-semibold text-graphite mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-champagne" />
                  Tu enlace de referido único
                </label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={referralData?.refCode ? `${window.location.origin}?ref=${referralData.refCode}` : "Cargando..."}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-pearl/30 to-pearl/10 border-2 border-pearl rounded-xl text-graphite text-sm font-medium focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all"
                    aria-label="Enlace de referido"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      onClick={copyReferralLink}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-md ${
                        copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-champagne text-ivory hover:bg-champagne/90 hover:shadow-lg'
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
                    </motion.button>
                    <motion.button
                      onClick={shareReferralLink}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-3 bg-graphite text-ivory rounded-xl hover:bg-graphite/90 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                      aria-label="Compartir enlace"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="hidden sm:inline">Compartir</span>
                    </motion.button>
                  </div>
                </div>
                <p className="text-sm text-graphite/60 mt-3 bg-champagne/5 border border-champagne/20 rounded-lg p-3">
                  💡 <span className="font-medium">Consejo:</span> Comparte este enlace en WhatsApp, redes sociales o email. Cada descarga del catálogo suma a tu progreso.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Premium Catalog Unlock - Enhanced */}
        <AnimatePresence>
          {isPremiumUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8"
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-champagne via-yellow-600 to-yellow-700 rounded-2xl p-1 shadow-2xl">
                <div className="bg-gradient-to-br from-ivory via-white to-champagne/10 rounded-xl p-8 md:p-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div 
                          className="w-16 h-16 bg-gradient-to-br from-champagne to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Award className="h-8 w-8 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="font-heading text-3xl md:text-4xl font-bold text-graphite mb-1">
                            Catálogo Premium
                          </h3>
                          <p className="text-champagne font-semibold text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Acceso exclusivo desbloqueado
                          </p>
                        </div>
                      </div>
                      <p className="text-graphite/80 mb-5 text-lg leading-relaxed">
                        ¡Felicitaciones por alcanzar 3 referidos! Ahora tienes acceso a nuestro catálogo exclusivo con beneficios VIP.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-graphite/80">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Precios especiales y descuentos exclusivos</span>
                        </li>
                        <li className="flex items-center gap-3 text-graphite/80">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Acceso anticipado a nuevos lanzamientos</span>
                        </li>
                        <li className="flex items-center gap-3 text-graphite/80">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Ofertas VIP no disponibles al público</span>
                        </li>
                      </ul>
                    </div>
                    <motion.a
                      href="/premium.pdf"
                      download
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-champagne to-yellow-600 text-white font-bold text-lg rounded-2xl hover:shadow-2xl transition-all duration-300 group"
                      aria-label="Descargar Catálogo Premium"
                    >
                      <Download className="h-7 w-7 group-hover:animate-bounce" />
                      <span>Descargar Premium</span>
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it Works - Enhanced for non-premium users */}
        {!isPremiumUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl shadow-md border border-pearl/50 p-8 md:p-10">
              <h3 className="font-heading text-2xl font-semibold text-graphite mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-champagne" />
                ¿Cómo desbloquear el catálogo premium?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div 
                  className="flex gap-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-champagne to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-graphite mb-2 text-lg">Comparte tu enlace</h4>
                    <p className="text-sm text-graphite/70 leading-relaxed">Envía tu enlace único a amigos, familiares y conocidos interesados en relojes exclusivos.</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex gap-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-champagne to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-graphite mb-2 text-lg">Acumula descargas</h4>
                    <p className="text-sm text-graphite/70 leading-relaxed">Cada descarga del catálogo usando tu enlace suma 1 referido a tu cuenta automáticamente.</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex gap-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-champagne to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-graphite mb-2 text-lg">Desbloquea premium</h4>
                    <p className="text-sm text-graphite/70 leading-relaxed">Al llegar a 3 referidos válidos, obtienes acceso inmediato al catálogo premium con precios exclusivos.</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}