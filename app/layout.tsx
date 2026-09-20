import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import JsonLd from "@/components/seo/JsonLd";
import { eventData } from "@/data/eventData";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.eventpointranchi.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${eventData.eventName} ${eventData.year} | ${eventData.edition}`,
    template: `%s | ${eventData.eventName} ${eventData.year}`,
  },
  description: `${eventData.organizer.name} presents ${eventData.eventName} ${eventData.year} on ${eventData.dateDisplay} at ${eventData.venueDisplay}. ${eventData.tagline}.`,
  keywords: [
    "Dandiya Raas 2026",
    "Raas Utsav Ranchi",
    "Garba Night Ranchi",
    "Navratri Dandiya 2026",
    "Chanakya BNR Hotel Dandiya",
    "Dandiya passes Ranchi",
    "Jharkhand Dandiya Night",
    "Event Point Ranchi",
    "Puja Tent Agency",
  ],
  authors: [{ name: eventData.organizer.name, url: siteUrl }],
  creator: eventData.organizer.name,
  publisher: eventData.business.legalName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${eventData.eventName} ${eventData.year} | ${eventData.edition}`,
    description: `${eventData.organizer.name} presents ${eventData.eventName} ${eventData.year} on ${eventData.dateDisplay} at ${eventData.venueDisplay}. ${eventData.tagline}.`,
    url: siteUrl,
    siteName: `${eventData.eventName} ${eventData.year}`,
    images: [
      {
        url: "/images/gallery/celebration.webp",
        width: 1200,
        height: 630,
        alt: `${eventData.eventName} ${eventData.year} Celebration`,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${eventData.eventName} ${eventData.year} | ${eventData.edition}`,
    description: `${eventData.organizer.name} presents ${eventData.eventName} ${eventData.year} on ${eventData.dateDisplay} at ${eventData.venueDisplay}.`,
    images: ["/images/gallery/celebration.webp"],
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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-deep-plum text-warm-cream font-body selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
        <JsonLd />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

