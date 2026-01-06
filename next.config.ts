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
        ]
    }
};

export default nextConfig;
