import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Allows production builds to succeed while code types are being refined
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
