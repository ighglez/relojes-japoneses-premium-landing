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
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-16 w-16 animate-spin text-champagne mx-auto mb-4" />
          <p className="text-graphite/70 font-medium text-lg">Cargando tu cuenta...</p>
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
    <div className="min-h-screen bg-ivory">
      {/* Navigation */}
      <nav className="border-b border-pearl bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-heading text-xl font-semibold text-graphite hover:text-champagne transition-colors">
            IWatchWorks
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-sm text-graphite/70 hover:text-champagne transition-colors px-4 py-2 rounded-lg hover:bg-champagne/5 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al inicio</span>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-ivory bg-graphite hover:bg-graphite/90 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Header */}
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
              <p className="text-lg text-graphite/60">
                Bienvenido, <span className="text-champagne font-medium">{session.user.name}</span>
              </p>
            </div>
            {isPremiumUnlocked && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-champagne/10 text-champagne rounded-lg border border-champagne/30">
                <Award className="h-5 w-5" />
                <span className="font-medium">Miembro Premium</span>
                <Sparkles className="h-4 w-4" />
              </div>
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
            <div className="bg-white rounded-lg shadow-lg border border-pearl p-8 h-full">
              {/* Avatar */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-champagne/10 rounded-full flex items-center justify-center border-2 border-champagne/30">
                    <User className="h-12 w-12 text-champagne" />
                  </div>
                  {isPremiumUnlocked && (
                    <div className="absolute -bottom-2 -right-2 bg-champagne rounded-full p-2 shadow-lg">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-5">
                <div className="bg-pearl/30 rounded-lg p-4">
                  <label className="text-xs text-graphite/50 font-medium uppercase tracking-wider flex items-center gap-2 mb-2">
                    <User className="h-3.5 w-3.5" />
                    Nombre
                  </label>
                  <p className="text-graphite font-medium text-lg">{session.user.name}</p>
                </div>

                <div className="bg-pearl/30 rounded-lg p-4">
                  <label className="text-xs text-graphite/50 font-medium uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </label>
                  <p className="text-graphite font-medium text-sm break-all">{session.user.email}</p>
                </div>

                <div className="bg-pearl/30 rounded-lg p-4">
                  <label className="text-xs text-graphite/50 font-medium uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Miembro desde
                  </label>
                  <p className="text-graphite font-medium text-sm">
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
            <div className="bg-white rounded-lg shadow-lg border border-pearl p-8 md:p-10 space-y-8 h-full">
              {/* Header */}
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-champagne/10 rounded-lg flex items-center justify-center border-2 border-champagne/30">
                    <Users className="h-6 w-6 text-champagne" />
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
                <div className="bg-champagne/10 rounded-lg p-6 text-center border border-champagne/30">
                  <p className="text-4xl md:text-5xl font-bold text-champagne mb-2">{progress}</p>
                  <p className="text-xs text-graphite/60 font-medium uppercase tracking-wide">Referidos</p>
                </div>

                <div className="bg-pearl/50 rounded-lg p-6 text-center border border-pearl">
                  <p className="text-4xl md:text-5xl font-bold text-graphite mb-2">{remainingReferrals}</p>
                  <p className="text-xs text-graphite/60 font-medium uppercase tracking-wide">Restantes</p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
                  <p className="text-4xl md:text-5xl font-bold text-green-600 mb-2">{progressPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-graphite/60 font-medium uppercase tracking-wide">Progreso</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-graphite flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-champagne" />
                    Tu progreso hacia premium
                  </span>
                  {isPremiumUnlocked && (
                    <span className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-lg">
                      <CheckCircle2 className="h-4 w-4" />
                      ¡Completado!
                    </span>
                  )}
                </div>
                <div className="w-full bg-pearl/50 rounded-full h-4 overflow-hidden border border-pearl">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isPremiumUnlocked 
                        ? 'bg-green-500' 
                        : 'bg-champagne'
                    }`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-graphite/50 font-medium">
                  <span>0</span>
                  <span>3 referidos</span>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-sm font-medium text-graphite mb-3 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-champagne" />
                  Tu enlace de referido único
                </label>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={referralData?.refCode ? `${window.location.origin}?ref=${referralData.refCode}` : "Cargando..."}
                    className="flex-1 px-4 py-3 bg-pearl/30 border border-pearl rounded-lg text-graphite text-sm font-medium focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={copyReferralLink}
                      className={`px-5 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-champagne text-ivory hover:bg-opacity-90'
                      }`}
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
                      className="px-5 py-3 bg-graphite text-ivory rounded-lg hover:bg-graphite/90 transition-all flex items-center gap-2"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="hidden sm:inline">Compartir</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-champagne/10 border-l-4 border-champagne rounded-lg">
                  <p className="text-sm text-graphite/70 leading-relaxed">
                    <Gift className="h-4 w-4 inline mr-2 text-champagne" />
                    <span className="font-medium">Consejo:</span> Comparte en WhatsApp, redes sociales o email. Cada descarga suma a tu progreso.
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8"
            >
              <div className="bg-champagne/10 border-2 border-champagne rounded-lg p-10 md:p-12">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-16 h-16 bg-champagne rounded-lg flex items-center justify-center">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading text-3xl md:text-4xl font-medium text-graphite mb-2">
                          Catálogo Premium
                        </h3>
                        <p className="text-champagne font-medium text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          Acceso exclusivo desbloqueado
                        </p>
                      </div>
                    </div>
                    <p className="text-graphite/70 mb-6 text-lg leading-relaxed">
                      ¡Felicitaciones por alcanzar 3 referidos! Ahora tienes acceso a nuestro catálogo exclusivo con beneficios VIP.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-graphite/70">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="font-medium">Precios especiales y descuentos exclusivos</span>
                      </li>
                      <li className="flex items-center gap-3 text-graphite/70">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="font-medium">Acceso anticipado a nuevos lanzamientos</span>
                      </li>
                      <li className="flex items-center gap-3 text-graphite/70">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="font-medium">Ofertas VIP no disponibles al público</span>
                      </li>
                    </ul>
                  </div>
                  <a
                    href="/premium.pdf"
                    download
                    className="flex-shrink-0 inline-flex items-center gap-3 px-10 py-5 bg-champagne text-ivory font-medium text-lg rounded-lg hover:bg-opacity-90 transition-all reflection-hover"
                  >
                    <Download className="h-6 w-6" />
                    <span>Descargar Premium</span>
                  </a>
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
            <div className="bg-white rounded-lg shadow-lg border border-pearl p-10 md:p-12">
              <h3 className="font-heading text-3xl font-medium text-graphite mb-8 flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-champagne" />
                ¿Cómo desbloquear el catálogo premium?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { step: "1", title: "Comparte tu enlace", desc: "Envía tu enlace único a amigos, familiares y conocidos interesados en relojes exclusivos." },
                  { step: "2", title: "Acumula descargas", desc: "Cada descarga del catálogo usando tu enlace suma 1 referido a tu cuenta automáticamente." },
                  { step: "3", title: "Desbloquea premium", desc: "Al llegar a 3 referidos válidos, obtienes acceso inmediato al catálogo premium con precios exclusivos." }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-champagne rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-graphite mb-2 text-xl">{item.title}</h4>
                      <p className="text-sm text-graphite/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}