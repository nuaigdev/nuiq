import type { NextConfig } from "next";

/**
 * `output: "standalone"` is what the Azure Container Apps Dockerfile needs
 * (CLAUDE.md §4, §7), and it stays the target for production client
 * deployments.
 *
 * Vercel must not get it. Vercel runs its own file tracing and expects the
 * normal build layout; with standalone output the traces land elsewhere and the
 * build fails at the very end with:
 *
 *   ENOENT: no such file or directory, open '.next/next-server.js.nft.json'
 *
 * VERCEL is set by Vercel during its builds, so the same repo produces the right
 * output in both places without a second config file.
 */
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" }),
};

export default nextConfig;
