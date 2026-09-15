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
};

export default nextConfig;
