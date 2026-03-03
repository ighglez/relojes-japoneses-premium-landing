// ============================================
// ARCHIVO 2: src/components/cart/CartIcon.tsx
// CREAR - Badge del carrito para header
// ============================================

"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";

export function CartIcon({ className = "" }: { className?: string }) {
  const { cart } = useCart();
  const itemCount = cart.itemCount || 0;

  return (
    <Link 
      href="/carrito" 
      className={`relative group ${className}`}
      aria-label={`Carrito (${itemCount} artículos)`}
    >
      <ShoppingCart className="w-6 h-6 text-graphite group-hover:text-champagne transition-colors" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-champagne text-ivory text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
