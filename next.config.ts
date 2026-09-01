import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Azure Container Apps Dockerfile (CLAUDE.md §4).
  output: "standalone",
};

export default nextConfig;
