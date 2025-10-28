"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#inicio", label: "Inicio" },
    { href: "#catalogo", label: "Catálogo" },
    { href: "#confianza", label: "Confianza" },
    { href: "#resenas", label: "Reseñas" },
    { href: "#contacto", label: "Contacto" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm border-b border-pearl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-heading text-xl font-semibold text-graphite">
              IWatchWorks
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-graphite hover:text-champagne transition-colors duration-300"
                aria-label={link.label}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth Links */}
          <div className="hidden md:flex items-center space-x-4">
            {session?.user ? (
              <Link
                href="/mi-cuenta"
                className="text-sm font-medium text-graphite hover:text-champagne transition-colors duration-300"
                aria-label="Mi cuenta"
              >
                Mi cuenta
              </Link>
            ) : (
              <>
                <Link
                  href="/iniciar-sesion"
                  className="text-sm font-medium text-graphite hover:text-champagne transition-colors duration-300"
                  aria-label="Iniciar sesión"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registrarse"
                  className="px-4 py-2 text-sm font-medium bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all duration-300"
                  aria-label="Registrarse"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-graphite" />
            ) : (
              <Menu className="h-6 w-6 text-graphite" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-ivory border-t border-pearl"
        >
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-graphite hover:text-champagne transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-pearl space-y-3">
              {session?.user ? (
                <Link
                  href="/mi-cuenta"
                  className="block text-sm font-medium text-graphite hover:text-champagne transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi cuenta
                </Link>
              ) : (
                <>
                  <Link
                    href="/iniciar-sesion"
                    className="block text-sm font-medium text-graphite hover:text-champagne transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/registrarse"
                    className="block px-4 py-2 text-sm font-medium bg-champagne text-ivory rounded-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}