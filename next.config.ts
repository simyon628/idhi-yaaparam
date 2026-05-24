import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["swr"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
            }
        ]
    }
};

export default nextConfig;
