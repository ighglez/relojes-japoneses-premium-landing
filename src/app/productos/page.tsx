"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/products/ProductCard";
import { motion } from "framer-motion";
import { Filter, Search, Loader2, X, SlidersHorizontal } from "lucide-react";

interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  series: string;
  reference: string;
  description: string | null;
  movement: string | null;
  diameter: string | null;
  color: string | null;
  waterResistance: string | null;
  price: number;
  currency: string;
  stock: number;
  category: string;
  isNew: boolean;
  isExclusive: boolean;
  isFeatured: boolean;
  images: string[];
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("all");
  const [selectedMovement, setSelectedMovement] = useState("all");
  const [selectedDiameter, setSelectedDiameter] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedSeries, selectedMovement, selectedDiameter, selectedColor, priceRange, sortBy]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=100");
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.reference.toLowerCase().includes(term) ||
          p.series.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // Filters
    if (selectedSeries !== "all") {
      filtered = filtered.filter((p) => p.series === selectedSeries);
    }

    if (selectedMovement !== "all") {
      filtered = filtered.filter((p) => p.movement?.includes(selectedMovement));
    }

    if (selectedDiameter !== "all") {
      filtered = filtered.filter((p) => p.diameter?.includes(selectedDiameter));
    }

    if (selectedColor !== "all") {
      filtered = filtered.filter((p) => p.color?.toLowerCase().includes(selectedColor.toLowerCase()));
    }

    // Price range
    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // relevance
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSeries("all");
    setSelectedMovement("all");
    setSelectedDiameter("all");
    setSelectedColor("all");
    setPriceRange([0, 2000]);
    setSortBy("relevance");
  };

  const series = ["all", ...new Set(products.map((p) => p.series))];
  const movements = ["all", ...new Set(products.map((p) => p.movement).filter(Boolean))];
  const diameters = ["all", ...new Set(products.map((p) => p.diameter).filter(Boolean))];
  const colors = ["all", ...new Set(products.map((p) => p.color).filter(Boolean))];

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedSeries !== "all" ||
    selectedMovement !== "all" ||
    selectedDiameter !== "all" ||
    selectedColor !== "all" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 2000;

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
            Catálogo
          </h1>
          <p className="text-lg text-graphite/70">
            Explora nuestra selección exclusiva de relojes automáticos japoneses
          </p>
        </motion.div>

        {/* Search Bar */}
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
              placeholder="Buscar por referencia, nombre o serie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-pearl rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne/50 text-sm"
            />
          </div>
        </motion.div>

        {/* Filter Toggle & Sort */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-pearl rounded-lg hover:bg-pearl transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4 text-champagne" />
            <span className="text-sm font-medium text-graphite">Filtros</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-champagne text-ivory text-xs rounded-full">
                Activos
              </span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-pearl rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
          >
            <option value="relevance">Relevancia</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="newest">Novedades</option>
            <option value="name">Nombre A-Z</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}

          <div className="ml-auto text-sm text-graphite/60">
            {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-pearl p-6 mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Serie */}
              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Serie</label>
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                >
                  <option value="all">Todas las series</option>
                  {series.filter((s) => s !== "all").map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Movimiento */}
              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Movimiento</label>
                <select
                  value={selectedMovement}
                  onChange={(e) => setSelectedMovement(e.target.value)}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                >
                  <option value="all">Todos</option>
                  {movements.filter((m) => m !== "all").map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Diámetro */}
              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Diámetro</label>
                <select
                  value={selectedDiameter}
                  onChange={(e) => setSelectedDiameter(e.target.value)}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                >
                  <option value="all">Todos</option>
                  {diameters.filter((d) => d !== "all").map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Color</label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full px-3 py-2 border border-pearl rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne/50"
                >
                  <option value="all">Todos los colores</option>
                  {colors.filter((c) => c !== "all").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-graphite mb-2">
                Rango de precio: {priceRange[0]}€ - {priceRange[1]}€
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="flex-1"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-champagne" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-graphite/60 text-lg mb-2">No se encontraron productos</p>
            <p className="text-graphite/40 text-sm mb-4">
              Intenta ajustar los filtros de búsqueda
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-champagne text-ivory rounded-lg hover:bg-opacity-90 transition-all"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}