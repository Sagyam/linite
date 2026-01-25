import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images:{
        remotePatterns:[
            {
                protocol: 'https',
                hostname: 'linite.blob.core.windows.net',
            },
            {
                protocol: 'https',
                hostname: 'dl.flathub.org',
            },
        ],
        // Optimize for cost reduction
        deviceSizes: [640, 750, 1080, 1920],
        imageSizes: [16, 32, 48, 64, 96],
        formats: ['image/webp'],
        minimumCacheTTL: 31536000, // 1 year
    }
};

export default nextConfig;
