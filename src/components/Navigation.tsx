"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart, Heart } from "lucide-react";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/productos", label: "Tienda" },
    { href: "/#confianza", label: "Confianza" },
    { href: "/#resenas", label: "Reseñas" },
    { href: "/#contacto", label: "Contacto" },
  ];

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const sessionId = localStorage.getItem("guest_session_id");

      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = sessionId ? `/api/cart/get?sessionId=${sessionId}` : `/api/cart/get`;
      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setCartCount(data.itemCount || 0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  // Fetch wishlist count (only for authenticated users)
  const fetchWishlistCount = async () => {
    if (!session?.user) {
      setWishlistCount(0);
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) return;

      const response = await fetch("/api/wishlist/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWishlistCount(data.length || 0);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };

  useEffect(() => {
    fetchCartCount();
    fetchWishlistCount();
    
    // Listen for cart and wishlist updates
    const handleCartUpdate = () => fetchCartCount();
    const handleWishlistUpdate = () => fetchWishlistCount();
    
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    
    // Also refresh periodically
    const interval = setInterval(() => {
      fetchCartCount();
      fetchWishlistCount();
    }, 30000); // Every 30 seconds
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
      clearInterval(interval);
    };
  }, [session]);

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

            {/* Auth Links, Wishlist & Cart */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart Button */}
              <Link
                href="/carrito"
                className="relative p-2 hover:bg-pearl rounded-lg transition-colors"
                aria-label="Carrito"
              >
                <ShoppingCart className="h-5 w-5 text-graphite" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-champagne text-ivory text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Wishlist Button (only for authenticated users) */}
              {session?.user && (
                <Link
                  href="/favoritos"
                  className="relative p-2 hover:bg-pearl rounded-lg transition-colors"
                  aria-label="Favoritos"
                >
                  <Heart className="h-5 w-5 text-graphite" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              
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
              {/* Mobile Cart Button */}
              <Link
                href="/carrito"
                className="relative p-2"
                aria-label="Carrito"
              >
                <ShoppingCart className="h-5 w-5 text-graphite" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-champagne text-ivory text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Wishlist Button */}
              {session?.user && (
                <Link
                  href="/favoritos"
                  className="relative p-2"
                  aria-label="Favoritos"
                >
                  <Heart className="h-5 w-5 text-graphite" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

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
    </>
  );
}