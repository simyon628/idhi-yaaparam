import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error - eslint config is valid in Next.js but types might be outdated
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
