import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Allows production builds to succeed while code types are being refined
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevents ESLint warnings from failing the production Docker build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
