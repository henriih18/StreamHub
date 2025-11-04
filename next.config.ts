import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ["**/*"],
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
