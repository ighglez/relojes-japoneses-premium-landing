"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import CartButton from "@/components/cart/CartButton";
import CartDrawer from "@/components/cart/CartDrawer";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/productos", label: "Tienda" },
    { href: "/#confianza", label: "Confianza" },
    { href: "/#resenas", label: "Reseñas" },
    { href: "/#contacto", label: "Contacto" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.startsWith("/#")) {
      return pathname === "/" && typeof window !== "undefined" && window.location.hash === href.substring(1);
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const id = href.substring(2);
      if (pathname !== "/") {
        window.location.href = href;
      } else {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
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
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(link.href, e)}
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive(link.href)
                      ? "text-champagne font-semibold"
                      : "text-graphite hover:text-champagne"
                  }`}
                  aria-label={link.label}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Links & Cart */}
            <div className="hidden md:flex items-center space-x-4">
              <CartButton onClick={() => setCartOpen(true)} />
              
              {session?.user ? (
                <Link
                  href="/mi-cuenta"
                  className={`text-sm font-medium transition-colors duration-300 ${
                    pathname === "/mi-cuenta"
                      ? "text-champagne font-semibold"
                      : "text-graphite hover:text-champagne"
                  }`}
                  aria-label="Mi cuenta"
                >
                  Mi cuenta
                </Link>
              ) : (
                <>
                  <Link
                    href="/iniciar-sesion"
                    className={`text-sm font-medium transition-colors duration-300 ${
                      pathname === "/iniciar-sesion"
                        ? "text-champagne font-semibold"
                        : "text-graphite hover:text-champagne"
                    }`}
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
            <div className="flex md:hidden items-center gap-2">
              <CartButton onClick={() => setCartOpen(true)} />
              <button
                className="p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-graphite" />
                ) : (
                  <Menu className="h-6 w-6 text-graphite" />
                )}
              </button>
            </div>
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
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(link.href, e);
                    if (!link.href.startsWith("/#")) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={`block text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-champagne font-semibold"
                      : "text-graphite hover:text-champagne"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-pearl space-y-3">
                {session?.user ? (
                  <Link
                    href="/mi-cuenta"
                    className={`block text-sm font-medium transition-colors ${
                      pathname === "/mi-cuenta"
                        ? "text-champagne font-semibold"
                        : "text-graphite hover:text-champagne"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mi cuenta
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/iniciar-sesion"
                      className={`block text-sm font-medium transition-colors ${
                        pathname === "/iniciar-sesion"
                          ? "text-champagne font-semibold"
                          : "text-graphite hover:text-champagne"
                      }`}
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

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}