"use client";

import { X, ArrowRight, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const { items, itemCount, subtotal, removeItem, isDrawerOpen, closeDrawer } = useCart();

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-graphite/40 backdrop-blur-[1px] z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-pearl/50">
              <h2 className="text-sm font-bold text-graphite uppercase tracking-[0.2em]">
                BAG {itemCount > 0 && `(${itemCount})`}
              </h2>
              <button
                onClick={closeDrawer}
                className="p-1 hover:bg-ivory rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-graphite/40" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <p className="text-graphite/40 text-sm uppercase tracking-widest font-medium">Tu bolsa está vacía</p>
                  <button 
                    onClick={closeDrawer}
                    className="text-xs font-bold text-champagne uppercase tracking-widest hover:underline"
                  >
                    Volver a la tienda
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-6 relative group"
                    >
                      {/* Image */}
                      <div className="relative w-24 h-24 bg-ivory rounded-lg flex-shrink-0 overflow-hidden border border-pearl/50">
                        <Image
                          src={item.imageUrl || "/images/products/placeholder-watch.webp"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="font-heading text-sm font-semibold text-graphite leading-tight mb-1 group-hover:text-champagne transition-colors">
                              {item.brand} {item.name}
                            </h3>
                            <p className="text-[10px] text-graphite/40 font-medium uppercase tracking-widest mb-1">
                              {item.reference}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-graphite/60 font-medium">
                                Cantidad: {item.quantity}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-bold text-graphite mt-2">
                            {item.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-0 right-0 p-1 hover:text-red-500 transition-colors"
                        aria-label="Eliminar"
                      >
                        <X className="h-4 w-4 text-graphite/30" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-8 border-t border-pearl/50 bg-white">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-medium text-graphite uppercase tracking-widest">Subtotal:</span>
                  <span className="text-lg font-bold text-graphite">
                    {subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <Link
                    href="/pagar"
                    onClick={closeDrawer}
                    className="flex items-center justify-between w-full py-5 px-8 bg-graphite text-ivory font-bold uppercase tracking-[0.2em] text-xs rounded hover:bg-black transition-all group"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  
                  <Link
                    href="/carrito"
                    onClick={closeDrawer}
                    className="block w-full text-center py-2 text-[10px] font-bold text-graphite/40 uppercase tracking-widest hover:text-graphite transition-colors"
                  >
                    Ver carrito completo
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
