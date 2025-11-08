"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import Link from "next/link";

interface Order {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: any[];
  discountAmount: number;
  couponCode: string | null;
  paymentMethod: string;
}

export default function MiCuentaOrdenes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-graphite" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "Pendiente",
      paid: "Pagado",
      processing: "Procesando",
      shipped: "Enviado",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-champagne" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-pearl p-12 text-center">
        <Package className="h-16 w-16 text-graphite/20 mx-auto mb-4" />
        <h3 className="font-heading text-xl font-medium text-graphite mb-2">
          No tienes pedidos aún
        </h3>
        <p className="text-graphite/60 mb-6">
          Cuando realices una compra, aparecerá aquí
        </p>
        <Link
          href="/productos"
          className="inline-block px-6 py-3 bg-champagne text-ivory font-medium rounded-lg hover:bg-opacity-90 transition-all"
        >
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order, index) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg border border-pearl p-6 hover:shadow-md transition-shadow"
        >
          {/* Order Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 pb-4 border-b border-pearl">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(order.status)}
                <h3 className="font-heading text-lg font-medium text-graphite">
                  Pedido #{order.orderNumber}
                </h3>
              </div>
              <p className="text-sm text-graphite/60">
                {new Date(order.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusText(order.status)}
              </span>
            </div>
          </div>

          {/* Order Items Summary */}
          <div className="mb-4">
            <p className="text-sm text-graphite/70 mb-2">
              {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
            </p>
            <div className="space-y-2">
              {order.items.slice(0, 2).map((item) => (
                <div key={item.id} className="text-sm text-graphite/80">
                  • {item.productName} ({item.productReference}) × {item.quantity}
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-sm text-graphite/60">
                  + {order.items.length - 2} más
                </p>
              )}
            </div>
          </div>

          {/* Order Footer */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-pearl">
            <div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-graphite/60">Total:</span>
                  <span className="font-bold text-champagne text-lg">
                    {order.total.toFixed(2)} €
                  </span>
                </div>
                {order.couponCode && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <span>Cupón {order.couponCode} aplicado</span>
                    <span>(-{order.discountAmount.toFixed(2)} €)</span>
                  </div>
                )}
                <p className="text-xs text-graphite/60">
                  Método: {order.paymentMethod === "paypal" ? "PayPal" : order.paymentMethod}
                </p>
              </div>
            </div>

            <Link
              href={`/pago/exito?orderId=${order.orderNumber}`}
              className="inline-flex items-center gap-2 px-6 py-2 border-2 border-pearl text-graphite font-medium rounded-lg hover:bg-pearl transition-all"
            >
              <Eye className="h-4 w-4" />
              Ver detalles
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
