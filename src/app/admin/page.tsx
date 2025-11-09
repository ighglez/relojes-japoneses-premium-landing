

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  series: string;
  reference: string;
  price: number;
  stock: number;
  isNew: boolean;
  isExclusive: boolean;
  isFeatured: boolean;
  images: string[] | string | null;
  description: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/iniciar-sesion?redirect=/admin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProducts();
    }
  }, [session]);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=100");
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.reference.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.series.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  const handleUpdateStock = async (productId: number, newStock: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/products?id=${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (response.ok) {
        toast.success("Stock actualizado");
        fetchProducts();
      } else {
        toast.error("Error al actualizar stock");
      }
    } catch (error) {
      toast.error("Error al actualizar stock");
    }
  };

  const handleUpdatePrice = async (productId: number, newPrice: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/products?id=${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ price: newPrice }),
      });

      if (response.ok) {
        toast.success("Precio actualizado");
        fetchProducts();
      } else {
        toast.error("Error al actualizar precio");
      }
    } catch (error) {
      toast.error("Error al actualizar precio");
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/products?id=${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFeatured: !product.isFeatured }),
      });

      if (response.ok) {
        toast.success(product.isFeatured ? "Ocultado" : "Destacado");
        fetchProducts();
      } else {
        toast.error("Error al actualizar");
      }
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-champagne" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-medium text-graphite mb-2">
            Panel de Administración
          </h1>
          <p className="text-lg text-graphite/70">
            Gestiona productos, precios y stock
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite/40" />
            <input
              type="text"
              placeholder="Buscar por nombre, referencia, marca o serie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 text-sm"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg border border-pearl p-6">
            <p className="text-sm text-graphite/60 mb-1">Total Productos</p>
            <p className="text-3xl font-bold text-champagne">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-pearl p-6">
            <p className="text-sm text-graphite/60 mb-1">En Stock</p>
            <p className="text-3xl font-bold text-green-600">
              {products.filter((p) => p.stock > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-pearl p-6">
            <p className="text-sm text-graphite/60 mb-1">Sin Stock</p>
            <p className="text-3xl font-bold text-red-600">
              {products.filter((p) => p.stock === 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-pearl p-6">
            <p className="text-sm text-graphite/60 mb-1">Destacados</p>
            <p className="text-3xl font-bold text-champagne">
              {products.filter((p) => p.isFeatured).length}
            </p>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-champagne/10 border border-champagne/30 rounded-lg p-6 mb-8"
        >
          <h2 className="font-heading text-xl font-medium text-graphite mb-3">
            Instrucciones de uso
          </h2>
          <ul className="space-y-2 text-sm text-graphite/70">
            <li className="flex items-start gap-2">
              <span className="text-champagne mt-0.5">•</span>
              <span><strong>Editar precio:</strong> Haz clic en el precio para modificarlo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-champagne mt-0.5">•</span>
              <span><strong>Actualizar stock:</strong> Usa los botones +/- junto al stock o introduce un número</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-champagne mt-0.5">•</span>
              <span><strong>Ocultar/Mostrar:</strong> Usa el icono de ojo para desactivar temporalmente un producto sin eliminarlo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-champagne mt-0.5">•</span>
              <span><strong>Añadir productos:</strong> Para añadir nuevos modelos, usa el database agent o contacta al desarrollador</span>
            </li>
          </ul>
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-pearl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-pearl/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-graphite">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-graphite">
                    Referencia
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-graphite">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-graphite">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-graphite">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-graphite">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl">
                {filteredProducts.map((product) => {
                  let imageUrl = "/images/products/placeholder-watch.webp";
                  if (product.images) {
                    if (typeof product.images === "string") {
                      try {
                        const parsed = JSON.parse(product.images);
                        imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageUrl;
                      } catch {
                        imageUrl = product.images;
                      }
                    } else if (Array.isArray(product.images) && product.images.length > 0) {
                      imageUrl = product.images[0];
                    }
                  }

                  return (
                    <tr key={product.id} className="hover:bg-pearl/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 bg-pearl rounded-lg flex-shrink-0 overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-graphite text-sm">{product.name}</p>
                            <p className="text-xs text-graphite/60">{product.brand} • {product.series}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-graphite">{product.reference}</p>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={product.price}
                          onChange={(e) => handleUpdatePrice(product.id, parseFloat(e.target.value))}
                          className="w-24 px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                        />
                        <span className="ml-1 text-sm text-graphite/60">€</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStock(product.id, Math.max(0, product.stock - 1))}
                            className="w-8 h-8 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors text-sm"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-2 border border-pearl rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-champagne/50"
                          />
                          <button
                            onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-pearl hover:bg-champagne hover:text-ivory rounded transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Sin stock
                          </span>
                        ) : product.stock <= 2 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Bajo stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            En stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.isFeatured
                                ? "bg-champagne text-ivory"
                                : "bg-pearl hover:bg-champagne hover:text-ivory"
                            }`}
                            title={product.isFeatured ? "Ocultar" : "Destacar"}
                          >
                            {product.isFeatured ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-graphite/60">No se encontraron productos</p>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
