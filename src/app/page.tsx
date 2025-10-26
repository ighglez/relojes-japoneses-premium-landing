import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedWatches from "@/components/FeaturedWatches";
import CatalogDownload from "@/components/CatalogDownload";
import TrustSection from "@/components/TrustSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ProductSchema from "@/components/ProductSchema";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";

export default function Home() {
  return (
    <>
      <ProductSchema />
      <BreadcrumbSchema 
        items={[
          { name: "Inicio", url: "https://iwatches.vercel.app" },
          { name: "Catálogo", url: "https://iwatches.vercel.app/#catalogo" },
          { name: "Confianza", url: "https://iwatches.vercel.app/#confianza" },
        ]}
      />
      <Navigation />
      <main>
        <Hero />
        <FeaturedWatches />
        <CatalogDownload />
        <TrustSection />
        <ReviewsSection />
        <ContactSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}