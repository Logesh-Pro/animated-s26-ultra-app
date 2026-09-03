import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/animated-s26-ultra-app",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
