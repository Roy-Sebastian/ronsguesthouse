import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ronsguesthouse.com";
const siteName = "Ron's Guest House";
const siteDescription =
  "Ron's Guest House — Penginapan & hotel nyaman di Berastagi, Kabupaten Karo, Sumatera Utara. Kamar bersih, fasilitas lengkap, dekat wisata Gunung Sibayak & Gundaling. Harga terjangkau, cocok untuk keluarga & pasangan.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Hotel & Penginapan di Berastagi`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "penginapan berastagi",
    "hotel berastagi",
    "guest house berastagi",
    "penginapan murah berastagi",
    "hotel murah berastagi",
    "villa berastagi",
    "guest house karo",
    "penginapan karo sumatera utara",
    "hotel dekat gunung sibayak",
    "penginapan dekat gundaling",
    "wisata berastagi menginap",
    "hotel berastagi murah keluarga",
    "ron's guest house",
    "ronsguesthouse",
    "penginapan nyaman berastagi",
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} | Hotel & Penginapan Terbaik di Berastagi`,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Ron's Guest House - Penginapan di Berastagi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Hotel & Penginapan di Berastagi`,
    description: siteDescription,
    images: [`${siteUrl}/og-image.jpg`],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "travel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD Structured Data for Local Business
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LodgingBusiness",
        "@id": `${siteUrl}/#lodging`,
        name: "Ron's Guest House",
        alternateName: ["Rons Guest House", "Ron Guesthouse Berastagi"],
        description:
          "Penginapan dan hotel nyaman di Berastagi, Kabupaten Karo, Sumatera Utara. Tersedia berbagai tipe kamar mulai dari Standard hingga Family Suite, fasilitas lengkap, parkir luas, dekat objek wisata Gunung Sibayak, Bukit Gundaling, dan Pasar Buah Berastagi.",
        url: siteUrl,
        telephone: "+628127573588",
        email: "info@ronsguesthouse.com",
        priceRange: "$$",
        starRating: {
          "@type": "Rating",
          ratingValue: "4",
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: "Jl. Perwira Gg. Kaliaga No. 5, Gundaling I",
          addressLocality: "Berastagi",
          addressRegion: "Kabupaten Karo, Sumatera Utara",
          postalCode: "22156",
          addressCountry: "ID",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: "3.1900",
          longitude: "98.5020",
        },
        hasMap: "https://maps.google.com/?q=Ron%27s+Guest+House+Berastagi",
        currenciesAccepted: "IDR",
        paymentAccepted: "Cash, Credit Card, Bank Transfer",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
        amenityFeature: [
          { "@type": "LocationFeatureSpecification", name: "Free WiFi", value: true },
          { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
          { "@type": "LocationFeatureSpecification", name: "24-hour Front Desk", value: true },
          { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
        ],
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
        },
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Ron's Guest House",
        description: siteDescription,
        publisher: { "@id": `${siteUrl}/#lodging` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?checkIn={check_in}&checkOut={check_out}`,
          },
          "query-input": "required name=check_in required name=check_out",
        },
        inLanguage: "id-ID",
      },
    ],
  };

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="geo.region" content="ID-SU" />
        <meta name="geo.placename" content="Berastagi, Kabupaten Karo, Sumatera Utara" />
        <meta name="geo.position" content="3.1900;98.5020" />
        <meta name="ICBM" content="3.1900, 98.5020" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script
          src={
            process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
              ? 'https://app.midtrans.com/snap/snap.js'
              : 'https://app.sandbox.midtrans.com/snap/snap.js'
          }
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
