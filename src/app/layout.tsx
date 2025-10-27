import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "sonner";
import OrganizationSchema from "@/components/OrganizationSchema";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://iwatchworks.com"),
  title: {
    default: "IWatches - Relojes Automáticos Japoneses | Distribuidor Independiente Seiko",
    template: "%s | IWatches"
  },
  description: "Distribuidor independiente especializado en relojes automáticos japoneses Seiko. Autenticidad garantizada, envío asegurado, factura oficial. Catálogo 2025 con modelos exclusivos.",
  keywords: [
    "relojes automáticos japoneses",
    "relojes Seiko España",
    "distribuidor Seiko",
    "relojes automáticos",
    "relojes mecánicos",
    "Seiko 5",
    "Seiko Presage",
    "Seiko GMT",
    "comprar reloj Seiko",
    "relojes de lujo accesibles",
    "relojería japonesa",
    "distribuidor independiente relojes"
  ],
  authors: [{ name: "IWatches" }],
  creator: "IWatches",
  publisher: "IWatches",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "IWatches",
    title: "IWatches - Relojes Automáticos Japoneses | Distribuidor Independiente Seiko",
    description: "Distribuidor independiente especializado en relojes automáticos japoneses Seiko. Autenticidad garantizada, envío asegurado. Catálogo 2025.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "IWatches - Relojes Automáticos Japoneses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IWatches - Relojes Automáticos Japoneses",
    description: "Distribuidor independiente especializado en relojes automáticos japoneses Seiko. Autenticidad garantizada.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <OrganizationSchema />
        <link rel="canonical" href={process.env.NEXTAUTH_URL || "https://iwatchworks.com"} />
      </head>
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <Toaster position="top-right" />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}