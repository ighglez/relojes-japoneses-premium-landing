"use client";

import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, LogOut, Download, Share2, User, Mail, CheckCircle2, TrendingUp, Calendar, Users, Award, Sparkles, Loader2, ExternalLink, Gift } from "lucide-react";
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
      const shareText = "Descubre relojes automáticos japoneses exclusivos de IWatchWorks. ¡Descarga el catálogo gratis! 🎯⌚";
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: "IWatchWorks - Catálogo de Relojes Automáticos",
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
      <div className="min-h-screen bg-gradient-to-br from-ivory via-pearl/20 to-ivory flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-16 w-16 animate-spin text-champagne mx-auto mb-4" />
          <p className="text-graphite/70 font-semibold text-lg">Cargando tu cuenta...</p>
        </motion.div>
      </div>
    );
  }

  if (!session?.user) return null;

  const progress = referralData?.totalCount || 0;
  const progressPercentage = Math.min((progress / 3) * 100, 100);
  const isPremiumUnlocked = progress >= 3;
  const remainingReferrals = Math.max(3 - progress, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-pearl/20 to-ivory relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-champagne/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-champagne/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-pearl/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-heading text-xl font-semibold text-graphite hover:text-champagne transition-colors">
            IWatchWorks
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-sm text-graphite/70 hover:text-champagne transition-colors px-4 py-2 rounded-xl hover:bg-champagne/5 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al inicio</span>
            </Link>
            <motion.button
              onClick={handleSignOut}
              disabled={signingOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gradient-to-r from-graphite to-graphite/80 hover:from-graphite/90 hover:to-graphite/70 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              aria-label="Cerrar sesión"
            >
              {signingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Cerrando...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-semibold text-graphite mb-2">
                Mi cuenta
              </h1>
              <p className="text-lg text-graphite/60">
                Bienvenido, <span className="text-champagne font-semibold">{session.user.name}</span>
              </p>
            </div>
            {isPremiumUnlocked && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-champagne via-yellow-600 to-champagne bg-size-200 animate-gradient text-white rounded-full shadow-xl shadow-champagne/30"
              >
                <Award className="h-5 w-5" />
                <span className="font-bold">Miembro Premium</span>
                <Sparkles className="h-4 w-4" />
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-pearl/50 p-8 h-full hover:shadow-2xl transition-shadow duration-300">
              {/* Avatar */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-28 h-28 bg-gradient-to-br from-champagne/30 via-champagne/10 to-transparent rounded-full flex items-center justify-center ring-4 ring-champagne/20 shadow-lg">
                    <User className="h-14 w-14 text-champagne" />
                  </div>
                  {isPremiumUnlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.5 }}
                      className="absolute -bottom-2 -right-2 bg-gradient-to-r from-champagne to-yellow-600 rounded-full p-2 shadow-lg"
                    >
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-pearl/50 to-transparent rounded-xl p-5 border border-pearl/50">
                  <label className="text-xs text-graphite/50 font-semibold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <User className="h-3.5 w-3.5" />
                    Nombre
                  </label>
                  <p className="text-graphite font-bold text-lg">{session.user.name}</p>
                </div>

                <div className="bg-gradient-to-br from-pearl/50 to-transparent rounded-xl p-5 border border-pearl/50">
                  <label className="text-xs text-graphite/50 font-semibold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </label>
                  <p className="text-graphite font-semibold text-sm break-all">{session.user.email}</p>
                </div>

                <div className="bg-gradient-to-br from-pearl/50 to-transparent rounded-xl p-5 border border-pearl/50">
                  <label className="text-xs text-graphite/50 font-semibold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Miembro desde
                  </label>
                  <p className="text-graphite font-semibold">
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
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-pearl/50 p-8 md:p-10 space-y-8 h-full hover:shadow-2xl transition-shadow duration-300">
              {/* Header */}
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold text-graphite mb-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-champagne to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Sistema de referidos
                </h2>
                <p className="text-graphite/60 text-base leading-relaxed">
                  {isPremiumUnlocked
                    ? "🎉 ¡Felicitaciones! Desbloqueaste el acceso premium"
                    : `Comparte tu enlace y desbloquea beneficios exclusivos. Solo ${remainingReferrals} ${remainingReferrals === 1 ? 'más' : 'más'}.`}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-gradient-to-br from-champagne/20 via-champagne/10 to-transparent rounded-2xl p-6 text-center border-2 border-champagne/30 shadow-lg"
                >
                  <p className="text-4xl md:text-5xl font-bold text-champagne mb-2">{progress}</p>
                  <p className="text-xs text-graphite/60 font-semibold uppercase tracking-wide">Referidos</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-gradient-to-br from-pearl/70 to-pearl/30 rounded-2xl p-6 text-center border-2 border-pearl shadow-lg"
                >
                  <p className="text-4xl md:text-5xl font-bold text-graphite mb-2">{remainingReferrals}</p>
                  <p className="text-xs text-graphite/60 font-semibold uppercase tracking-wide">Restantes</p>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-6 text-center border-2 border-green-300 shadow-lg"
                >
                  <p className="text-4xl md:text-5xl font-bold text-green-600 mb-2">{progressPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-graphite/60 font-semibold uppercase tracking-wide">Progreso</p>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-graphite flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-champagne" />
                    Tu progreso hacia premium
                  </span>
                  {isPremiumUnlocked && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-100 px-4 py-2 rounded-full"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      ¡Completado!
                    </motion.span>
                  )}
                </div>
                <div className="w-full bg-pearl/50 rounded-full h-6 overflow-hidden shadow-inner border border-pearl">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isPremiumUnlocked 
                        ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-champagne via-yellow-500 to-champagne bg-size-200 animate-gradient'
                    } shadow-lg`}
                  />
                </div>
                <div className="flex justify-between mt-3 text-xs text-graphite/50 font-semibold">
                  <span>0</span>
                  <span>3 referidos</span>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-sm font-bold text-graphite mb-3 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-champagne" />
                  Tu enlace de referido único
                </label>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={referralData?.refCode ? `${window.location.origin}?ref=${referralData.refCode}` : "Cargando..."}
                    className="flex-1 px-5 py-4 bg-gradient-to-r from-pearl/50 to-pearl/20 border-2 border-pearl rounded-xl text-graphite text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all"
                    aria-label="Enlace de referido"
                  />
                  <div className="flex gap-3">
                    <motion.button
                      onClick={copyReferralLink}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg ${
                        copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-r from-champagne to-yellow-600 text-white hover:shadow-xl'
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
                      className="px-6 py-4 bg-gradient-to-r from-graphite to-graphite/80 text-white rounded-xl hover:from-graphite/90 hover:to-graphite/70 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                      aria-label="Compartir enlace"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="hidden sm:inline">Compartir</span>
                    </motion.button>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-champagne/10 border-l-4 border-champagne rounded-lg">
                  <p className="text-sm text-graphite/70 leading-relaxed">
                    <Gift className="h-4 w-4 inline mr-2 text-champagne" />
                    <span className="font-semibold">Consejo:</span> Comparte en WhatsApp, redes sociales o email. Cada descarga suma a tu progreso.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Premium Unlock Section */}
        <AnimatePresence>
          {isPremiumUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8"
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-champagne via-yellow-600 to-champagne bg-size-200 animate-gradient rounded-2xl p-1 shadow-2xl">
                <div className="bg-gradient-to-br from-ivory via-white to-champagne/5 rounded-xl p-10 md:p-12">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-5 mb-6">
                        <motion.div 
                          className="w-20 h-20 bg-gradient-to-br from-champagne to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Award className="h-10 w-10 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="font-heading text-4xl md:text-5xl font-bold text-graphite mb-2">
                            Catálogo Premium
                          </h3>
                          <p className="text-champagne font-bold text-xl flex items-center gap-2">
                            <Sparkles className="h-6 w-6" />
                            Acceso exclusivo desbloqueado
                          </p>
                        </div>
                      </div>
                      <p className="text-graphite/70 mb-6 text-lg leading-relaxed">
                        ¡Felicitaciones por alcanzar 3 referidos! Ahora tienes acceso a nuestro catálogo exclusivo con beneficios VIP.
                      </p>
                      <ul className="space-y-4">
                        <li className="flex items-center gap-4 text-graphite/70">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-semibold text-base">Precios especiales y descuentos exclusivos</span>
                        </li>
                        <li className="flex items-center gap-4 text-graphite/70">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-semibold text-base">Acceso anticipado a nuevos lanzamientos</span>
                        </li>
                        <li className="flex items-center gap-4 text-graphite/70">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-semibold text-base">Ofertas VIP no disponibles al público</span>
                        </li>
                      </ul>
                    </div>
                    <motion.a
                      href="/premium.pdf"
                      download
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-champagne via-yellow-600 to-champagne bg-size-200 animate-gradient text-white font-bold text-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group"
                      aria-label="Descargar Catálogo Premium"
                    >
                      <Download className="h-8 w-8 group-hover:animate-bounce" />
                      <span>Descargar Premium</span>
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it Works - For non-premium users */}
        {!isPremiumUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-pearl/50 p-10 md:p-12">
              <h3 className="font-heading text-3xl font-bold text-graphite mb-8 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-champagne" />
                ¿Cómo desbloquear el catálogo premium?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { step: "1", title: "Comparte tu enlace", desc: "Envía tu enlace único a amigos, familiares y conocidos interesados en relojes exclusivos." },
                  { step: "2", title: "Acumula descargas", desc: "Cada descarga del catálogo usando tu enlace suma 1 referido a tu cuenta automáticamente." },
                  { step: "3", title: "Desbloquea premium", desc: "Al llegar a 3 referidos válidos, obtienes acceso inmediato al catálogo premium con precios exclusivos." }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    className="flex flex-col gap-5"
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-champagne to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <span className="text-white font-bold text-2xl">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-graphite mb-3 text-xl">{item.title}</h4>
                      <p className="text-sm text-graphite/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}