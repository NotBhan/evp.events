import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
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

export const metadata: Metadata = {
  title: `${eventData.eventName} ${eventData.year} | ${eventData.edition}`,
  description: `${eventData.organizer.name} presents ${eventData.eventName} ${eventData.year} on ${eventData.dateDisplay} at ${eventData.venueDisplay}. ${eventData.tagline}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-deep-plum text-warm-cream font-body selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
