export default function ProductSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Catálogo Relojes Automáticos Japoneses 2025",
    "description": "Catálogo completo de relojes automáticos japoneses Seiko con envío asegurado y autenticidad garantizada. Modelos Seiko 5, Presage, GMT y más.",
    "brand": {
      "@type": "Brand",
      "name": "Seiko"
    },
    "category": "Relojes Automáticos",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2026-12-31",
      "seller": {
        "@type": "Organization",
        "name": "IWatches"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "47",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
