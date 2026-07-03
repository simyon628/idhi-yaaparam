import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["swr"],
    images: {
        formats: ["image/avif", "image/webp"],
        deviceSizes: [375, 414, 640, 750, 828, 1080, 1200],
        imageSizes: [64, 96, 128, 150, 256, 300, 600],
        minimumCacheTTL: 31536000, // 1 year cache
        dangerouslyAllowSVG: false,
        remotePatterns: [
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "firebasestorage.googleapis.com" },
            { protocol: "https", hostname: "res.cloudinary.com" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
        ]
    },
    // Compress responses
    compress: true,
    // Power optimization
    experimental: {
        optimizePackageImports: ["lucide-react", "framer-motion"],
    },
    // Headers for maximum cache performance
    async headers() {
        return [
            {
                source: "/_next/static/(.*)",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
                ],
            },
            {
                source: "/_next/image(.*)",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=31536000, must-revalidate" },
                ],
            },
        ];
    },
};

export default nextConfig;
