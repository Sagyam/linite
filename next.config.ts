import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images:{
        remotePatterns:[
            {
                protocol: 'https',
                hostname: '**.public.blob.vercel-storage.com',
            },
            {
                protocol: 'https',
                hostname: 'dl.flathub.org',
            }
        ]
    }
};

export default nextConfig;
