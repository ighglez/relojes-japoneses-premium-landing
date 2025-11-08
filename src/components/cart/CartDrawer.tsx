"use client";

import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-graphite/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-ivory shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-pearl">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-champagne" />
                <h2 className="font-heading text-xl font-semibold text-graphite">
                  Tu carrito
                </h2>
                {itemCount > 0 && (
                  <span className="text-sm text-graphite/60">({itemCount})</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-pearl rounded-lg transition-colors"
                aria-label="Cerrar carrito"
              >
                <X className="h-5 w-5 text-graphite" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-16 w-16 text-graphite/20 mb-4" />
                  <p className="text-graphite/60 mb-2">Tu carrito está vacío</p>
                  <p className="text-sm text-graphite/40">
                    Añade productos para comenzar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 bg-white p-4 rounded-lg border border-pearl"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-20 bg-pearl rounded-lg flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-graphite/30" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-graphite text-sm mb-1 truncate">
                          {item.brand} {item.name}
                        </h3>
                        <p className="text-xs text-graphite/60 mb-2">
                          Ref: {item.reference}
                        </p>
                        <p className="font-semibold text-champagne">
                          {(item.price * item.quantity).toFixed(2)} €
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium text-graphite w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="ml-auto w-7 h-7 flex items-center justify-center hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-pearl p-6 space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium text-graphite">Subtotal</span>
                  <span className="font-bold text-champagne">
                    {subtotal.toFixed(2)} €
                  </span>
                </div>
                <Link
                  href="/carrito"
                  onClick={onClose}
                  className="block w-full py-3 bg-champagne text-ivory text-center font-medium rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Ver carrito y pagar
                </Link>
                <button
                  onClick={onClose}
                  className="block w-full py-3 border border-pearl text-graphite text-center font-medium rounded-lg hover:bg-pearl transition-all"
                >
                  Seguir comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
