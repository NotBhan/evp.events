import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    qualities: [75],
  },
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "lucy-traditions-stay-appointments.trycloudflare.com",
    "*.trycloudflare.com",
  ],
  async rewrites() {
    return [
      { source: "/terms", destination: "/terms-and-conditions" },
      { source: "/privacy", destination: "/privacy-policy" },
      { source: "/refunds", destination: "/refund-and-cancellation" },
      { source: "/fulfillment", destination: "/shipping-policy" },
    ];
  },
};

export default nextConfig;
