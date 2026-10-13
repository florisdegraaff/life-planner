import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    position: 'bottom-right', // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  },
  experimental: {
    agentFeedback: true,
    // Bank CSV exports covering a year or more easily exceed the 1MB default.
    serverActions: { bodySizeLimit: "5mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
