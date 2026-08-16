import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint runs as part of `next build` (config in eslint.config.mjs).
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
