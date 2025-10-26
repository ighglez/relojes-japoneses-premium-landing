export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IWatches",
    "alternateName": "IWatches España",
    "description": "Distribuidor independiente especializado en relojes automáticos japoneses Seiko. Autenticidad garantizada, envío asegurado, factura oficial.",
    "url": "https://iwatches.vercel.app",
    "logo": "https://iwatches.vercel.app/logo.png",
    "image": "https://iwatches.vercel.app/og-image.jpg",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["Spanish", "es"],
      "areaServed": "ES"
    },
    "areaServed": {
      "@type": "Country",
      "name": "España"
    },
    "priceRange": "€€€",
    "foundingDate": "2025",
    "slogan": "Creemos en el valor, la historia y la precisión.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "47",
      "bestRating": "5",
      "worstRating": "1"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Catálogo de Relojes Automáticos Japoneses 2025",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Relojes Seiko",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Relojes Seiko 5",
                "description": "Colección de relojes automáticos Seiko 5"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Relojes Seiko Presage",
                "description": "Relojes automáticos Seiko Presage"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Relojes Seiko GMT",
                "description": "Relojes automáticos Seiko GMT"
              }
            }
          ]
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}