import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
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
