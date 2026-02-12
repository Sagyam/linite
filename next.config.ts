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
            {
                protocol: 'https',
                hostname: 'googleusercontent.com',
            },
        ],
        // We handle image optimization ourselves via pre-generated variants
        // This bypasses Vercel's image optimization to avoid 402 payment errors
        unoptimized: true,
    }
};

export default nextConfig;
